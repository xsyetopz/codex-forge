import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export function snapshotPaths(paths) {
	return new Map(
		paths.map((path) => [path, existsSync(path) ? readFileSync(path) : null]),
	);
}

export function restoreSnapshot(snapshot) {
	for (const [path, bytes] of snapshot) {
		if (bytes === null) rmSync(path, { force: true });
		else {
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, bytes);
		}
	}
}
