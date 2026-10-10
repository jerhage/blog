type ArrowText = '<->' | '-->' | '->' | '--';

type Token =
	| { readonly kind: 'word'; readonly text: string }
	| { readonly kind: 'string'; readonly text: string }
	| { readonly kind: 'number'; readonly value: number }
	| { readonly kind: 'open' }
	| { readonly kind: 'close' }
	| { readonly kind: 'pipe' }
	| { readonly kind: 'colon' }
	| { readonly kind: 'dots' }
	| { readonly kind: 'arrow'; readonly arrow: ArrowText };

type Tokens =
	| { readonly kind: 'tokens'; readonly tokens: readonly Token[] }
	| { readonly kind: 'invalid'; readonly message: string };

type SourceError = {
	readonly kind: string;
	readonly line: number;
	readonly message: string;
};

const WORD_START = /[A-Za-z_]/u;

const WORD_PART = /[A-Za-z0-9_]/u;

const DIGIT = /[0-9]/u;

const ARROWS: readonly ArrowText[] = ['<->', '-->', '->', '--'];

const SINGLE_CHARACTERS: Readonly<Record<string, Token | undefined>> = {
	'{': { kind: 'open' },
	'}': { kind: 'close' },
	'|': { kind: 'pipe' },
	':': { kind: 'colon' },
};

function readString(line: string, from: number): { text: string; end: number } | null {
	let text = '';
	let index = from + 1;
	while (index < line.length && line[index] !== '"') {
		if (line[index] === '\\' && index + 1 < line.length) index += 1;
		text += line[index];
		index += 1;
	}
	return index >= line.length ? null : { text, end: index + 1 };
}

function readWhile(line: string, from: number, accepts: RegExp): number {
	let end = from;
	while (end < line.length && accepts.test(line[end])) end += 1;
	return end;
}

function tokenize(line: string): Tokens {
	const tokens: Token[] = [];
	let index = 0;
	while (index < line.length) {
		const character = line[index];
		const single = SINGLE_CHARACTERS[character];
		const arrow = ARROWS.find((candidate) => line.startsWith(candidate, index));
		if (character === ' ' || character === '\t') {
			index += 1;
		} else if (character === '"') {
			const read = readString(line, index);
			if (read === null) return { kind: 'invalid', message: 'A quoted text is never closed.' };
			tokens.push({ kind: 'string', text: read.text });
			index = read.end;
		} else if (single !== undefined) {
			tokens.push(single);
			index += 1;
		} else if (line.startsWith('..', index)) {
			tokens.push({ kind: 'dots' });
			index += 2;
		} else if (arrow !== undefined) {
			tokens.push({ kind: 'arrow', arrow });
			index += arrow.length;
		} else if (WORD_START.test(character)) {
			const end = readWhile(line, index + 1, WORD_PART);
			tokens.push({ kind: 'word', text: line.slice(index, end) });
			index = end;
		} else if (DIGIT.test(character)) {
			const end = readWhile(line, index + 1, DIGIT);
			tokens.push({ kind: 'number', value: Number(line.slice(index, end)) });
			index = end;
		} else {
			return { kind: 'invalid', message: `Unexpected character "${character}".` };
		}
	}
	return { kind: 'tokens', tokens };
}

export { tokenize };
export type { ArrowText, SourceError, Token, Tokens };
