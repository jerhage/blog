function toneNamed<Tone extends string>(name: string, allowed: readonly Tone[]): Tone | null {
	return allowed.find((candidate) => candidate === name) ?? null;
}

function unknownToneMessage(name: string, allowed: readonly string[]): string {
	return `Unknown tone "${name}". Use ${allowed.join(', ')}.`;
}

export { toneNamed, unknownToneMessage };
