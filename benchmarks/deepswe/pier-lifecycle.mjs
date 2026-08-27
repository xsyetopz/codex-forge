import { spawn } from "node:child_process";

const SIGNALS = ["SIGINT", "SIGTERM"];

export class PierInterruptedError extends Error {
	constructor(signal) {
		super(`Pier interrupted by ${signal}`);
		this.name = "PierInterruptedError";
		this.signal = signal;
	}
}

export async function runPierWithCleanup({
	command = "pier",
	args,
	cwd,
	env = process.env,
	cleanup,
	interruptGraceMs = 30_000,
}) {
	if (typeof cleanup !== "function")
		throw new TypeError("cleanup must be a function");

	const child = spawn(command, args, {
		cwd,
		env,
		stdio: ["inherit", "inherit", "inherit"],
	});
	let interruptedSignal = null;
	let forceTimer = null;
	const listeners = new Map();

	const removeSignalListeners = () => {
		for (const [signal, listener] of listeners)
			process.removeListener(signal, listener);
	};

	for (const signal of SIGNALS) {
		const listener = () => {
			if (interruptedSignal) return;
			interruptedSignal = signal;
			// Pier's asyncio runner handles SIGINT as a graceful cancellation. Give it
			// one bounded window to collect logs/artifacts before deterministic cleanup.
			child.kill("SIGINT");
			forceTimer = setTimeout(() => child.kill("SIGKILL"), interruptGraceMs);
			forceTimer.unref?.();
		};
		listeners.set(signal, listener);
		process.on(signal, listener);
	}

	let processError = null;
	try {
		await new Promise((resolve, reject) => {
			child.once("error", reject);
			child.once("close", (code, signal) => {
				if (interruptedSignal) {
					reject(new PierInterruptedError(interruptedSignal));
					return;
				}
				if (code !== 0) {
					reject(
						new Error(
							`${command} failed with ${code ?? `signal ${signal ?? "unknown"}`}`,
						),
					);
					return;
				}
				resolve();
			});
		});
	} catch (error) {
		processError = error;
	} finally {
		if (forceTimer) clearTimeout(forceTimer);
		try {
			await cleanup();
		} finally {
			removeSignalListeners();
		}
	}

	if (processError) throw processError;
}
