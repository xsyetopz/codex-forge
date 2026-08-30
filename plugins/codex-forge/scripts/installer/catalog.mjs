import { spawn } from "node:child_process";
import {
	existsSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
	writeSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { which } from "../lib/process.mjs";
import { FALLBACK_CATALOG_SOURCE } from "./owners/catalog-contract.mjs";

export const FORGE_CATALOG_SLUGS = [
	"gpt-5.6-sol",
	"gpt-5.6-terra",
	"gpt-5.6-luna",
];
export const DEFAULT_CATALOG_TIMEOUT_MS = 10_000;
export const DEFAULT_CATALOG_TERMINATION_GRACE_MS = 500;
export const DEFAULT_CATALOG_OUTPUT_LIMIT_BYTES = 2 * 1024 * 1024;

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export {
	FALLBACK_CATALOG_SOURCE,
	forgeCatalogTarget,
	GENERATED_CATALOG_SOURCE,
} from "./owners/catalog-contract.mjs";

function extractJsonObject(text) {
	const start = text.indexOf("{");
	if (start < 0) return null;
	try {
		JSON.parse(text.slice(start));
	} catch {
		return null;
	}
	return text.slice(start);
}

export function applyForgeCatalogPatches(catalog) {
	if (!catalog || !Array.isArray(catalog.models))
		throw new Error("model catalog is missing a models array");
	// Codex 0.151.0 sends custom base instructions as an additive developer
	// message in Responses Lite. Standard Responses preserves replacement.
	const models = catalog.models.map((model) => {
		if (!FORGE_CATALOG_SLUGS.includes(model.slug)) return model;
		if (!model.display_name)
			throw new Error(
				`model catalog entry ${model.slug} is missing display_name`,
			);
		return {
			...model,
			multi_agent_version: "v1",
			use_responses_lite: false,
		};
	});
	for (const slug of FORGE_CATALOG_SLUGS)
		if (!models.some((model) => model.slug === slug))
			throw new Error(`model catalog is missing ${slug}`);
	return { ...catalog, models };
}

export function serializeForgeCatalog(catalog) {
	return `${JSON.stringify(catalog, null, 2)}\n`;
}

export function catalogHasForgeV1(catalog) {
	return FORGE_CATALOG_SLUGS.every((slug) => {
		const model = catalog.models?.find((item) => item.slug === slug);
		return (
			Boolean(model?.display_name) &&
			model.multi_agent_version === "v1" &&
			model.use_responses_lite === false
		);
	});
}

export function forgeCatalogSatisfiesContract(path) {
	try {
		return (
			existsSync(path) &&
			catalogHasForgeV1(JSON.parse(readFileSync(path, "utf8")))
		);
	} catch {
		return false;
	}
}

function killProcessTree(child, signal, signalProcess = process.kill) {
	if (!child.pid || (process.platform === "win32" && child.killed))
		return false;
	try {
		if (process.platform === "win32") child.kill(signal);
		else signalProcess(-child.pid, signal);
		return true;
	} catch (error) {
		// A detached group can disappear between exit and close, or be owned by
		// another supervisor. Treat that race as an unverified signal, not an
		// uncaught async exception; callers retain the cleanup diagnostic.
		if (error?.code === "ESRCH" || error?.code === "EPERM") return false;
		throw error;
	}
}

export function runBundledCatalog({
	executable,
	env = process.env,
	timeoutMs = DEFAULT_CATALOG_TIMEOUT_MS,
	terminationGraceMs = DEFAULT_CATALOG_TERMINATION_GRACE_MS,
	outputLimitBytes = DEFAULT_CATALOG_OUTPUT_LIMIT_BYTES,
	signalProcess = process.kill,
	onSettlement = null,
} = {}) {
	return new Promise((resolveResult) => {
		const started = Date.now();
		let child;
		try {
			child = spawn(executable, ["debug", "models", "--bundled"], {
				detached: process.platform !== "win32",
				env,
				stdio: ["ignore", "pipe", "pipe"],
			});
		} catch (error) {
			resolveResult({
				status: null,
				signal: null,
				stdout: "",
				stderr: "",
				reason: "spawn_error",
				error: error.message,
				duration_ms: Date.now() - started,
			});
			return;
		}

		let stdout = "";
		let stderr = "";
		let outputBytes = 0;
		let terminalReason = null;
		let settled = false;
		let forceTimer = null;
		let resolveTimer = null;
		let timeoutTimer = null;
		let termSent = false;
		let killSent = false;
		let closeFinalized = false;
		let closeResult = null;
		const sendTerm = () => {
			if (termSent) return false;
			termSent = true;
			return killProcessTree(child, "SIGTERM", signalProcess);
		};
		const sendKill = () => {
			if (killSent) return false;
			killSent = true;
			return killProcessTree(child, "SIGKILL", signalProcess);
		};
		const groupExists = () => {
			if (process.platform === "win32" || !child.pid) return false;
			try {
				signalProcess(-child.pid, 0);
				return true;
			} catch (error) {
				if (error?.code === "ESRCH") return false;
				if (error?.code === "EPERM") return true;
				throw error;
			}
		};
		const waitForGroupGone = (limitMs) =>
			new Promise((resolveGone) => {
				const deadline = Date.now() + limitMs;
				const poll = () => {
					let exists;
					try {
						exists = groupExists();
					} catch (error) {
						return resolveGone({ gone: false, error });
					}
					if (!exists || Date.now() >= deadline)
						return resolveGone({ gone: !exists, error: null });
					resolveTimer = setTimeout(poll, 20);
					resolveTimer.unref?.();
				};
				poll();
			});
		const releaseChild = () => {
			child.stdout?.removeAllListeners();
			child.stderr?.removeAllListeners();
			child.removeAllListeners();
			child.stdout?.destroy();
			child.stderr?.destroy();
			child.unref();
		};
		const finish = ({ status = null, signal = null, error = null } = {}) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeoutTimer);
			clearTimeout(forceTimer);
			clearTimeout(resolveTimer);
			resolveResult({
				status,
				signal,
				stdout,
				stderr,
				reason: terminalReason,
				error,
				duration_ms: Date.now() - started,
			});
		};
		const terminate = (reason) => {
			if (terminalReason) return;
			terminalReason = reason;
			sendTerm();
			forceTimer = setTimeout(() => {
				const killDelivered = sendKill();
				void waitForGroupGone(terminationGraceMs).then(
					({ gone, error: cleanupError }) => {
						if (cleanupError) terminalReason ||= "cleanup_error";
						onSettlement?.({ branch: "timer", gone, killDelivered });
						releaseChild();
						finish({
							status: closeResult?.status ?? null,
							signal: gone && killDelivered ? "SIGKILL" : null,
							error:
								cleanupError?.message ??
								(gone && killDelivered
									? null
									: gone
										? "SIGKILL delivery was not verified"
										: killDelivered
											? "detached process group remained alive after bounded SIGKILL cleanup"
											: "SIGKILL delivery was not verified"),
						});
					},
				);
			}, terminationGraceMs);
		};
		const collect = (kind, chunk) => {
			outputBytes += chunk.length;
			if (outputBytes > outputLimitBytes) {
				terminate("output_limit");
				return;
			}
			if (kind === "stdout") stdout += chunk;
			else stderr += chunk;
		};
		child.stdout.on("data", (chunk) => collect("stdout", chunk));
		child.stderr.on("data", (chunk) => collect("stderr", chunk));
		child.on("error", (error) => {
			terminalReason ||= "spawn_error";
			sendTerm();
			finish({ error: error.message });
		});
		child.on("exit", () => {
			// Signal descendants while the detached group still exists. close is
			// only stream/descriptor cleanup and never re-signals a lost owner.
			if (!terminalReason) sendTerm();
		});
		child.on("close", (status, signal) => {
			// The child owns a detached process group. Clear any descendants that
			// closed their stdio before the group leader exited, then release every
			// listener/stream held by this helper.
			if (closeFinalized) return;
			closeResult = { status, signal };
			if (terminalReason && !killSent) return;
			closeFinalized = true;
			void (async () => {
				let probe = await waitForGroupGone(terminationGraceMs);
				let cleanupSignal = signal;
				let cleanupError = probe.error;
				let killDelivered = null;
				if (!probe.gone && !cleanupError) {
					killDelivered = sendKill();
					probe = await waitForGroupGone(terminationGraceMs);
					cleanupSignal = probe.gone && killDelivered ? "SIGKILL" : signal;
					cleanupError =
						probe.error ??
						(probe.gone && killDelivered
							? null
							: probe.gone
								? "SIGKILL delivery was not verified"
								: killDelivered
									? "detached process group remained alive after bounded SIGKILL cleanup"
									: "SIGKILL delivery was not verified");
				}
				if (cleanupError) terminalReason ||= "cleanup_error";
				onSettlement?.({ branch: "close", gone: probe.gone, killDelivered });
				releaseChild();
				finish({
					status,
					signal: cleanupSignal,
					error: cleanupError?.message ?? cleanupError,
				});
			})();
		});
		timeoutTimer = setTimeout(() => terminate("timeout"), timeoutMs);
	});
}

export function checkedInSnapshot(pluginRoot = PLUGIN_ROOT) {
	const fallback = join(pluginRoot, FALLBACK_CATALOG_SOURCE);
	if (!existsSync(fallback))
		throw new Error(
			"unable to load the checked-in Codex model catalog for Forge",
		);
	const text = readFileSync(fallback, "utf8");
	const catalog = JSON.parse(text);
	if (!catalogHasForgeV1(catalog))
		throw new Error("checked-in Forge model catalog violates the V1 contract");
	return {
		text,
		source: "checked-in-pinned",
		diagnostic: null,
	};
}

export async function generateForgeCatalogSnapshot({
	pluginRoot = PLUGIN_ROOT,
	executable,
	env = process.env,
	timeoutMs,
	terminationGraceMs,
	outputLimitBytes,
	signalProcess,
} = {}) {
	const fallback = checkedInSnapshot(pluginRoot);
	if (!executable)
		return {
			...fallback,
			diagnostic: {
				reason: "codex_not_found",
				message: "codex is unavailable; selected the checked-in catalog",
			},
		};

	const result = await runBundledCatalog({
		executable,
		env,
		timeoutMs,
		terminationGraceMs,
		outputLimitBytes,
		signalProcess,
	});
	let reason = result.reason;
	if (!reason && result.error) reason = "cleanup_error";
	if (!reason && result.status !== 0) reason = "nonzero_exit";
	const raw = reason
		? null
		: extractJsonObject(`${result.stdout ?? ""}`.trim());
	if (!reason && !raw) reason = "malformed_output";
	if (!reason) {
		try {
			const catalog = applyForgeCatalogPatches(JSON.parse(raw));
			return {
				text: serializeForgeCatalog(catalog),
				source: "host-bundled",
				diagnostic: null,
			};
		} catch (error) {
			reason = "invalid_contract";
			result.error = error.message;
		}
	}
	return {
		...fallback,
		diagnostic: {
			reason,
			message: `host bundled catalog ${reason}; selected the checked-in catalog`,
			status: result.status,
			signal: result.signal,
			error: result.error,
			duration_ms: result.duration_ms,
		},
	};
}

export async function generateForgeCatalogText(options = {}) {
	return (await generateForgeCatalogSnapshot(options)).text;
}

function numberFlag(arguments_, name, fallback) {
	const value = arguments_
		.find((item) => item.startsWith(`${name}=`))
		?.slice(name.length + 1);
	if (value === undefined) return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0)
		throw new Error(`${name} requires a positive number`);
	return parsed;
}

function atomicWrite(path, contents) {
	const temporary = join(
		dirname(path),
		`.${basename(path)}.${process.pid}.${Date.now()}.tmp`,
	);
	try {
		writeFileSync(temporary, contents, { flag: "wx" });
		renameSync(temporary, path);
	} finally {
		rmSync(temporary, { force: true });
	}
}

export async function main(arguments_ = process.argv.slice(2)) {
	const writeFlag = arguments_.find((item) => item.startsWith("--write="));
	if (!writeFlag?.slice("--write=".length))
		throw new Error("catalog refresh requires --write=<path>");
	const output = resolve(writeFlag.slice("--write=".length));
	const executableFlag = arguments_.find((item) => item.startsWith("--codex="));
	const executable =
		executableFlag?.slice("--codex=".length) || (await which("codex"));
	const snapshot = await generateForgeCatalogSnapshot({
		pluginRoot: PLUGIN_ROOT,
		executable,
		timeoutMs: numberFlag(
			arguments_,
			"--timeout-ms",
			DEFAULT_CATALOG_TIMEOUT_MS,
		),
		terminationGraceMs: numberFlag(
			arguments_,
			"--termination-grace-ms",
			DEFAULT_CATALOG_TERMINATION_GRACE_MS,
		),
	});
	if (snapshot.diagnostic)
		throw new Error(`${snapshot.diagnostic.message}; pinned catalog unchanged`);
	atomicWrite(output, snapshot.text);
	return output;
}

if (import.meta.main) {
	try {
		writeSync(1, `${await main()}\n`);
		process.exit(0);
	} catch (error) {
		writeSync(2, `${error.message}\n`);
		process.exit(1);
	}
}
