import { basename, posix } from "node:path";

export const SHELL_TOOL_NAMES = new Set([
	"bash",
	"cmd",
	"exec",
	"exec_command",
	"local_shell",
	"powershell",
	"shell",
	"shell_command",
	"sh",
	"terminal",
	"zsh",
]);
export const SHELL_BASENAMES = new Set([
	"bash",
	"dash",
	"fish",
	"ksh",
	"sh",
	"zsh",
]);
export const SHELL_OPERATORS = new Set([
	";",
	";;",
	";&",
	";;&",
	"&&",
	"||",
	"|",
	"|&",
	"&",
	"(",
	")",
	"{",
	"}",
]);
export const SHELL_CONTROL_PREFIXES = new Set([
	"if",
	"for",
	"while",
	"until",
	"case",
	"select",
	"then",
	"do",
	"else",
	"elif",
	"fi",
	"done",
	"in",
	"esac",
]);
const COMMAND_FIELDS = ["command", "cmd", "script"];
const PUNCTUATION = new Set([..."();<>|&"]);

export function token(value, quoted = false, dynamic = false) {
	return { value, quoted, dynamic };
}

export function isSyntaxToken(item, values) {
	return !item.quoted && values.has(item.value);
}

export function executable(item) {
	const value = typeof item === "string" ? item : item.value;
	return basename(value).toLowerCase();
}

function shellQuote(values) {
	return values
		.map((value) =>
			/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)
				? value
				: `'${value.replaceAll("'", `'\\''`)}'`,
		)
		.join(" ");
}

function commandValue(value) {
	if (typeof value === "string") return value;
	if (Array.isArray(value) && value.every((item) => typeof item === "string"))
		return shellQuote(value);
	if (value && typeof value === "object") {
		for (const field of COMMAND_FIELDS) {
			if (field in value) {
				const command = commandValue(value[field]);
				if (command !== null) return command;
			}
		}
	}
	return null;
}

export function commandText(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload))
		return null;
	const tool = String(payload.tool_name ?? payload.tool ?? "").toLowerCase();
	if (
		!SHELL_TOOL_NAMES.has(tool) &&
		!["shell", "exec_command", "terminal"].some((marker) =>
			tool.includes(marker),
		)
	)
		return null;
	let value = payload.tool_input ?? payload.input;
	if (value === undefined || value === null) {
		value = Object.fromEntries(
			COMMAND_FIELDS.filter((field) => field in payload).map((field) => [
				field,
				payload[field],
			]),
		);
	}
	return commandValue(value);
}

function decodeAnsiCEscapes(raw) {
	return raw
		.replace(
			/\\(x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3}|.)/gs,
			(_, escapeSequence) => {
				if (escapeSequence.startsWith("x"))
					return String.fromCodePoint(
						Number.parseInt(escapeSequence.slice(1), 16),
					);
				if (escapeSequence.startsWith("u") || escapeSequence.startsWith("U"))
					return String.fromCodePoint(
						Number.parseInt(escapeSequence.slice(1), 16),
					);
				if (/^[0-7]+$/.test(escapeSequence))
					return String.fromCodePoint(Number.parseInt(escapeSequence, 8));
				return (
					{
						a: "\x07",
						b: "\b",
						e: "\x1b",
						E: "\x1b",
						f: "\f",
						n: "\n",
						r: "\r",
						t: "\t",
						v: "\v",
						"\\": "\\",
						"'": "'",
						'"': '"',
					}[escapeSequence] ?? escapeSequence
				);
			},
		)
		.replaceAll("\0", "");
}

export function normalizeAnsiCQuotes(command) {
	let output = "";
	let index = 0;
	let quote = null;
	while (index < command.length) {
		const character = command[index];
		if (character === "\\" && quote !== "'") {
			output += command.slice(index, index + 2);
			index += 2;
			continue;
		}
		if (character === '"' && quote === null) {
			quote = '"';
			output += character;
			index += 1;
			continue;
		}
		if (character === '"' && quote === '"') {
			quote = null;
			output += character;
			index += 1;
			continue;
		}
		if (quote === null && command.startsWith("$'", index)) {
			let end = index + 2;
			let raw = "";
			while (end < command.length) {
				if (command[end] === "\\" && end + 1 < command.length) {
					raw += command.slice(end, end + 2);
					end += 2;
					continue;
				}
				if (command[end] === "'") break;
				raw += command[end];
				end += 1;
			}
			if (end >= command.length) return `${output}${command.slice(index)}`;
			const decoded = decodeAnsiCEscapes(raw).replaceAll("\x00", "");
			output += `'${decoded.replaceAll("'", `'\\''`)}'`;
			index = end + 1;
			continue;
		}
		output += character;
		index += 1;
	}
	return output;
}

function normalizeNewlines(command) {
	let output = "";
	let quote = null;
	let escaped = false;
	for (let index = 0; index < command.length; index += 1) {
		const character = command[index];
		if (escaped) {
			output += character;
			escaped = false;
			continue;
		}
		if (character === "\\" && quote !== "'") {
			output += character;
			escaped = true;
			continue;
		}
		if (
			(character === "'" || character === '"') &&
			(quote === null || quote === character)
		) {
			quote = quote === null ? character : null;
			output += character;
			continue;
		}
		if ((character === "\n" || character === "\r") && quote === null) {
			const previous =
				[...output].reverse().find((item) => !/\s/.test(item)) ?? "";
			const following =
				[...command.slice(index + 1)].find((item) => !/\s/.test(item)) ?? "";
			output +=
				["|", "&", "\\"].includes(previous) || ["|", "&"].includes(following)
					? " "
					: ";";
			continue;
		}
		output += character;
	}
	return output;
}

export function shellTokens(command) {
	try {
		const input = normalizeNewlines(normalizeAnsiCQuotes(command));
		const tokens = [];
		let current = "";
		let quoted = false;
		let dynamic = false;
		let quote = null;
		const flush = () => {
			if (current || quoted) tokens.push(token(current, quoted, dynamic));
			current = "";
			quoted = false;
			dynamic = false;
		};
		for (let index = 0; index < input.length; index += 1) {
			const character = input[index];
			if (quote === "'") {
				if (character === "'") quote = null;
				else current += character;
				continue;
			}
			if (quote === '"') {
				if (character === '"') {
					quote = null;
					continue;
				}
				if (
					character === "\\" &&
					index + 1 < input.length &&
					['"', "\\", "$", "`"].includes(input[index + 1])
				) {
					current += input[++index];
				} else {
					if (character === "$" || character === "`") dynamic = true;
					current += character;
				}
				continue;
			}
			if (character === "'" || character === '"') {
				quote = character;
				quoted = true;
				continue;
			}
			if (character === "\\") {
				if (index + 1 >= input.length) return null;
				current += input[++index];
				continue;
			}
			if (/\s/.test(character)) {
				flush();
				continue;
			}
			if (PUNCTUATION.has(character)) {
				flush();
				let punctuation = character;
				while (index + 1 < input.length && PUNCTUATION.has(input[index + 1]))
					punctuation += input[++index];
				tokens.push(token(punctuation));
				continue;
			}
			if (character === "$" || character === "`") dynamic = true;
			current += character;
		}
		if (quote !== null) return null;
		flush();
		return tokens;
	} catch {
		return null;
	}
}

export function broadPath(item) {
	const value = (typeof item === "string" ? item : item.value).trim();
	if (!value) return false;
	const broadRoots = new Set([
		"",
		".",
		"..",
		"/",
		"$PWD",
		`\${PWD}`,
		"$HOME",
		`\${HOME}`,
		"~",
	]);
	if (
		[
			"$PWD",
			`\${PWD}`,
			"$PWD/",
			`\${PWD}/`,
			"$HOME",
			`\${HOME}`,
			"$HOME/",
			`\${HOME}/`,
			"~",
			"~/",
		].includes(value)
	)
		return true;
	const normalized = posix.normalize(value);
	if (broadRoots.has(normalized)) return true;
	if (value.startsWith("/") && value.replaceAll("/", "") === "") return true;
	if (!["*", "?", "["].some((marker) => value.includes(marker))) return false;
	const wildcardIndex = Math.min(
		...["*", "?", "["]
			.map((marker) => value.indexOf(marker))
			.filter((position) => position >= 0),
	);
	return broadRoots.has(
		posix.normalize(value.slice(0, wildcardIndex).replace(/\/+$/, "")),
	);
}

export function substitutionBodies(command) {
	const bodies = [];
	let index = 0;
	let quote = null;
	while (index < command.length) {
		const character = command[index];
		if (character === "\\" && quote !== "'") {
			index += 2;
			continue;
		}
		if (
			(character === "'" || character === '"') &&
			(quote === null || quote === character)
		) {
			quote = quote === null ? character : null;
			index += 1;
			continue;
		}
		if (quote === "'") {
			index += 1;
			continue;
		}
		if (character === "`") {
			let end = index + 1;
			while (end < command.length && command[end] !== "`")
				end += command[end] === "\\" ? 2 : 1;
			if (end >= command.length) return bodies;
			bodies.push(command.slice(index + 1, end));
			index = end + 1;
			continue;
		}
		if (
			["$(", "<(", ">("].some((prefix) => command.startsWith(prefix, index))
		) {
			let depth = 1;
			let end = index + 2;
			let innerQuote = null;
			while (end < command.length && depth) {
				const item = command[end];
				if (item === "\\" && innerQuote !== "'") {
					end += 2;
					continue;
				}
				if (
					(item === "'" || item === '"') &&
					(innerQuote === null || innerQuote === item)
				)
					innerQuote = innerQuote === null ? item : null;
				else if (innerQuote === null) {
					if (item === "(") depth += 1;
					else if (item === ")") depth -= 1;
				}
				end += 1;
			}
			if (depth === 0) {
				bodies.push(command.slice(index + 2, end - 1));
				index = end;
				continue;
			}
		}
		index += 1;
	}
	return bodies;
}

export function segments(tokens) {
	const result = [];
	let current = [];
	for (const item of tokens) {
		if (isSyntaxToken(item, SHELL_OPERATORS)) {
			if (current.length) result.push(current);
			current = [];
		} else current.push(item);
	}
	if (current.length) result.push(current);
	return result;
}

export function values(items) {
	return items.map((item) => item.value);
}
