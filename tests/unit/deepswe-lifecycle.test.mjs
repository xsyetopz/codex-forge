import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { acquireJobLease } from "../../benchmarks/deepswe/job-lease.mjs";
import { runPierWithCleanup } from "../../benchmarks/deepswe/pier-lifecycle.mjs";

const lifecycleModule = pathToFileURL(
	resolve(import.meta.dir, "../../benchmarks/deepswe/pier-lifecycle.mjs"),
).href;

const waitFor = async (predicate, timeoutMs = 3_000) => {
	const deadline = Date.now() + timeoutMs;
	while (!predicate()) {
		if (Date.now() >= deadline)
			throw new Error("timed out waiting for fixture");
		await Bun.sleep(10);
	}
};

describe("DeepSWE Pier lifecycle", () => {
	test("waits for concurrent Pier trials to preserve artifacts before cleanup", async () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-pier-lifecycle-"));
		try {
			const fakePier = resolve(temp, "fake-pier.mjs");
			const artifacts = resolve(temp, "artifacts");
			const log = resolve(temp, "order.log");
			writeFileSync(
				fakePier,
				`import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
const [artifacts, log] = process.argv.slice(2);
mkdirSync(artifacts, { recursive: true });
await Promise.all([
  Bun.sleep(30).then(() => {
    mkdirSync(artifacts + "/trial-1/agent/sessions", { recursive: true });
    mkdirSync(artifacts + "/trial-1/artifacts", { recursive: true });
    mkdirSync(artifacts + "/trial-1/verifier", { recursive: true });
    writeFileSync(artifacts + "/trial-1/agent/sessions/rollout.jsonl", "session");
    writeFileSync(artifacts + "/trial-1/artifacts/model.patch", "patch");
    writeFileSync(artifacts + "/trial-1/verifier/reward.json", "reward");
  }),
  Bun.sleep(10).then(() => {
    mkdirSync(artifacts + "/trial-2/artifacts", { recursive: true });
    writeFileSync(artifacts + "/trial-2/artifacts/model.patch", "patch");
  }),
]);
appendFileSync(log, "pier-complete\\n");
`,
			);
			await runPierWithCleanup({
				command: process.execPath,
				args: [fakePier, artifacts, log],
				cleanup() {
					expect(
						readFileSync(
							resolve(artifacts, "trial-1/agent/sessions/rollout.jsonl"),
							"utf8",
						),
					).toBe("session");
					expect(
						readFileSync(
							resolve(artifacts, "trial-1/artifacts/model.patch"),
							"utf8",
						),
					).toBe("patch");
					expect(
						readFileSync(
							resolve(artifacts, "trial-1/verifier/reward.json"),
							"utf8",
						),
					).toBe("reward");
					expect(
						readFileSync(
							resolve(artifacts, "trial-2/artifacts/model.patch"),
							"utf8",
						),
					).toBe("patch");
					appendFileSync(log, "cleanup\n");
				},
			});
			expect(readFileSync(log, "utf8")).toBe("pier-complete\ncleanup\n");
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("gracefully interrupts Pier and still runs deterministic cleanup", async () => {
		if (process.platform === "win32") return;
		const temp = mkdtempSync(resolve(tmpdir(), "forge-pier-interrupt-"));
		try {
			const fakePier = resolve(temp, "fake-pier.mjs");
			const fixture = resolve(temp, "fixture.mjs");
			const ready = resolve(temp, "ready");
			const artifact = resolve(temp, "artifact");
			const log = resolve(temp, "order.log");
			writeFileSync(
				fakePier,
				`import { appendFileSync, writeFileSync } from "node:fs";
const [ready, artifact, log] = process.argv.slice(2);
writeFileSync(ready, "ready");
process.on("SIGINT", () => {
  writeFileSync(artifact, "saved");
  appendFileSync(log, "pier-interrupted\\n");
  process.exit(0);
});
setInterval(() => {}, 1000);
`,
			);
			writeFileSync(
				fixture,
				`import { appendFileSync, readFileSync } from "node:fs";
import { PierInterruptedError, runPierWithCleanup } from ${JSON.stringify(lifecycleModule)};
const [fakePier, ready, artifact, log] = process.argv.slice(2);
try {
  await runPierWithCleanup({
    command: process.execPath,
    args: [fakePier, ready, artifact, log],
    cleanup() {
      appendFileSync(log, "cleanup:" + readFileSync(artifact, "utf8") + "\\n");
    },
    interruptGraceMs: 1000,
  });
} catch (error) {
  if (!(error instanceof PierInterruptedError)) throw error;
  process.exitCode = 143;
}
`,
			);
			const child = spawn(
				process.execPath,
				[fixture, fakePier, ready, artifact, log],
				{
					stdio: "ignore",
				},
			);
			await waitFor(() => existsSync(ready));
			child.kill("SIGTERM");
			const code = await new Promise((resolveExit) =>
				child.once("close", resolveExit),
			);
			expect(code).toBe(143);
			expect(readFileSync(log, "utf8")).toBe(
				"pier-interrupted\ncleanup:saved\n",
			);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("rejects a concurrent owner and recovers a dead runner lease", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-pier-lease-"));
		try {
			const job = resolve(temp, "job");
			mkdirSync(job);
			const live = acquireJobLease(job);
			expect(() => acquireJobLease(job)).toThrow("already active");
			live.release();

			writeFileSync(`${job}.runner.json`, '{"pid":2147483647}\n');
			const recovered = acquireJobLease(job);
			expect(existsSync(recovered.path)).toBe(true);
			recovered.release();
			expect(existsSync(recovered.path)).toBe(false);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});
});
