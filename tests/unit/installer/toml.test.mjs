import { expect, test } from "bun:test";
import { TOML } from "bun";
import { tomlMultilineBasicString } from "../../../plugins/codex-forge/scripts/installer/owners/toml.mjs";

test("multiline basic encoder round-trips TOML-sensitive text exactly", () => {
	const values = [
		"ordinary text",
		"\nleading LF",
		"\n\nmultiple leading LF",
		"internal\nLF",
		"CRLF\r\nline",
		"lone\rCR",
		"back\\slash",
		"single ' and double \" quotes",
		'triple """ quotes',
		"tabs\tremain",
		"controls\b\f\u0000\u0001\u000b\u000c\u001f\u007f",
	];
	for (const value of values) {
		const encoded = tomlMultilineBasicString(value);
		expect(TOML.parse(`value = ${encoded}\n`).value).toBe(value);
	}
});

test("multiline encoder uses safe escapes for CR, quotes, backslashes, and controls", () => {
	const encoded = tomlMultilineBasicString('\\"""\r\u0000\u000b');
	expect(encoded).toContain("\\\\");
	expect(encoded).toContain('\\"');
	expect(encoded).toContain("\\r");
	expect(encoded).toContain("\\u0000");
	expect(encoded).toContain("\\u000b");
	expect(TOML.parse(`value = ${encoded}\n`).value).toBe('\\"""\r\u0000\u000b');
});
