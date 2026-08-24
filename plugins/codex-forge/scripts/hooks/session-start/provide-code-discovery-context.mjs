#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";

const event = "SessionStart";
if (await readHookPayload(event))
	emitHook(event, {
		context:
			"Code discovery: prefer `codegraph_explore` over `grep`/file-read for structural queries; use `rg`/read for literals.",
	});
