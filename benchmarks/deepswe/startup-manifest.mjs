import { createHash } from "node:crypto";
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";

const sha256 = (contents) =>
	createHash("sha256").update(contents).digest("hex");

function treeFingerprint(directory, root) {
	const hash = createHash("sha256");
	let bytes = 0;
	let files = 0;
	const visit = (current) => {
		for (const name of readdirSync(current).sort()) {
			const path = resolve(current, name);
			const stat = statSync(path);
			if (stat.isDirectory()) {
				visit(path);
				continue;
			}
			const contents = readFileSync(path);
			hash.update(relative(root, path));
			hash.update("\0");
			hash.update(contents);
			hash.update("\0");
			bytes += contents.length;
			files += 1;
		}
	};
	visit(directory);
	return { sha256: hash.digest("hex"), bytes, files };
}

export function captureStartupManifest({ ...options }) {
	const manifest = buildStartupManifest(options);
	const {
		runId,
		outputDirectory = resolve(options.bench, "results/manifests"),
	} = options;
	const directory = resolve(outputDirectory);
	mkdirSync(directory, { recursive: true });
	const output = resolve(directory, `${runId}.json`);
	const temporary = resolve(directory, `.${runId}.${process.pid}.tmp`);
	writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
	renameSync(temporary, output);
	return output;
}

/** Build the immutable portion of a run manifest without writing it. */
export function buildStartupManifest({
	root,
	bench,
	runId,
	matrix,
	arms,
	models,
	efforts,
	tasks,
	tokenBudget,
	trialTokenBudget,
	concurrency,
}) {
	const sourcePaths = [
		resolve(bench, "matrix.json"),
		resolve(bench, "tasks.json"),
		resolve(bench, "screening-tasks.json"),
		resolve(bench, "generate-config.mjs"),
		resolve(bench, "prepare-forge-task.mjs"),
		resolve(bench, "pier-lifecycle.mjs"),
		resolve(bench, "job-lease.mjs"),
		resolve(bench, "cleanup-job.mjs"),
		resolve(bench, "summarize.mjs"),
		resolve(bench, "run-matrix.mjs"),
		resolve(bench, "startup-manifest.mjs"),
		resolve(root, "plugins/codex-forge/assets/model-instructions.md"),
		resolve(root, "plugins/codex-forge/assets/model-catalog.json"),
		resolve(root, "plugins/codex-forge/assets/developer-instructions.txt"),
		resolve(root, "plugins/codex-forge/hooks/hooks.json"),
	];
	const sources = Object.fromEntries(
		sourcePaths.map((path) => {
			const contents = readFileSync(path);
			return [
				relative(root, path),
				{ sha256: sha256(contents), bytes: statSync(path).size },
			];
		}),
	);
	const sourceTrees = {
		"plugins/codex-forge": treeFingerprint(
			resolve(root, "plugins/codex-forge"),
			root,
		),
	};
	const catalogPath = resolve(
		root,
		"plugins/codex-forge/assets/model-catalog.json",
	);
	const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
	const catalogContract = Object.fromEntries(
		["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"].map((slug) => {
			const model = catalog.models?.find((entry) => entry.slug === slug);
			return [
				slug,
				{
					present: Boolean(model),
					multi_agent_version: model?.multi_agent_version ?? null,
					use_responses_lite: model?.use_responses_lite ?? null,
					web_search_tool_type: model?.web_search_tool_type ?? null,
					apply_patch_tool_type: model?.apply_patch_tool_type ?? null,
				},
			];
		}),
	);
	const configAudit = {
		schema: "codex-forge.deepswe-config-audit.v1",
		// These root-level values are intentionally identical in both matched
		// arms; Forge-specific instruction and catalog paths remain arm-local.
		matched_arms: {
			baseline: {
				web_search: "disabled",
				egress_hint_url: "https://chatgpt.com/backend-api/ps/mcp",
				egress_hint_enabled: false,
			},
			"forge-core": {
				web_search: "disabled",
				egress_hint_url: "https://chatgpt.com/backend-api/ps/mcp",
				egress_hint_enabled: false,
			},
		},
		legacy_flags_absent: ["multi_agent", "multi_agent_v2", "features.hooks"],
		forge_catalog_tool_type: {
			web_search_tool_type: catalogContract["gpt-5.6-sol"].web_search_tool_type,
			apply_patch_tool_type:
				catalogContract["gpt-5.6-sol"].apply_patch_tool_type,
		},
	};
	return {
		schema: "codex-forge.deepswe-startup-manifest.v1",
		run_id: runId,
		captured_before_preflight: true,
		captured_at_utc: new Date().toISOString(),
		codex_version: matrix.codex_version,
		selection: {
			arms,
			models,
			efforts,
			tasks,
			concurrency,
			token_budget: tokenBudget,
			trial_token_budget: trialTokenBudget,
		},
		catalog_contract: catalogContract,
		config_audit: configAudit,
		sources,
		source_trees: sourceTrees,
	};
}

const stableManifest = (manifest) => {
	if (!manifest || typeof manifest !== "object") return null;
	const { captured_at_utc: _capturedAt, ...stable } = manifest;
	return stable;
};

export function startupManifestFingerprint(manifest) {
	return sha256(JSON.stringify(stableManifest(manifest)));
}

export function startupManifestsMatch(expected, observed) {
	return (
		startupManifestFingerprint(expected) ===
		startupManifestFingerprint(observed)
	);
}
