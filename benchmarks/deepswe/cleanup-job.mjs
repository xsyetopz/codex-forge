#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

const job = resolve(process.argv[2] || "");
if (!existsSync(job)) throw new Error(`Job directory not found: ${job}`);

const docker = (args) => {
	const result = spawnSync("docker", args, { encoding: "utf8" });
	if (result.status !== 0)
		throw new Error(result.stderr.trim() || `docker ${args.join(" ")} failed`);
	return result.stdout.trim();
};
const containerIds = (trial) =>
	docker(["ps", "-aq", "--filter", `name=^/${trial}(__|-)`])
		.split(/\s+/)
		.filter(Boolean);
const networkIds = (trial) =>
	docker([
		"network",
		"ls",
		"--format",
		'{{.ID}}\t{{.Label "com.docker.compose.project"}}',
	])
		.split("\n")
		.filter(Boolean)
		.flatMap((line) => {
			const [id, project = ""] = line.split("\t");
			return project === trial || project.startsWith(`${trial}__`) ? [id] : [];
		});

const trials = readdirSync(job, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => basename(entry.name).toLowerCase());
for (const trial of trials) {
	const containers = containerIds(trial);
	if (containers.length) docker(["rm", "-f", ...containers]);
	const networks = networkIds(trial);
	if (networks.length) docker(["network", "rm", ...networks]);
	const remainingContainers = containerIds(trial);
	const remainingNetworks = networkIds(trial);
	if (remainingContainers.length || remainingNetworks.length)
		throw new Error(
			`cleanup verification failed for ${trial}: ${remainingContainers.length} containers and ${remainingNetworks.length} networks remain`,
		);
}
console.log(
	JSON.stringify({ containers_verified: true, trials: trials.length }),
);
