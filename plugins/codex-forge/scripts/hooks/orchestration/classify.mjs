import {
	commandText,
	executable,
	segments,
	shellTokens,
} from "../pre-tool-use/shell-command.mjs";

const READ_ONLY_TOOLS = new Set([
	"codegraph_explore",
	"codegraph_node",
	"codegraphexplore",
	"codegraphnode",
	"find",
	"grep",
	"read",
	"read_file",
	"view_image",
	"web",
	"web_search",
	"websearch",
	"webrun",
	"web.run",
	"web__run",
	"search",
	"search_query",
	"searchquery",
	"open",
	"open_page",
	"openpage",
	"click",
	"find_in_page",
	"findinpage",
	"screenshot",
	"image_query",
	"imagequery",
	"finance",
	"weather",
	"sports",
	"time",
	"get_goal",
	"update_goal",
	"create_goal",
	"update_plan",
	"request_user_input",
	"user_input",
]);
const SPAWN_TOOLS = ["spawn_agent", "spawn-agent", "spawnagent"];
const ORCHESTRATION_TOOLS = [
	...SPAWN_TOOLS,
	"send_input",
	"send-message",
	"sendmessage",
	"followup_task",
	"follow-up",
	"followup",
	"wait_agent",
	"wait-agent",
	"waitagent",
	"close_agent",
	"close-agent",
	"resume_agent",
	"resume-agent",
	"interrupt_agent",
	"interrupt-agent",
];

const READ_ONLY_COMMANDS = new Set([
	"awk",
	"basename",
	"cat",
	"cut",
	"dirname",
	"echo",
	"file",
	"find",
	"git",
	"grep",
	"head",
	"jq",
	"less",
	"ls",
	"more",
	"nl",
	"pwd",
	"printf",
	"realpath",
	"rg",
	"sed",
	"sort",
	"stat",
	"tail",
	"tr",
	"true",
	"uniq",
	"wc",
	"which",
	"where",
	"xxd",
	"yq",
]);
const READ_ONLY_GIT = new Set([
	"branch",
	"diff",
	"grep",
	"log",
	"merge-base",
	"ls-tree",
	"ls-files",
	"show",
	"status",
	"rev-parse",
	"blame",
	"cat-file",
	"describe",
	"reflog",
	"shortlog",
	"tag",
]);
const WRAPPER_COMMANDS = new Set([
	"command",
	"env",
	"exec",
	"nice",
	"nohup",
	"setsid",
	"stdbuf",
	"time",
	"timeout",
	"busybox",
	"sudo",
	"doas",
]);

function firstCommand(segment) {
	let index = 0;
	while (index < segment.length) {
		const item = segment[index];
		if (
			!item.quoted &&
			item.value.includes("=") &&
			!item.value.startsWith("=")
		) {
			index += 1;
			continue;
		}
		const name = executable(item);
		if (!WRAPPER_COMMANDS.has(name)) return { name, index };
		index += 1;
		while (index < segment.length && segment[index].value.startsWith("-"))
			index += 1;
	}
	return { name: "", index };
}

function hasPrivilegedWrapper(segment) {
	return segment.some((item) => ["sudo", "doas"].includes(executable(item)));
}

function gitReferenceQueryIsReadOnly(subcommand, args) {
	const destructive = new Set([
		"-d",
		"-D",
		"-m",
		"-M",
		"-c",
		"-C",
		"--delete",
		"--move",
		"--copy",
		"--edit-description",
		"--rename",
	]);
	const flags = new Set([
		"-a",
		"--all",
		"-r",
		"--remotes",
		"-v",
		"-vv",
		"--verbose",
		"--no-abbrev",
		"--show-current",
		"--ignore-case",
		"-i",
		"--omit-empty",
	]);
	const values = new Set([
		"--contains",
		"--no-contains",
		"--merged",
		"--no-merged",
		"--points-at",
		"--format",
		"--sort",
		"--column",
	]);
	let queryMode = false;
	let positional = 0;
	for (let index = 0; index < args.length; index += 1) {
		const value = args[index].value;
		if (destructive.has(value) || /^-[dDmcC]+$/.test(value)) return false;
		if (["-l", "--list"].includes(value)) {
			queryMode = true;
			continue;
		}
		if (flags.has(value)) continue;
		if (/^-[arvi]+$/.test(value)) continue;
		if (values.has(value)) {
			if (!args[++index]) return false;
			queryMode = true;
			continue;
		}
		if (
			/^--(?:contains|no-contains|merged|no-merged|points-at|format|sort|column)=/.test(
				value,
			)
		) {
			queryMode = true;
			continue;
		}
		if (value === "--") {
			positional += args.length - index - 1;
			break;
		}
		if (value.startsWith("-")) return false;
		positional += 1;
	}
	if (positional === 0) return true;
	return queryMode && ["branch", "tag"].includes(subcommand);
}

function gitCatFileIsReadOnly(args) {
	if (args.length !== 2) return false;
	if (!["-e", "-p", "-s", "-t"].includes(args[0].value)) return false;
	return !args[1].quoted && !args[1].value.startsWith("-");
}

function findIsReadOnly(segment, _commandIndex) {
	const mutationPrimaries = new Set([
		"-delete",
		"-execdir",
		"-ok",
		"-okdir",
		"-fprint",
		"-fprint0",
		"-fprintf",
		"-fls",
	]);
	if (segment.some((item) => mutationPrimaries.has(item.value))) return false;
	const execIndexes = segment
		.map((item, index) => (item.value === "-exec" ? index : -1))
		.filter((index) => index >= 0);
	if (!execIndexes.length) return true;
	if (execIndexes.length !== 1) return false;
	const nested = segment.slice(execIndexes[0] + 1);
	return nested.length > 0 && segmentIsReadOnly(nested);
}

function printfIsReadOnly(segment, commandIndex) {
	const firstArgument = segment[commandIndex + 1];
	if (!firstArgument) return true;
	if (firstArgument.value === "--") return Boolean(segment[commandIndex + 2]);
	return !firstArgument.value.startsWith("-");
}

function sedProgramMayMutate(program) {
	const address = String.raw`(?:(?:[0-9]+|\$)(?:\s*,\s*(?:[0-9]+|\$))?|\/(?:\\.|[^/])*\/)?`;
	const command = new RegExp(
		String.raw`(?:^|[;\n{}])\s*${address}\s*!?\s*[eWw](?:\s|$)`,
	);
	const substitutionWrite = /\/[A-Za-z]*[ew](?:\s|$)/;
	return command.test(program) || substitutionWrite.test(program);
}

function sedIsReadOnly(segment, commandIndex) {
	let expectsProgram = false;
	let sawProgram = false;
	for (const item of segment.slice(commandIndex + 1)) {
		const value = item.value;
		if (expectsProgram) {
			if (sedProgramMayMutate(value)) return false;
			expectsProgram = false;
			sawProgram = true;
			continue;
		}
		if (["-f", "--file"].includes(value) || value.startsWith("--file="))
			return false;
		if (["-e", "--expression"].includes(value)) {
			expectsProgram = true;
			continue;
		}
		if (value.startsWith("--expression=")) {
			if (sedProgramMayMutate(value.slice("--expression=".length)))
				return false;
			sawProgram = true;
			continue;
		}
		if (value.startsWith("-")) continue;
		if (!sawProgram) {
			if (sedProgramMayMutate(value)) return false;
			sawProgram = true;
		}
	}
	return !expectsProgram;
}

function safeDockerValue(option, item) {
	if (!item || /[`$]/.test(item.value) || /^[<>]\(/.test(item.value))
		return false;
	if (["--last", "-n"].includes(option)) return /^[0-9]+$/.test(item.value);
	if (option === "--filter") return /^[A-Za-z0-9_.:/=-]+$/.test(item.value);
	return /^[A-Za-z0-9_ .{}:'"/=-]+$/.test(item.value);
}

function supervisorCommand(segment) {
	if (!segment.length || hasPrivilegedWrapper(segment)) return false;
	if (segment[0].value === "codex")
		return (
			segment.length === 2 &&
			segment.every((item) => !item.quoted && !/[`$]/.test(item.value)) &&
			segment[1].value === "--version"
		);
	if (segment[0].value === "docker") {
		if (segment[0].quoted || segment[1]?.quoted || segment[1]?.value !== "ps")
			return false;
		const optionsWithValue = new Set(["--format", "--filter", "--last", "-n"]);
		for (let cursor = 2; cursor < segment.length; cursor += 1) {
			const item = segment[cursor];
			const value = item.value;
			if (item.quoted || /[`$]/.test(value) || /^[<>]\(/.test(value))
				return false;
			if (["-a", "--all", "-q", "--quiet", "--no-trunc"].includes(value))
				continue;
			if (optionsWithValue.has(value)) {
				if (!safeDockerValue(value, segment[++cursor])) return false;
				continue;
			}
			const inline = value.match(/^(--format|--filter|--last|-n)=(.*)$/);
			if (inline && safeDockerValue(inline[1], { value: inline[2] })) continue;
			return false;
		}
		return true;
	}
	return false;
}

function segmentIsReadOnly(segment) {
	if (
		segment.length === 1 &&
		!segment[0].quoted &&
		executable(segment[0]) === "env"
	)
		return true;
	const { name, index } = firstCommand(segment);
	if (!name || index !== 0 || !READ_ONLY_COMMANDS.has(name)) return false;
	if (name === "git") {
		const subcommand = segment[index + 1]?.value?.toLowerCase();
		if (
			!READ_ONLY_GIT.has(subcommand) &&
			!(
				subcommand === "remote" &&
				segment
					.slice(index + 2)
					.every((item) => ["-v", "--verbose"].includes(item.value))
			)
		)
			return false;
		if (
			["branch", "tag"].includes(subcommand) &&
			!gitReferenceQueryIsReadOnly(subcommand, segment.slice(index + 2))
		)
			return false;
		if (
			subcommand === "cat-file" &&
			!gitCatFileIsReadOnly(segment.slice(index + 2))
		)
			return false;
		if (
			subcommand === "reflog" &&
			segment
				.slice(index + 2)
				.some((item) =>
					["expire", "delete", "drop", "write"].includes(
						item.value.toLowerCase(),
					),
				)
		)
			return false;
		if (
			segment
				.slice(index + 2)
				.some(
					(item) =>
						item.value === "--output" || item.value.startsWith("--output="),
				)
		)
			return false;
	}
	if (
		name === "sed" &&
		(segment.some(
			(item) =>
				item.value === "--in-place" ||
				item.value.startsWith("--in-place=") ||
				/^-[^-]*i/.test(item.value),
		) ||
			!sedIsReadOnly(segment, index))
	)
		return false;
	if (name === "find" && !findIsReadOnly(segment, index)) return false;
	if (
		name === "rg" &&
		segment.some(
			(item) => item.value === "--pre" || item.value.startsWith("--pre="),
		)
	)
		return false;
	if (
		name === "sort" &&
		segment.some(
			(item) =>
				item.value === "-o" ||
				item.value === "--output" ||
				item.value.startsWith("--output="),
		)
	)
		return false;
	if (
		name === "yq" &&
		segment.some(
			(item) =>
				item.value === "-i" ||
				item.value === "--inplace" ||
				item.value.startsWith("--inplace="),
		)
	)
		return false;
	if (
		name === "xxd" &&
		segment.some((item) => /^-(?:r|revert)$/.test(item.value))
	)
		return false;
	if (
		name === "awk" &&
		segment.some(
			(item) =>
				/\bsystem\s*\(/.test(item.value) ||
				/\|\s*getline\b/.test(item.value) ||
				/\b(?:print|printf)\b[^\n]*(?:>>?|\|)/.test(item.value),
		)
	)
		return false;
	if (name === "printf" && !printfIsReadOnly(segment, index)) return false;
	return true;
}

function classificationTokens(command) {
	const tokens = shellTokens(command);
	if (!tokens?.length) return null;
	const classified = [];
	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (
			!token.quoted &&
			token.value === "2" &&
			tokens[index + 1]?.value === ">" &&
			!tokens[index + 1]?.quoted &&
			tokens[index + 2]?.value === "/dev/null" &&
			!tokens[index + 2]?.quoted
		) {
			index += 2;
			continue;
		}
		if (
			(!token.quoted &&
				[">", ">>", "&>", "&>>", "<<<", "<<"].includes(token.value)) ||
			token.dynamic ||
			(!token.quoted && /^[<>]\(/.test(token.value))
		)
			return null;
		classified.push(token);
	}
	return classified;
}

function commandIsReadOnly(command, allowSupervisorCommand) {
	const tokens = classificationTokens(command);
	if (!tokens?.length) return false;
	const commandSegments = segments(tokens);
	if (
		allowSupervisorCommand &&
		commandSegments.length === 1 &&
		supervisorCommand(commandSegments[0])
	)
		return true;
	return commandSegments.every(segmentIsReadOnly);
}

export function normalizedTool(payload) {
	return String(payload?.tool_name ?? payload?.tool ?? "")
		.trim()
		.toLowerCase();
}

export function toolInput(payload) {
	const value = payload?.tool_input ?? payload?.input;
	return value && typeof value === "object" && !Array.isArray(value)
		? value
		: {};
}

export function isRoot(payload) {
	return agentIdentityStatus(payload) === "root";
}

export function agentIdentityStatus(payload) {
	const hasId = Object.hasOwn(payload ?? {}, "agent_id");
	const hasType = Object.hasOwn(payload ?? {}, "agent_type");
	const id = payload?.agent_id;
	const type = payload?.agent_type;
	const childId = typeof id === "string" && id.trim().length > 0;
	const childType = typeof type === "string" && type.trim().length > 0;
	if (childId && childType) return "child";
	if (!hasId && !hasType) return "root";
	return "incomplete";
}

export function isSpawnTool(tool, input) {
	return (
		SPAWN_TOOLS.some((name) => tool === name || tool.endsWith(`.${name}`)) ||
		/^multi_agent_v1(?:__|[._:-])?spawn_agent(?:$|[._:-])/.test(tool) ||
		(tool === "agent" &&
			typeof (input.agent_type ?? input.agent_role ?? input.role) === "string")
	);
}

export function isFollowupTool(tool) {
	return (
		/^multi_agent_v1(?:__|[._:-])?(?:send_input|followup_task|resume_agent)(?:$|[._:-])/.test(
			tool,
		) ||
		[
			"send_input",
			"send-message",
			"sendmessage",
			"followup_task",
			"follow-up",
			"followup",
			"resume_agent",
			"resume-agent",
		].some((name) => tool === name || tool.endsWith(`.${name}`))
	);
}

export function isWaitOrControlTool(tool) {
	return (
		ORCHESTRATION_TOOLS.some(
			(name) => tool === name || tool.endsWith(`.${name}`),
		) ||
		/^multi_agent_v1(?:__|[._:-])?(?:wait|send|close|resume|interrupt)/.test(
			tool,
		)
	);
}

export function isCloseTool(tool) {
	return (
		/^multi_agent_v1(?:__|[._:-])?close_agent(?:$|[._:-])/.test(tool) ||
		["close_agent", "close-agent"].some(
			(name) => tool === name || tool.endsWith(`.${name}`),
		)
	);
}

export function forgeRole(input) {
	const value = input.agent_type ?? input.agent_role ?? input.role;
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function roleIs(role, expected) {
	return (
		role === expected ||
		role.startsWith(`${expected}:`) ||
		role.startsWith(`${expected}/`)
	);
}

export function agentTargets(input) {
	const values = [];
	for (const key of [
		"agent_id",
		"target_agent_id",
		"target",
		"recipient",
		"id",
	]) {
		if (typeof input[key] === "string" && input[key].trim())
			values.push(input[key].trim());
	}
	for (const key of ["targets", "agent_ids"]) {
		if (Array.isArray(input[key]))
			values.push(
				...input[key].filter(
					(value) => typeof value === "string" && value.trim(),
				),
			);
	}
	return [...new Set(values)];
}

export function isGuardedRootWork(payload) {
	const tool = normalizedTool(payload);
	if (!tool) return true;
	if (READ_ONLY_TOOLS.has(tool) || isWaitOrControlTool(tool)) return false;
	if (
		tool.includes("goal") ||
		tool.includes("plan") ||
		tool.includes("user_input")
	)
		return false;
	const command = commandText(payload);
	if (command !== null) return !commandIsReadOnly(command, isRoot(payload));
	if (
		tool.includes("apply_patch") ||
		tool.includes("patch") ||
		tool.includes("write") ||
		tool.includes("edit") ||
		tool.includes("delete") ||
		tool.includes("move") ||
		tool.includes("notebook")
	)
		return true;
	if (
		tool.includes("read") ||
		tool.includes("view") ||
		tool.includes("search") ||
		tool.includes("list")
	)
		return false;
	return true;
}

export function isMutationWork(payload) {
	const command = commandText(payload);
	if (command !== null) return !commandIsReadOnly(command, true);
	return isGuardedRootWork(payload);
}

export function reviewSentinel(message) {
	if (typeof message !== "string") return null;
	const lines = message.split(/\r?\n/);
	while (lines.at(-1) === "") lines.pop();
	const matches = lines
		.map((line, index) => ({
			index,
			match: line.match(/^FORGE_REVIEW_RESULT: (pass|fail)$/),
		}))
		.filter(({ match }) => match);
	return matches.length === 1 && matches[0].index === lines.length - 1
		? matches[0].match[1]
		: null;
}

export function identity(id, role, status = "running", spawnToolUseId = null) {
	return {
		id,
		role,
		status,
		...(spawnToolUseId ? { spawn_tool_use_id: spawnToolUseId } : {}),
	};
}
