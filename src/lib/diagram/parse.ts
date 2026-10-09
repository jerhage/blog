import { match } from 'ts-pattern';
import type { DiagramTone } from '../../kandan/components/diagram';

type DiagramDirection = 'right' | 'down';

type SourceBox = {
	readonly kind: 'box';
	readonly id: string;
	readonly label: string;
	readonly detail?: string;
	readonly tone?: DiagramTone;
};

type SourceGroup = {
	readonly kind: 'group';
	readonly id: string;
	readonly label: string;
	readonly boxes: readonly SourceBox[];
};

type SourceMember = SourceBox | SourceGroup;

type EdgeArrows = 'forward' | 'both';

type SourceEdge = {
	readonly from: string;
	readonly to: string;
	readonly arrows: EdgeArrows;
	readonly label?: string;
};

type DiagramSource = {
	readonly title: string;
	readonly direction: DiagramDirection;
	readonly members: readonly SourceMember[];
	readonly edges: readonly SourceEdge[];
};

type DiagramErrorKind =
	| 'syntax'
	| 'missing-title'
	| 'duplicate-id'
	| 'unknown-id'
	| 'unknown-tone'
	| 'nested-group'
	| 'unsupported-edge';

type DiagramError = {
	readonly kind: DiagramErrorKind;
	readonly line: number;
	readonly message: string;
};

type ParseDiagramResult =
	| { readonly kind: 'success'; readonly source: DiagramSource }
	| { readonly kind: 'failure'; readonly errors: readonly DiagramError[] };

type Token =
	| { readonly kind: 'word'; readonly text: string }
	| { readonly kind: 'string'; readonly text: string }
	| { readonly kind: 'open' }
	| { readonly kind: 'close' }
	| { readonly kind: 'arrow'; readonly arrow: '->' | '<->' | '--' };

type Tokens =
	| { readonly kind: 'tokens'; readonly tokens: readonly Token[] }
	| { readonly kind: 'invalid'; readonly message: string };

type Statement =
	| { readonly kind: 'blank' }
	| { readonly kind: 'title'; readonly text: string }
	| { readonly kind: 'direction'; readonly direction: DiagramDirection }
	| { readonly kind: 'group-open'; readonly id: string; readonly label: string }
	| { readonly kind: 'group-close' }
	| { readonly kind: 'box'; readonly box: SourceBox }
	| { readonly kind: 'edge'; readonly edge: SourceEdge }
	| { readonly kind: 'invalid'; readonly error: Omit<DiagramError, 'line'> };

const SUPPORTED_TONES: readonly DiagramTone[] = ['neutral', 'primary', 'accent'];

const KNOWN_TONES = ['neutral', 'primary', 'accent', 'success', 'warning', 'danger'];

const WORD_START = /[A-Za-z_]/u;

const WORD_PART = /[A-Za-z0-9_]/u;

const ARROWS = ['<->', '->', '--'] as const;

function tokenize(line: string): Tokens {
	const tokens: Token[] = [];
	let index = 0;
	while (index < line.length) {
		const character = line[index];
		if (character === ' ' || character === '\t') {
			index += 1;
			continue;
		}
		if (character === '"') {
			let text = '';
			index += 1;
			while (index < line.length && line[index] !== '"') {
				if (line[index] === '\\' && index + 1 < line.length) index += 1;
				text += line[index];
				index += 1;
			}
			if (index >= line.length) return { kind: 'invalid', message: 'A quoted text is never closed.' };
			index += 1;
			tokens.push({ kind: 'string', text });
			continue;
		}
		if (character === '{') {
			tokens.push({ kind: 'open' });
			index += 1;
			continue;
		}
		if (character === '}') {
			tokens.push({ kind: 'close' });
			index += 1;
			continue;
		}
		const arrow = ARROWS.find((candidate) => line.startsWith(candidate, index));
		if (arrow !== undefined) {
			tokens.push({ kind: 'arrow', arrow });
			index += arrow.length;
			continue;
		}
		if (WORD_START.test(character)) {
			let end = index + 1;
			while (end < line.length && WORD_PART.test(line[end])) end += 1;
			tokens.push({ kind: 'word', text: line.slice(index, end) });
			index = end;
			continue;
		}
		return { kind: 'invalid', message: `Unexpected character "${character}".` };
	}
	return { kind: 'tokens', tokens };
}

function invalid(kind: DiagramErrorKind, message: string): Statement {
	return { kind: 'invalid', error: { kind, message } };
}

function syntax(message: string): Statement {
	return invalid('syntax', message);
}

function toneOf(name: string): { readonly tone: DiagramTone } | Statement {
	const tone = SUPPORTED_TONES.find((candidate) => candidate === name);
	if (tone !== undefined) return { tone };
	if (KNOWN_TONES.includes(name)) {
		return invalid(
			'unknown-tone',
			`The tone "${name}" cannot be drawn. Use ${SUPPORTED_TONES.join(', ')}.`,
		);
	}
	return invalid('unknown-tone', `Unknown tone "${name}". Use ${SUPPORTED_TONES.join(', ')}.`);
}

function boxStatement(id: string, label: string, rest: readonly Token[]): Statement {
	let detail: string | undefined;
	let tone: DiagramTone | undefined;
	let index = 0;
	while (index < rest.length) {
		const key = rest[index];
		const value = rest[index + 1];
		if (key.kind === 'word' && key.text === 'detail' && value?.kind === 'string' && detail === undefined) {
			detail = value.text;
		} else if (key.kind === 'word' && key.text === 'tone' && value?.kind === 'word' && tone === undefined) {
			const resolved = toneOf(value.text);
			if ('kind' in resolved) return resolved;
			tone = resolved.tone;
		} else {
			return syntax('After the label, a node takes detail "text" and tone name, once each.');
		}
		index += 2;
	}
	return { kind: 'box', box: { kind: 'box', id, label, detail, tone } };
}

function edgeStatement(from: string, arrow: '->' | '<->' | '--', to: string, rest: readonly Token[]): Statement {
	if (arrow === '--') {
		return invalid(
			'unsupported-edge',
			'An edge without an arrowhead cannot be drawn. Use -> or <->.',
		);
	}
	const arrows: EdgeArrows = arrow === '->' ? 'forward' : 'both';
	if (rest.length === 0) return { kind: 'edge', edge: { from, to, arrows } };
	const [label] = rest;
	if (rest.length === 1 && label.kind === 'string') {
		return { kind: 'edge', edge: { from, to, arrows, label: label.text } };
	}
	return syntax('An edge takes an optional "label" after the second id.');
}

function statementOf(line: string): Statement {
	const trimmed = line.trim();
	if (trimmed === '' || trimmed.startsWith('#')) return { kind: 'blank' };
	const tokenized = tokenize(trimmed);
	if (tokenized.kind === 'invalid') return syntax(tokenized.message);
	const [first, second, third, ...rest] = tokenized.tokens;
	const afterSecond = tokenized.tokens.slice(2);
	if (first.kind === 'close') {
		return tokenized.tokens.length === 1 ? { kind: 'group-close' } : syntax('A closing brace stands alone on its line.');
	}
	if (first.kind !== 'word') return syntax('A statement starts with a keyword or an id.');
	if (first.text === 'title') {
		return second?.kind === 'string' && third === undefined
			? { kind: 'title', text: second.text }
			: syntax('Write title "text".');
	}
	if (first.text === 'direction') {
		const direction = second?.kind === 'word' ? second.text : undefined;
		return (direction === 'right' || direction === 'down') && third === undefined
			? { kind: 'direction', direction }
			: syntax('Write direction right or direction down.');
	}
	if (first.text === 'group') {
		return second?.kind === 'word' &&
			third?.kind === 'string' &&
			rest.length === 1 &&
			rest[0].kind === 'open'
			? { kind: 'group-open', id: second.text, label: third.text }
			: syntax('Write group id "label" {.');
	}
	if (second?.kind === 'string') return boxStatement(first.text, second.text, afterSecond);
	if (second?.kind === 'arrow' && third?.kind === 'word') return edgeStatement(first.text, second.arrow, third.text, rest);
	return syntax('Write a node as id "label", or an edge as id -> id.');
}

function parseDiagram(text: string): ParseDiagramResult {
	const errors: DiagramError[] = [];
	const members: SourceMember[] = [];
	const edges: { readonly edge: SourceEdge; readonly line: number }[] = [];
	const declared = new Map<string, 'box' | 'group'>();
	let title: string | undefined;
	let direction: DiagramDirection = 'right';
	let openGroup: { id: string; label: string; line: number; boxes: SourceBox[] } | undefined;

	const fail = (kind: DiagramErrorKind, line: number, message: string) => {
		errors.push({ kind, line, message });
	};

	const declare = (id: string, kind: 'box' | 'group', line: number): boolean => {
		if (declared.has(id)) {
			fail('duplicate-id', line, `The id "${id}" is already used.`);
			return false;
		}
		declared.set(id, kind);
		return true;
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
			.with({ kind: 'direction' }, (statement) => {
				direction = statement.direction;
			})
			.with({ kind: 'group-open' }, (statement) => {
				if (openGroup !== undefined) {
					fail('nested-group', line, 'A group cannot hold another group.');
					return;
				}
				declare(statement.id, 'group', line);
				openGroup = { id: statement.id, label: statement.label, line, boxes: [] };
			})
			.with({ kind: 'group-close' }, () => {
				if (openGroup === undefined) {
					fail('syntax', line, 'A closing brace has no group to close.');
					return;
				}
				members.push({ kind: 'group', id: openGroup.id, label: openGroup.label, boxes: openGroup.boxes });
				openGroup = undefined;
			})
			.with({ kind: 'box' }, ({ box }) => {
				if (!declare(box.id, 'box', line)) return;
				if (openGroup === undefined) members.push(box);
				else openGroup.boxes.push(box);
			})
			.with({ kind: 'edge' }, ({ edge }) => {
				edges.push({ edge, line });
			})
			.exhaustive();
	});

	if (openGroup !== undefined) fail('syntax', openGroup.line, `The group "${openGroup.id}" is never closed.`);
	if (title === undefined) fail('missing-title', 1, 'The diagram needs a title "text" line.');

	for (const { edge, line } of edges) {
		for (const id of [edge.from, edge.to]) {
			const found = declared.get(id);
			if (found === undefined) fail('unknown-id', line, `The id "${id}" is not declared.`);
			else if (found === 'group') fail('unknown-id', line, `"${id}" is a group; an edge joins two nodes.`);
		}
	}

	if (errors.length > 0 || title === undefined) {
		return { kind: 'failure', errors: errors.toSorted((a, b) => a.line - b.line) };
	}
	return {
		kind: 'success',
		source: { title, direction, members, edges: edges.map(({ edge }) => edge) },
	};
}

export { parseDiagram };
export type {
	DiagramDirection,
	DiagramError,
	DiagramErrorKind,
	DiagramSource,
	EdgeArrows,
	ParseDiagramResult,
	SourceBox,
	SourceEdge,
	SourceGroup,
	SourceMember,
};
