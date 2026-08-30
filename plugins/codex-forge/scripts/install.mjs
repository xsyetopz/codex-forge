#!/usr/bin/env bun

import { main } from "./installer/cli.mjs";

export { main };

if (import.meta.main) process.exit(await main());
