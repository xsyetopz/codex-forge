export function rawTask(prompt) {
	if (typeof prompt !== "string") return null;
	const match = prompt.match(/^\s*!RAW(?=\s|$)([\s\S]*)$/);
	if (!match) return null;
	return match[1].replace(/^\s+/, "");
}

export function isRawPrompt(prompt) {
	return rawTask(prompt) !== null;
}
