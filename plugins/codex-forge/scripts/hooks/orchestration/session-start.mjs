#!/usr/bin/env node
import { readHookPayload } from "../hooklib.mjs";
import { cleanupExpiredStates } from "./state.mjs";

const event = "SessionStart";
const payload = await readHookPayload(event);
if (payload) await cleanupExpiredStates(Date.now(), payload.session_id);
