#!/usr/bin/env node
import { emitHook } from "../hooklib.mjs";

const event = process.argv[2] ?? "";
if (event === "SessionStart")
	emitHook(event, {
		context:
			"Code discovery: prefer `codegraph_explore` over grep/file-read for structural queries; use `rg`/read for literals.",
	});
