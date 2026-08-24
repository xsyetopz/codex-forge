import {
	broadPath,
	executable,
	isSyntaxToken,
	SHELL_BASENAMES,
	SHELL_CONTROL_PREFIXES,
	SHELL_OPERATORS,
	segments,
	shellTokens,
	substitutionBodies,
	values,
} from "./shell-command.mjs";

function isShell(item) {
	const value = item.value.trim().toLowerCase();
	return (
		SHELL_BASENAMES.has(executable(item)) ||
		["$shell", `\${shell}`].includes(value)
	);
}

function skipOptionValue(segment, index, options) {
	const value = segment[index].value;
	if (options.has(value) && index + 1 < segment.length) return index + 2;
	return index + 1;
}

function actualCommandIndex(segment) {
	let index = 0;
	for (let guard = 0; guard < 32; guard += 1) {
		while (index < segment.length) {
			const item = segment[index];
			if (
				!item.quoted &&
				((item.value.includes("=") && !item.value.startsWith("=")) ||
					item.value === "--env")
			)
				index += 1;
			else break;
		}
		if (index >= segment.length) return index;
		const base = executable(segment[index]);
		if (
			isSyntaxToken(segment[index], new Set(["!"])) ||
			isSyntaxToken(segment[index], SHELL_CONTROL_PREFIXES)
		) {
			index += 1;
			continue;
		}
		if (base === "command") {
			index += 1;
			let query = false;
			while (index < segment.length) {
				const option = segment[index].value;
				if (option === "--") {
					index += 1;
					break;
				}
				if (!option.startsWith("-")) break;
				if (option.slice(1).toLowerCase().includes("v")) query = true;
				index += 1;
			}
			if (query) return segment.length;
			continue;
		}
		if (base === "exec") {
			index += 1;
			while (index < segment.length && segment[index].value.startsWith("-"))
				index = skipOptionValue(segment, index, new Set(["-a"]));
			continue;
		}
		if (["nohup", "setsid"].includes(base)) {
			index += 1;
			if (segment[index]?.value === "--") index += 1;
			while (index < segment.length && segment[index].value.startsWith("-"))
				index += 1;
			continue;
		}
		if (base === "env") {
			index += 1;
			while (index < segment.length) {
				const item = segment[index].value;
				if (item === "--") {
					index += 1;
					break;
				}
				if (
					["-S", "--split-string"].includes(item) ||
					item.startsWith("--split-string=")
				)
					return segment.length;
				if (item.startsWith("-")) {
					index = skipOptionValue(
						segment,
						index,
						new Set(["-u", "--unset", "-C", "--chdir"]),
					);
					continue;
				}
				if (item.includes("=") && !item.startsWith("=")) {
					index += 1;
					continue;
				}
				break;
			}
			continue;
		}
		if (base === "nice") {
			index += 1;
			while (index < segment.length && segment[index].value.startsWith("-"))
				index = skipOptionValue(
					segment,
					index,
					new Set(["-n", "--adjustment"]),
				);
			continue;
		}
		if (base === "time") {
			index += 1;
			while (index < segment.length && segment[index].value.startsWith("-"))
				index = skipOptionValue(
					segment,
					index,
					new Set(["-o", "--output", "-f", "--format"]),
				);
			continue;
		}
		if (base === "timeout") {
			index += 1;
			while (index < segment.length && segment[index].value.startsWith("-"))
				index = skipOptionValue(
					segment,
					index,
					new Set(["-k", "--kill-after", "-s", "--signal"]),
				);
			if (index < segment.length) index += 1;
			continue;
		}
		if (base === "stdbuf") {
			index += 1;
			const valueOptions = new Set([
				"-i",
				"--input",
				"-o",
				"--output",
				"-e",
				"--error",
			]);
			while (index < segment.length && segment[index].value.startsWith("-"))
				index = skipOptionValue(segment, index, valueOptions);
			continue;
		}
		if (base === "busybox") {
			index += 1;
			if (segment[index]?.value === "--") index += 1;
			while (index < segment.length && segment[index].value.startsWith("-"))
				index += 1;
			continue;
		}
		if (base === "xargs") {
			index += 1;
			const valueOptions = new Set([
				"-E",
				"-I",
				"-J",
				"-L",
				"-n",
				"-P",
				"-R",
				"-s",
				"-S",
				"-d",
				"--arg-file",
				"--delimiter",
				"--eof",
				"--max-args",
				"--max-procs",
				"--max-lines",
				"--replace",
				"--max-chars",
			]);
			while (index < segment.length) {
				const item = segment[index].value;
				if (item === "--") {
					index += 1;
					break;
				}
				if (!item.startsWith("-")) break;
				index = skipOptionValue(segment, index, valueOptions);
			}
			continue;
		}
		return index;
	}
	return index;
}

function nestedShellCommands(segment) {
	const nested = [];
	const wrapperBases = new Set([
		"command",
		"exec",
		"nice",
		"nohup",
		"setsid",
		"time",
		"timeout",
		"stdbuf",
		"busybox",
		"env",
	]);
	const envIndex = segment.findIndex(
		(item, index) =>
			executable(item) === "env" &&
			(index === 0 || wrapperBases.has(executable(segment[0]))),
	);
	if (envIndex >= 0) {
		let index = envIndex + 1;
		while (index < segment.length) {
			const option = segment[index].value;
			if (["-S", "--split-string"].includes(option)) {
				if (segment[index + 1]) nested.push(segment[index + 1].value);
				break;
			}
			if (option.startsWith("--split-string=")) {
				nested.push(option.split("=", 2)[1]);
				break;
			}
			if (["-u", "--unset", "-C", "--chdir"].includes(option)) {
				index += 2;
				continue;
			}
			if (
				option.startsWith("-") ||
				(option.includes("=") && !option.startsWith("="))
			) {
				index += 1;
				continue;
			}
			break;
		}
		if (nested.length) return nested;
	}
	const actual = actualCommandIndex(segment);
	if (actual < segment.length && executable(segment[actual]) === "eval") {
		if (segment[actual + 1])
			nested.push(values(segment.slice(actual + 1)).join(" "));
		return nested;
	}
	if (actual >= segment.length || !isShell(segment[actual])) return nested;
	for (const marker of ["<<<", "<<"]) {
		const markerIndex = segment.findIndex((item) =>
			isSyntaxToken(item, new Set([marker])),
		);
		if (markerIndex >= 0) {
			nested.push(values(segment.slice(markerIndex + 1)).join(" "));
			break;
		}
	}
	let index = actual + 1;
	const valueOptions = new Set([
		"-o",
		"+o",
		"-O",
		"+O",
		"--rcfile",
		"--init-file",
	]);
	while (index < segment.length) {
		const option = segment[index].value;
		if (option === "--") break;
		if (
			option === "-c" ||
			(option.startsWith("-") &&
				!option.startsWith("--") &&
				option.slice(1).includes("c"))
		) {
			if (segment[index + 1]) nested.push(segment[index + 1].value);
			break;
		}
		if (option.startsWith("-") || option.startsWith("+")) {
			index = skipOptionValue(segment, index, valueOptions);
			continue;
		}
		break;
	}
	return nested;
}

function dangerousGit(segment) {
	if (!segment.length || executable(segment[0]) !== "git") return null;
	let args = values(segment.slice(1));
	const globalValueOptions = new Set([
		"-C",
		"-c",
		"--git-dir",
		"--work-tree",
		"--namespace",
		"--exec-path",
	]);
	let index = 0;
	const inlineConfigs = [];
	while (index < args.length) {
		const item = args[index];
		if (item === "--") {
			index += 1;
			break;
		}
		if (globalValueOptions.has(item)) {
			if (item === "-c" && args[index + 1]) inlineConfigs.push(args[index + 1]);
			index += 2;
			continue;
		}
		if (
			(item.startsWith("-C") || item.startsWith("-c")) &&
			!["-C", "-c"].includes(item)
		) {
			if (item.startsWith("-c")) inlineConfigs.push(item.slice(2));
			index += 1;
			continue;
		}
		if (
			[...globalValueOptions].some((option) => item.startsWith(`${option}=`)) ||
			item.startsWith("-")
		) {
			index += 1;
			continue;
		}
		break;
	}
	for (const setting of inlineConfigs) {
		const separator = setting.indexOf("=");
		if (
			separator < 0 ||
			!setting.slice(0, separator).toLowerCase().startsWith("alias.")
		)
			continue;
		const alias = setting.slice(separator + 1).trimStart();
		if (
			dangerousShellCommandReason(
				alias.startsWith("!") ? alias.slice(1) : `git ${alias}`,
			)
		)
			return "destructive inline git alias";
	}
	args = args.slice(index);
	if (!args.length) return null;
	const [subcommand, ...rest] = args;
	if (subcommand === "clean") {
		const dryRun = rest.some(
			(arg) =>
				arg === "--dry-run" ||
				(arg.startsWith("-") &&
					!arg.startsWith("--") &&
					arg.slice(1).includes("n")),
		);
		if (dryRun) return null;
		return rest.some(
			(arg) =>
				["-f", "-ff", "--force"].includes(arg) ||
				(arg.startsWith("-") &&
					!arg.startsWith("--") &&
					arg.slice(1).includes("f")),
		)
			? "destructive git working-tree cleanup"
			: null;
	}
	if (
		subcommand === "reset" &&
		rest.some(
			(arg) => ["--hard", "-H"].includes(arg) || arg.startsWith("--hard="),
		)
	)
		return "destructive git hard reset";
	if (["filter-branch", "filter-repo"].includes(subcommand))
		return "irreversible git history rewriting";
	if (subcommand === "reflog" && rest[0] === "expire")
		return "destructive git reflog expiration";
	if (subcommand === "branch") {
		const shortFlags = rest
			.filter((arg) => arg.startsWith("-") && !arg.startsWith("--"))
			.map((arg) => arg.slice(1))
			.join("");
		if (
			(shortFlags.toLowerCase().includes("d") || rest.includes("--delete")) &&
			(shortFlags.includes("D") ||
				shortFlags.toLowerCase().includes("f") ||
				rest.includes("--force"))
		)
			return "forced git branch deletion";
	}
	if (
		subcommand === "stash" &&
		["drop", "clear"].includes(rest.find((arg) => !arg.startsWith("-")))
	)
		return "destructive git stash removal";
	if (subcommand === "checkout" && rest.includes("--")) {
		const targets = rest.slice(rest.indexOf("--") + 1);
		if (
			!targets.length ||
			targets.some(
				(target) => broadPath(target) || [":/", ":(top)"].includes(target),
			)
		)
			return "destructive git checkout";
	}
	if (subcommand === "restore") {
		const targets = rest.filter((arg) => !arg.startsWith("-"));
		if (
			!targets.length ||
			targets.some(
				(target) => broadPath(target) || [":/", ":(top)"].includes(target),
			)
		)
			return "destructive git restore";
	}
	if (
		subcommand === "push" &&
		rest.some(
			(arg) =>
				["--force", "--force-with-lease", "-f"].includes(arg) ||
				arg.startsWith("--force-with-lease="),
		)
	)
		return "destructive remote git history rewrite";
	return null;
}

function dangerousSegment(segment) {
	if (!segment.length) return null;
	if (isSyntaxToken(segment[0], new Set([">", ">|"])))
		return "destructive shell truncation";
	const index = actualCommandIndex(segment);
	if (index >= segment.length) return null;
	const base = executable(segment[index]);
	const args = segment.slice(index + 1);
	const argValues = values(args);
	if (base === "rm") {
		const recursive = argValues.some(
			(item) =>
				item === "--recursive" ||
				(item.startsWith("-") &&
					!item.startsWith("--") &&
					item.toLowerCase().slice(1).includes("r")),
		);
		const targets = argValues.filter(
			(item) => !item.startsWith("-") || item === "--",
		);
		if (recursive && targets.some(broadPath))
			return "catastrophic recursive deletion";
	}
	if (
		base === "find" &&
		argValues.some((item) => ["-exec", "-execdir"].includes(item))
	) {
		const marker = argValues.find((item) =>
			["-exec", "-execdir"].includes(item),
		);
		let nested = args.slice(argValues.indexOf(marker) + 1);
		if (nested.at(-1)?.value === ";") nested = nested.slice(0, -1);
		const nestedIndex = nested.length ? actualCommandIndex(nested) : 0;
		const nestedValues = values(nested.slice(nestedIndex + 1));
		if (
			nestedIndex < nested.length &&
			executable(nested[nestedIndex]) === "rm" &&
			nestedValues.some(
				(item) =>
					item === "--recursive" ||
					(item.startsWith("-") &&
						!item.startsWith("--") &&
						item.toLowerCase().slice(1).includes("r")),
			) &&
			nestedValues.includes("{}")
		)
			return "catastrophic recursive find deletion";
		const reason = nested.length ? inspectSegments(segments(nested)) : null;
		if (reason) return reason;
	}
	if (
		base === "find" &&
		argValues.includes("-delete") &&
		argValues.filter((item) => item !== "-delete").some(broadPath)
	)
		return "destructive recursive find deletion";
	const dangerousBases = new Set([
		"dd",
		"cfdisk",
		"fdisk",
		"halt",
		"mkfs",
		"mkfs.ext4",
		"mkfs.xfs",
		"mkswap",
		"parted",
		"poweroff",
		"reboot",
		"runuser",
		"shred",
		"shutdown",
		"su",
		"sudo",
		"doas",
		"pkexec",
		"truncate",
		"wipefs",
		"sfdisk",
	]);
	if (base.startsWith("mkfs.") || dangerousBases.has(base))
		return `dangerous ${base} command`;
	if (
		base === "systemctl" &&
		argValues.some((item) =>
			["halt", "poweroff", "reboot", "shutdown"].includes(item),
		)
	)
		return "host power-state change";
	if (base === "init" && argValues.some((item) => ["0", "6"].includes(item)))
		return "host power-state change";
	const gitReason = dangerousGit(segment.slice(index));
	if (gitReason) return gitReason;
	if (
		[":", "true"].includes(base) &&
		args.some((item) => isSyntaxToken(item, new Set([">", ">|"])))
	)
		return "destructive shell truncation";
	if (
		base === "cat" &&
		argValues.includes("/dev/null") &&
		args.some((item) => isSyntaxToken(item, new Set([">", ">|"])))
	)
		return "destructive shell truncation";
	return null;
}

function inspectSegments(parts) {
	for (const segment of parts) {
		const reason = dangerousSegment(segment);
		if (reason) return reason;
		for (const nested of nestedShellCommands(segment)) {
			const nestedReason = dangerousShellCommandReason(nested);
			if (nestedReason) return nestedReason;
		}
	}
	return null;
}

function pipelineFetchToShell(tokens) {
	const pipelineCommand = (part) => {
		const index = actualCommandIndex(part);
		return index < part.length ? executable(part[index]) : "";
	};
	for (let index = 0; index < tokens.length; index += 1) {
		if (!isSyntaxToken(tokens[index], new Set(["|", "|&"]))) continue;
		let leftStart = index;
		while (leftStart && !isSyntaxToken(tokens[leftStart - 1], SHELL_OPERATORS))
			leftStart -= 1;
		let rightEnd = index + 1;
		while (
			rightEnd < tokens.length &&
			!isSyntaxToken(tokens[rightEnd], SHELL_OPERATORS)
		)
			rightEnd += 1;
		const left = tokens.slice(leftStart, index);
		const right = tokens.slice(index + 1, rightEnd);
		if (
			!left.length ||
			!right.length ||
			!SHELL_BASENAMES.has(pipelineCommand(right))
		)
			continue;
		if (["curl", "wget"].includes(pipelineCommand(left)))
			return "network download piped to a shell";
		for (const source of values(left.slice(1)))
			if (dangerousShellCommandReason(source))
				return "generated text piped to a shell";
	}
	return null;
}

function isForkBomb(tokens) {
	if (tokens.length < 2 || tokens[1].value !== "()") return false;
	const compact = values(tokens).join("");
	if (/:\(\)\{.*:\|:&/.test(compact)) return true;
	const match = compact.match(/^([A-Za-z_][A-Za-z0-9_]*)\(\)\{/);
	return match
		? new RegExp(
				`\\b${match[1]}\\b[^{}]*\\|[^{}]*\\b${match[1]}\\b[^{}]*&`,
			).test(compact)
		: false;
}

export function dangerousShellCommandReason(command) {
	for (const body of substitutionBodies(command)) {
		const reason = dangerousShellCommandReason(body);
		if (reason) return reason;
	}
	const tokens = shellTokens(command);
	if (!tokens?.length) return null;
	const functionChunks = [];
	let current = [];
	for (const item of tokens) {
		if (isSyntaxToken(item, new Set([";", "&&", "||"]))) {
			if (current.length) functionChunks.push(current);
			current = [];
		} else current.push(item);
	}
	if (current.length) functionChunks.push(current);
	if (functionChunks.some(isForkBomb)) return "fork bomb";
	return pipelineFetchToShell(tokens) ?? inspectSegments(segments(tokens));
}
