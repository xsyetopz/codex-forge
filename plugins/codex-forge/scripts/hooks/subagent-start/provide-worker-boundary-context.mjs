#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";

const event = "SubagentStart";
if (await readHookPayload(event))
	emitHook(event, {
		context:
			"Complete the assigned scope, return evidence to the root agent, and leave further delegation to the root agent.",
	});
