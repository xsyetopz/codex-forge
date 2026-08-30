import { describe, expect, test } from "bun:test";
import { terminateCodexProcesses } from "../../../plugins/codex-forge/scripts/installer/processes.mjs";

describe("Codex process termination", () => {
	const processRow = (pid, executable = "/Applications/Codex.app/Codex") => ({
		pid,
		class: "codex",
		start_identity: "1000",
		argv: [executable],
		entrypoint: executable,
		identity: {
			pid,
			owner: 1000,
			start_identity: "1000",
			executable,
			argv: [executable],
			entrypoint: executable,
			class: "codex",
			parent: { pid: 1 },
		},
		parent_identity: { pid: 1 },
	});
	const runTermination = (
		snapshots,
		inspected = snapshots.flatMap((value) => value),
	) => {
		let index = 0;
		const signals = [];
		const inspections = [...inspected];
		terminateCodexProcesses({
			enumerate: () => snapshots[Math.min(index++, snapshots.length - 1)],
			inspect: () => inspections.shift() ?? null,
			signal: (pid, signal) => signals.push([pid, signal]),
			sleep: () => {},
			now: () => 0,
		});
		return signals;
	};

	test("uses TERM, late-arrival TERM, then KILL with injected dependencies", () => {
		const a = processRow(10);
		const b = processRow(11);
		expect(runTermination([[a], [a, b], [a, b], []], [a, b, a, b])).toEqual([
			[10, "SIGTERM"],
			[11, "SIGTERM"],
			[10, "SIGKILL"],
			[11, "SIGKILL"],
		]);
		const initiallyEmpty = processRow(17);
		expect(
			runTermination(
				[[], [initiallyEmpty], [initiallyEmpty], [initiallyEmpty], []],
				[initiallyEmpty, initiallyEmpty],
			),
		).toEqual([
			[17, "SIGTERM"],
			[17, "SIGKILL"],
		]);
	});

	test("treats disappearance and ESRCH as success", () => {
		expect(runTermination([[]])).toEqual([]);
		const a = processRow(12);
		expect(runTermination([[a], [], [], []], [null])).toEqual([]);
		let calls = 0;
		terminateCodexProcesses({
			enumerate: () => [[a], [], [], []][calls++],
			inspect: () => a,
			signal: () => {
				const error = new Error("gone");
				error.code = "ESRCH";
				throw error;
			},
			sleep: () => {},
			now: () => 0,
		});
	});

	test("aborts on EPERM and final late arrivals", () => {
		const a = processRow(15);
		let inspected = 0;
		expect(() =>
			terminateCodexProcesses({
				enumerate: () => [a],
				inspect: () => a,
				signal: () => {
					const error = new Error("denied");
					error.code = "EPERM";
					throw error;
				},
				sleep: () => {},
				now: () => inspected++,
			}),
		).toThrow("unable to signal Codex process pid 15");
		const b = processRow(16);
		let index = 0;
		const signals = [];
		expect(() =>
			terminateCodexProcesses({
				enumerate: () => [[a], [a], [a], [a, b]][Math.min(index++, 3)],
				inspect: () => a,
				signal: (pid, signal) => signals.push([pid, signal]),
				sleep: () => {},
				now: () => 0,
			}),
		).toThrow("survived termination");
		expect(signals).toEqual([
			[15, "SIGTERM"],
			[15, "SIGKILL"],
		]);
	});

	test("refuses PID reuse before signaling and persistent survivors", () => {
		const a = processRow(13);
		const replacement = {
			...processRow(13, "/Applications/Codex.app/Codex"),
			start_identity: "2000",
			identity: { ...a.identity, start_identity: "2000" },
		};
		expect(() =>
			runTermination([[a], [a], [replacement]], [replacement]),
		).toThrow("identity changed");
		const survivor = processRow(14);
		const signals = [];
		let index = 0;
		expect(() =>
			terminateCodexProcesses({
				enumerate: () =>
					[[survivor], [survivor], [survivor], [survivor]][
						Math.min(index++, 3)
					],
				inspect: () => survivor,
				signal: (pid, signal) => signals.push([pid, signal]),
				sleep: () => {},
				now: () => 0,
			}),
		).toThrow("survived termination");
		expect(signals).toEqual([
			[14, "SIGTERM"],
			[14, "SIGKILL"],
		]);
	});
});
