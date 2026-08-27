import { readFileSync, rmSync, writeFileSync } from "node:fs";

const processIsAlive = (pid) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return error?.code === "EPERM";
	}
};

export function acquireJobLease(job, { pid = process.pid } = {}) {
	const path = `${job}.runner.json`;
	const claim = () =>
		writeFileSync(
			path,
			`${JSON.stringify({ pid, acquired_at: new Date().toISOString() }, null, 2)}\n`,
			{ flag: "wx" },
		);

	try {
		claim();
	} catch (error) {
		if (error?.code !== "EEXIST") throw error;
		let owner;
		try {
			owner = JSON.parse(readFileSync(path, "utf8"));
		} catch {
			throw new Error(`Benchmark job lease is unreadable: ${path}`);
		}
		if (Number.isInteger(owner.pid) && processIsAlive(owner.pid))
			throw new Error(
				`Benchmark job is already active under PID ${owner.pid}: ${job}`,
			);
		rmSync(path, { force: true });
		claim();
	}

	let released = false;
	return {
		path,
		release() {
			if (released) return;
			released = true;
			rmSync(path, { force: true });
		},
	};
}
