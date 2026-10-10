import { parseDiagram } from './parse';
import type { DiagramSource } from './parse';
import { parseSequence } from './sequence-parse';
import type { SequenceSource } from './sequence-parse';
import { tokenize } from './tokens';
import type { SourceError, Token } from './tokens';

type DiagramParts = {
	readonly boxes: readonly number[];
	readonly edges: readonly number[];
};

type StepsSource =
	| {
			readonly kind: 'sequence';
			readonly source: SequenceSource;
			readonly captions: readonly string[];
			readonly active: readonly (readonly number[])[];
	  }
	| {
			readonly kind: 'diagram';
			readonly source: DiagramSource;
			readonly captions: readonly string[];
			readonly active: readonly DiagramParts[];
	  };

type ParseStepsResult =
	| { readonly kind: 'success'; readonly steps: StepsSource }
	| { readonly kind: 'failure'; readonly errors: readonly SourceError[] };

type StepLine = {
	readonly line: number;
	readonly caption: string;
	readonly parts: readonly Token[];
};

type StepLines =
	| { readonly kind: 'steps'; readonly lines: readonly StepLine[]; readonly rest: string }
	| { readonly kind: 'failure'; readonly errors: readonly SourceError[] };

const STEP_SYNTAX = 'Write step "caption" : followed by the parts it highlights.';

function error(kind: string, line: number, message: string): SourceError {
	return { kind, line, message };
}

function stepLineOf(text: string, line: number): StepLine | SourceError {
	const tokenized = tokenize(text.trim());
	if (tokenized.kind === 'invalid') return error('syntax', line, tokenized.message);
	const [, caption, colon, ...parts] = tokenized.tokens;
	if (caption?.kind !== 'string' || colon?.kind !== 'colon' || parts.length === 0) {
		return error('syntax', line, STEP_SYNTAX);
	}
	return { line, caption: caption.text, parts };
}

function splitStepLines(lines: readonly string[]): StepLines {
	const found: StepLine[] = [];
	const errors: SourceError[] = [];
	const rest = lines.map((text, index) => {
		if (!/^\s*step\b/u.test(text)) return text;
		const stepLine = stepLineOf(text, index + 1);
		if ('kind' in stepLine) errors.push(stepLine);
		else found.push(stepLine);
		return '';
	});
	if (errors.length > 0) return { kind: 'failure', errors };
	return { kind: 'steps', lines: found, rest: rest.join('\n') };
}

function sequenceParts(parts: readonly Token[], count: number, line: number): number[] | SourceError {
	const indexes: number[] = [];
	for (const part of parts) {
		if (part.kind !== 'number') return error('syntax', line, 'A sequence step lists message and note numbers.');
		if (part.value < 1 || part.value > count) {
			return error('unknown-part', line, `There is no step ${part.value}; the sequence has ${count}.`);
		}
		indexes.push(part.value - 1);
	}
	return indexes;
}

function boxIds(source: DiagramSource): string[] {
	return source.members.flatMap((member) =>
		member.kind === 'box' ? [member.id] : member.boxes.map((box) => box.id),
	);
}

function diagramParts(parts: readonly Token[], source: DiagramSource, line: number): DiagramParts | SourceError {
	const ids = boxIds(source);
	const boxes: number[] = [];
	const edges: number[] = [];
	let index = 0;
	while (index < parts.length) {
		const [name, arrow, target] = parts.slice(index);
		if (name.kind !== 'word') return error('syntax', line, 'A diagram step lists node ids and edges such as a->b.');
		if (arrow?.kind === 'arrow' && arrow.arrow === '->' && target?.kind === 'word') {
			const edge = source.edges.findIndex((candidate) => candidate.from === name.text && candidate.to === target.text);
			if (edge === -1) return error('unknown-part', line, `There is no edge ${name.text}->${target.text}.`);
			edges.push(edge);
			index += 3;
			continue;
		}
		const box = ids.indexOf(name.text);
		if (box === -1) return error('unknown-part', line, `There is no node "${name.text}".`);
		boxes.push(box);
		index += 1;
	}
	return { boxes, edges };
}

function failureOf(errors: readonly SourceError[]): ParseStepsResult {
	return { kind: 'failure', errors: errors.toSorted((a, b) => a.line - b.line) };
}

function isError(value: unknown): value is SourceError {
	return typeof value === 'object' && value !== null && 'message' in value;
}

function collected<Part>(parts: readonly (Part | SourceError)[]): { parts: Part[]; errors: SourceError[] } {
	const good: Part[] = [];
	const errors: SourceError[] = [];
	for (const part of parts) {
		if (isError(part)) errors.push(part);
		else good.push(part);
	}
	return { parts: good, errors };
}

function parseSteps(text: string): ParseStepsResult {
	const lines = text.split('\n');
	const kindIndex = lines.findIndex((line) => line.trim() !== '' && !line.trim().startsWith('#'));
	const kind = lines[kindIndex]?.trim();
	if (kind !== 'sequence' && kind !== 'diagram') {
		return failureOf([error('unknown-kind', kindIndex + 1, 'The first line says what the steps walk through: sequence or diagram.')]);
	}
	const split = splitStepLines(lines.map((line, index) => (index === kindIndex ? '' : line)));
	if (split.kind === 'failure') return failureOf(split.errors);
	if (split.lines.length === 0) return failureOf([error('no-steps', 1, 'Add at least one step "caption" : parts line.')]);
	const captions = split.lines.map((step) => step.caption);

	if (kind === 'sequence') {
		const parsed = parseSequence(split.rest);
		if (parsed.kind === 'failure') return failureOf(parsed.errors);
		const checked = collected(split.lines.map((step) => sequenceParts(step.parts, parsed.source.steps.length, step.line)));
		if (checked.errors.length > 0) return failureOf(checked.errors);
		return { kind: 'success', steps: { kind, source: parsed.source, captions, active: checked.parts } };
	}
	const parsed = parseDiagram(split.rest);
	if (parsed.kind === 'failure') return failureOf(parsed.errors);
	const checked = collected(split.lines.map((step) => diagramParts(step.parts, parsed.source, step.line)));
	if (checked.errors.length > 0) return failureOf(checked.errors);
	return { kind: 'success', steps: { kind, source: parsed.source, captions, active: checked.parts } };
}

export { parseSteps };
export type { DiagramParts, ParseStepsResult, StepsSource };
