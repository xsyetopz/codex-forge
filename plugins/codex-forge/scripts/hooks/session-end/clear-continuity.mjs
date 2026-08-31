#!/usr/bin/env node
import { removeSession } from "../../lib/continuity-state.mjs";
import { readHookPayload } from "../../lib/hook-runtime.mjs";

const payload = await readHookPayload("SessionEnd");
if (payload?.session_id) await removeSession(payload.session_id);
