#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";

const args = Object.fromEntries(
	process.argv.slice(2).map((arg) => {
		const [key, ...rest] = arg.replace(/^--/, "").split("=");
		return [key, rest.join("=") || true];
	}),
);
const root = resolve(import.meta.dir, "../..");
const sourceDataset = resolve(
	String(args.dataset || resolve(root, ".benchmark-cache/deep-swe/tasks")),
);
const outputDataset = resolve(
	String(args.output || resolve(import.meta.dir, "results/forge-tasks")),
);
const task = String(args.task || "");
if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(task))
	throw new Error(`Invalid task name: ${task}`);
if (!task || !existsSync(resolve(sourceDataset, task, "task.toml")))
	throw new Error(`Unknown task: ${task}`);

const plugin = resolve(root, "plugins/codex-forge");

const tomlValue = (value) => {
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "boolean" || typeof value === "number")
		return String(value);
	if (Array.isArray(value)) return `[${value.map(tomlValue).join(", ")}]`;
	throw new TypeError(`Unsupported Forge hook value: ${typeof value}`);
};

const stockHookCommand = (command) => {
	const match = String(command).match(
		/^\s*\S+\s+["']?\$PLUGIN_ROOT\/([^"'\s]+)["']?\s*$/,
	);
	if (!match)
		throw new Error(`Unsupported Forge hook command for DeepSWE: ${command}`);
	return `node /opt/codex-forge-plugin/plugins/codex-forge/${match[1]}`;
};

const managedHookToml = () => {
	const manifest = JSON.parse(
		readFileSync(resolve(plugin, "hooks/hooks.json"), "utf8"),
	);
	const supportedFields = new Set([
		"type",
		"command",
		"timeout",
		"statusMessage",
		"commandWindows",
		"async",
	]);
	const lines = [
		"[hooks]",
		'managed_dir = "/opt/codex-forge-plugin/plugins/codex-forge"',
	];
	for (const [event, groups] of Object.entries(manifest.hooks ?? {})) {
		for (const group of groups) {
			lines.push(`[[hooks.${event}]]`);
			if (group.matcher !== undefined)
				lines.push(`matcher = ${tomlValue(group.matcher)}`);
			for (const handler of group.hooks ?? []) {
				if (handler.type !== "command")
					throw new Error(`Unsupported Forge hook type: ${handler.type}`);
				lines.push(`[[hooks.${event}.hooks]]`);
				for (const [key, value] of Object.entries(handler)) {
					// ConfigRequirementsToml does not accept this plugin-only field.
					if (key === "additionalContextLimit") continue;
					if (!supportedFields.has(key)) continue;
					const projected = key === "command" ? stockHookCommand(value) : value;
					lines.push(`${key} = ${tomlValue(projected)}`);
				}
			}
		}
	}
	return `${lines.join("\n")}\n`;
};

const requirementsToml = managedHookToml();
const hash = createHash("sha256");
const hashTree = (dir) => {
	for (const name of readdirSync(dir).sort()) {
		const path = resolve(dir, name);
		if (statSync(path).isDirectory()) hashTree(path);
		else {
			hash.update(path.slice(plugin.length));
			hash.update(readFileSync(path));
		}
	}
};
hashTree(plugin);
hash.update("\0requirements.toml\0");
hash.update(requirementsToml);
const digest = hash.digest("hex").slice(0, 12);
const sourceTask = resolve(sourceDataset, task);
const targetTask = resolve(outputDataset, task);
rmSync(targetTask, { recursive: true, force: true });
mkdirSync(outputDataset, { recursive: true });
cpSync(sourceTask, targetTask, { recursive: true });

const taskToml = resolve(targetTask, "task.toml");
const text = readFileSync(taskToml, "utf8");
const match = text.match(/^docker_image\s*=\s*"([^"]+)"/m);
if (!match) throw new Error(`docker_image not found in ${taskToml}`);
const image = `codex-forge-deepswe-${basename(task)
	.toLowerCase()
	.replace(/[^a-z0-9_.-]/g, "-")}:${digest}`;
const context = resolve(
	import.meta.dir,
	"results/image-contexts",
	`${task}-${digest}`,
);
if (!existsSync(context)) {
	mkdirSync(context, { recursive: true });
	cpSync(plugin, resolve(context, "codex-forge"), { recursive: true });
}
writeFileSync(
	resolve(context, "Dockerfile"),
	`ARG BASE_IMAGE\nFROM \${BASE_IMAGE}\nCOPY codex-forge /opt/codex-forge-plugin/plugins/codex-forge\nCOPY requirements.toml /etc/codex/requirements.toml\n`,
);
writeFileSync(resolve(context, "requirements.toml"), requirementsToml);
const inspect = spawnSync("docker", ["image", "inspect", image], {
	stdio: "ignore",
});
if (inspect.status !== 0) {
	const build = spawnSync(
		"docker",
		[
			"build",
			"--quiet",
			"--build-arg",
			`BASE_IMAGE=${match[1]}`,
			"-t",
			image,
			context,
		],
		{ encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
	);
	if (build.status !== 0)
		throw new Error(`Failed to build Forge layer for ${task}`);
}
writeFileSync(taskToml, text.replace(match[0], `docker_image = "${image}"`));
console.log(outputDataset);
