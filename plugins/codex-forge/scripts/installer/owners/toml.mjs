export function tomlMultilineBasicString(value) {
	const text = String(value);
	let escaped = "";
	for (const character of text) {
		const code = character.codePointAt(0);
		if (character === "\\") escaped += "\\\\";
		else if (character === '"') escaped += '\\"';
		else if (character === "\r") escaped += "\\r";
		else if (character === "\n" || character === "\t") escaped += character;
		else if (code <= 0x1f || code === 0x7f)
			escaped += `\\u${code.toString(16).padStart(4, "0")}`;
		else escaped += character;
	}
	// TOML strips the newline immediately following the opening delimiter;
	// emitting it unconditionally preserves the source text, including leading LF.
	return `"""\n${escaped}"""`;
}
