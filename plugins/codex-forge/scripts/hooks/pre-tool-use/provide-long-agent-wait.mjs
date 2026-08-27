#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";

const event = "PreToolUse";
const payload = await readHookPayload(event);
if (payload) {
	const tool = String(payload.tool_name ?? payload.tool ?? "");
	const input = payload.tool_input ?? payload.input;
	if (
		tool === "multi_agent_v1wait_agent" &&
		input &&
		typeof input === "object" &&
		!Array.isArray(input)
	) {
		const hasTargets = Object.hasOwn(input, "targets");
		const targetsValid =
			!hasTargets ||
			(Array.isArray(input.targets) &&
				input.targets.length > 0 &&
				input.targets.every(
					(value) => typeof value === "string" && value.trim().length > 0,
				));
		const normalizedTargets = targetsValid
			? [...new Set((input.targets ?? []).map((value) => value.trim()))]
			: [];
		const singular = [input.agent_id, input.target, input.id]
			.filter((value) => typeof value === "string" && value.trim().length > 0)
			.map((value) => value.trim());
		const uniqueSingular = [...new Set(singular)];
		const aliasesAgree =
			uniqueSingular.length <= 1 &&
			(!hasTargets ||
				uniqueSingular.length === 0 ||
				(normalizedTargets.length === 1 &&
					normalizedTargets[0] === uniqueSingular[0]));
		const targets = hasTargets
			? normalizedTargets
			: uniqueSingular.length === 1
				? uniqueSingular
				: null;
		const needsLongerWait =
			!Number.isFinite(input.timeout_ms) || input.timeout_ms < 300000;
		const needsNormalization =
			!hasTargets ||
			normalizedTargets.length !== input.targets.length ||
			normalizedTargets.some(
				(value, index) => value !== input.targets[index],
			) ||
			uniqueSingular.length > 0;
		if (
			!targetsValid ||
			!aliasesAgree ||
			!targets?.length ||
			(!needsNormalization && !needsLongerWait)
		)
			process.exit(0);

		const updatedInput = { ...input, targets };
		delete updatedInput.agent_id;
		delete updatedInput.target;
		delete updatedInput.id;
		if (needsLongerWait) updatedInput.timeout_ms = 300000;
		emitHook(event, {
			updatedInput,
		});
	}
}
