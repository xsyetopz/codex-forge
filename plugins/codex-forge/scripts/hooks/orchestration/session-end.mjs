#!/usr/bin/env node
import { readHookPayload } from "../hooklib.mjs";
import { removeSession } from "./state.mjs";

const event = "SessionEnd";
const payload = await readHookPayload(event);
if (payload?.session_id) await removeSession(payload.session_id);
