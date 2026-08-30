import { describe, test } from "bun:test";
import {
	delimiter,
	existsSync,
	expect,
	fakeCodex,
	fixture,
	installerLockPaths,
	join,
	ROOT,
	runInstaller,
	withInstallerLock,
	writeFileSync,
} from "./support.mjs";

describe("installer locking and process safety", () => {
	test("a real child holding the lock blocks a second reinstall", async () => {
		const { root, home } = fixture();
		const holder = join(root, "hold-lock.mjs");
		const ready = join(root, "ready");
		const release = join(root, "release");
		writeFileSync(
			holder,
			`import { existsSync, writeFileSync } from "node:fs";\nimport { acquireInstallerLock } from ${JSON.stringify(join(ROOT, "plugins/codex-forge/scripts/installer/owners/transaction.mjs"))};\nconst lock = acquireInstallerLock(process.env.CODEX_HOME);\nwriteFileSync(process.argv[2], "ready");\nwhile (!existsSync(process.argv[3])) await Bun.sleep(10);\nlock.release();\n`,
		);
		const child = Bun.spawn(["bun", holder, ready, release], {
			env: { ...process.env, CODEX_HOME: home },
			stdout: "pipe",
			stderr: "pipe",
		});
		while (!existsSync(ready)) await Bun.sleep(10);
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(2);
		writeFileSync(release, "release");
		expect(await child.exited).toBe(0);
	});
	test("same-process lock exclusion and different-home independence", async () => {
		const first = fixture();
		const second = fixture();
		const firstPaths = installerLockPaths(first.home);
		const secondPaths = installerLockPaths(second.home);
		let releaseFirst;
		const held = new Promise((resolve) => (releaseFirst = resolve));
		let entered = false;
		const firstOperation = withInstallerLock(first.home, async () => {
			entered = true;
			expect(existsSync(firstPaths.parent)).toBe(true);
			await held;
		});
		while (!entered) await Bun.sleep(1);
		let sameHomeError;
		await withInstallerLock(first.home, async () => {}).catch(
			(error) => (sameHomeError = error),
		);
		let differentHomeEntered = false;
		await withInstallerLock(second.home, async () => {
			differentHomeEntered = true;
			expect(existsSync(secondPaths.parent)).toBe(true);
		});
		expect(sameHomeError).toBeInstanceOf(Error);
		expect(differentHomeEntered).toBe(true);
		releaseFirst();
		await firstOperation;
		expect(existsSync(firstPaths.parent)).toBe(false);
		expect(existsSync(secondPaths.parent)).toBe(false);
	});
});
