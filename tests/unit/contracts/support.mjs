import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const ROOT = resolve(import.meta.dir, "../../..");
export const PLUGIN = join(ROOT, "plugins", "codex-forge");
export const read = (path) => readFileSync(path, "utf8");
