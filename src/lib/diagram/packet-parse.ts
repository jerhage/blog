import { match } from 'ts-pattern';
import { packetProblems } from '../../kandan/components/packet';
import type { PacketField, PacketRow, PacketTone } from '../../kandan/components/packet';
import { toneNamed, unknownToneMessage } from './tones';
import { tokenize } from './tokens';
import type { SourceError, Token } from './tokens';

type PacketSource = {
	readonly title: string;
	readonly bits: number;
	readonly offsets: readonly number[];
	readonly rows: readonly PacketRow[];
};

type PacketErrorKind =
	| 'syntax'
	| 'missing-title'
	| 'missing-bits'
	| 'unknown-tone'
	| 'does-not-fit';

type PacketError = SourceError & { readonly kind: PacketErrorKind };

type ParsePacketResult =
	| { readonly kind: 'success'; readonly source: PacketSource }
	| { readonly kind: 'failure'; readonly errors: readonly PacketError[] };

type Statement =
	| { readonly kind: 'blank' }
	| { readonly kind: 'title'; readonly text: string }
	| { readonly kind: 'bits'; readonly bits: number }
	| { readonly kind: 'offsets'; readonly offsets: readonly number[] }
	| { readonly kind: 'row'; readonly row: PacketRow }
	| { readonly kind: 'invalid'; readonly error: Omit<PacketError, 'line'> };

const PACKET_TONES: readonly PacketTone[] = ['primary', 'accent', 'success', 'warning', 'danger'];

const FIELD_SYNTAX = 'Write a field as "Name" bits, then an optional detail "text" and tone name.';

const ROW_PROBLEM = /^Row (\d+) /u;

function invalid(kind: PacketErrorKind, message: string): Statement {
	return { kind: 'invalid', error: { kind, message } };
}

function syntax(message: string): Statement {
	return invalid('syntax', message);
}

function fieldFrom(tokens: readonly Token[]): PacketField | Statement {
	const [name, span, ...options] = tokens;
	if (name?.kind !== 'string' || span?.kind !== 'number') return syntax(FIELD_SYNTAX);
	let detail: string | undefined;
	let tone: PacketTone | undefined;
	for (let index = 0; index < options.length; index += 2) {
		const key = options[index];
		const value = options[index + 1];
		if (key.kind === 'word' && key.text === 'detail' && value?.kind === 'string' && detail === undefined) {
			detail = value.text;
		} else if (key.kind === 'word' && key.text === 'tone' && value?.kind === 'word' && tone === undefined) {
			const named = toneNamed(value.text, PACKET_TONES);
			if (named === null) return invalid('unknown-tone', unknownToneMessage(value.text, PACKET_TONES));
			tone = named;
		} else {
			return syntax(FIELD_SYNTAX);
		}
	}
	return { name: name.text, span: span.value, detail, tone };
}

function rowStatement(tokens: readonly Token[]): Statement {
	const fields: PacketField[] = [];
	let current: Token[] = [];
	for (const token of [...tokens, { kind: 'pipe' } as const]) {
		if (token.kind !== 'pipe') {
			current.push(token);
			continue;
		}
		const field = fieldFrom(current);
		if ('kind' in field) return field;
		fields.push(field);
		current = [];
	}
	return { kind: 'row', row: fields };
}

function numbersOf(tokens: readonly Token[]): number[] | null {
	const numbers = tokens.flatMap((token) => (token.kind === 'number' ? [token.value] : []));
	return numbers.length === tokens.length ? numbers : null;
}

function statementOf(line: string): Statement {
	const trimmed = line.trim();
	if (trimmed === '' || trimmed.startsWith('#')) return { kind: 'blank' };
	const tokenized = tokenize(trimmed);
	if (tokenized.kind === 'invalid') return syntax(tokenized.message);
	const [first, ...rest] = tokenized.tokens;
	if (first?.kind !== 'word') return syntax('A statement starts with a keyword.');
	if (first.text === 'title') {
		return rest[0]?.kind === 'string' && rest.length === 1
			? { kind: 'title', text: rest[0].text }
			: syntax('Write title "text".');
	}
	if (first.text === 'bits') {
		return rest[0]?.kind === 'number' && rest.length === 1
			? { kind: 'bits', bits: rest[0].value }
			: syntax('Write bits followed by a whole number, such as bits 32.');
	}
	if (first.text === 'offsets') {
		const offsets = numbersOf(rest);
		return offsets === null || offsets.length === 0
			? syntax('Write offsets followed by whole numbers, such as offsets 0 8 16 24.')
			: { kind: 'offsets', offsets };
	}
	if (first.text === 'row') return rowStatement(rest);
	return syntax('A packet has title, bits, offsets and row lines.');
}

function problemLine(message: string, rowLines: readonly number[], fallback: number): number {
	const found = ROW_PROBLEM.exec(message);
	return found === null ? fallback : (rowLines[Number(found[1]) - 1] ?? fallback);
}

function parsePacket(text: string): ParsePacketResult {
	const errors: PacketError[] = [];
	const rows: PacketRow[] = [];
	const rowLines: number[] = [];
	let title: string | undefined;
	let bits: { value: number; line: number } | undefined;
	let offsets: { values: readonly number[]; line: number } | undefined;

	const fail = (kind: PacketErrorKind, line: number, message: string) => {
		errors.push({ kind, line, message });
	};

	text.split('\n').forEach((raw, index) => {
		const line = index + 1;
		match(statementOf(raw))
			.with({ kind: 'blank' }, () => undefined)
			.with({ kind: 'invalid' }, ({ error }) => fail(error.kind, line, error.message))
			.with({ kind: 'title' }, (statement) => {
				if (title !== undefined) fail('syntax', line, 'The title is already set.');
				else title = statement.text;
			})
			.with({ kind: 'bits' }, (statement) => {
				if (bits !== undefined) fail('syntax', line, 'The bits are already set.');
				else bits = { value: statement.bits, line };
			})
			.with({ kind: 'offsets' }, (statement) => {
				if (offsets !== undefined) fail('syntax', line, 'The offsets are already set.');
				else offsets = { values: statement.offsets, line };
			})
			.with({ kind: 'row' }, (statement) => {
				rows.push(statement.row);
				rowLines.push(line);
			})
			.exhaustive();
	});

	if (title === undefined) fail('missing-title', 1, 'The packet needs a title "text" line.');
	if (bits === undefined) fail('missing-bits', 1, 'The packet needs a bits line, such as bits 32.');
	if (errors.length === 0 && title !== undefined && bits !== undefined) {
		const ruler = offsets?.values ?? [];
		for (const problem of packetProblems(bits.value, ruler, rows)) {
			fail('does-not-fit', problemLine(problem, rowLines, offsets?.line ?? bits.line), problem);
		}
		if (errors.length === 0) {
			return { kind: 'success', source: { title, bits: bits.value, offsets: ruler, rows } };
		}
	}
	return { kind: 'failure', errors: errors.toSorted((a, b) => a.line - b.line) };
}

export { parsePacket };
export type { PacketError, PacketErrorKind, PacketSource, ParsePacketResult };
