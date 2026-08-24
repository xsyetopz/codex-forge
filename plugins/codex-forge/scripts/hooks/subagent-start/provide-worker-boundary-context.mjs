#!/usr/bin/env node
import { emitHook } from "../hooklib.mjs";

const event = process.argv[2] ?? "";
if (event === "SubagentStart")
	emitHook(event, {
		context: "Child: don't spawn agents; stay in scope; return evidence.",
	});
