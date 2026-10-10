import { match } from 'ts-pattern';
import type {
	SequenceParticipant,
	SequenceStep,
	SequenceTone,
} from '../../kandan/components/sequence';
import { toneNamed, unknownToneMessage } from './tones';
import { tokenize } from './tokens';
import type { SourceError } from './tokens';

type SequenceSource = {
	readonly title: string;
	readonly participants: readonly SequenceParticipant[];
	readonly steps: readonly SequenceStep[];
};

type SequenceErrorKind =
	| 'syntax'
	| 'missing-title'
	| 'missing-participants'
	| 'duplicate-id'
	| 'unknown-id'
	| 'unknown-tone';

type SequenceError = SourceError & { readonly kind: SequenceErrorKind };

type ParseSequenceResult =
	| { readonly kind: 'success'; readonly source: SequenceSource }
	| { readonly kind: 'failure'; readonly errors: readonly SequenceError[] };

type NamedStep =
	| {
			readonly kind: 'message';
			readonly from: string;
			readonly to: string;
			readonly label: string;
			readonly dashed: boolean;
	  }
	| { readonly kind: 'note'; readonly from: string; readonly to: string; readonly text: string };

type Statement =
	| { readonly kind: 'blank' }
	| { readonly kind: 'title'; readonly text: string }
	| { readonly kind: 'participant'; readonly id: string; readonly label: string; readonly tone?: SequenceTone }
	| { readonly kind: 'step'; readonly step: NamedStep }
	| { readonly kind: 'invalid'; readonly error: Omit<SequenceError, 'line'> };

const SEQUENCE_TONES: readonly SequenceTone[] = ['primary', 'accent'];

function invalid(kind: SequenceErrorKind, message: string): Statement {
	return { kind: 'invalid', error: { kind, message } };
}

function syntax(message: string): Statement {
	return invalid('syntax', message);
}

function statementOf(line: string): Statement {
	const trimmed = line.trim();
	if (trimmed === '' || trimmed.startsWith('#')) return { kind: 'blank' };
	const tokenized = tokenize(trimmed);
	if (tokenized.kind === 'invalid') return syntax(tokenized.message);
	const [first, second, third, fourth, fifth] = tokenized.tokens;
	const count = tokenized.tokens.length;
	if (first?.kind !== 'word') return syntax('A statement starts with a keyword or an id.');
	if (first.text === 'title') {
		return second?.kind === 'string' && count === 2
			? { kind: 'title', text: second.text }
			: syntax('Write title "text".');
	}
	if (first.text === 'participant') {
		if (second?.kind !== 'word' || third?.kind !== 'string') {
			return syntax('Write participant id "Label", with an optional tone name.');
		}
		if (count === 3) return { kind: 'participant', id: second.text, label: third.text };
		if (count !== 5 || fourth?.kind !== 'word' || fourth.text !== 'tone' || fifth?.kind !== 'word') {
			return syntax('Write participant id "Label", with an optional tone name.');
		}
		const tone = toneNamed(fifth.text, SEQUENCE_TONES);
		if (tone === null) return invalid('unknown-tone', unknownToneMessage(fifth.text, SEQUENCE_TONES));
		return { kind: 'participant', id: second.text, label: third.text, tone };
	}
	if (first.text === 'note') {
		return second?.kind === 'word' &&
			third?.kind === 'dots' &&
			fourth?.kind === 'word' &&
			fifth?.kind === 'string' &&
			count === 5
			? { kind: 'step', step: { kind: 'note', from: second.text, to: fourth.text, text: fifth.text } }
			: syntax('Write note a..b "text".');
	}
	if (
		second?.kind === 'arrow' &&
		(second.arrow === '->' || second.arrow === '-->') &&
		third?.kind === 'word' &&
		fourth?.kind === 'string' &&
		count === 4
	) {
		return {
			kind: 'step',
			step: {
				kind: 'message',
				from: first.text,
				to: third.text,
				label: fourth.text,
				dashed: second.arrow === '-->',
			},
		};
	}
	return syntax('Write a message as a -> b "label" or a --> b "label".');
}

function parseSequence(text: string): ParseSequenceResult {
	const errors: SequenceError[] = [];
	const indexOf = new Map<string, number>();
	const participants: SequenceParticipant[] = [];
	const named: { readonly step: NamedStep; readonly line: number }[] = [];
	let title: string | undefined;

	const fail = (kind: SequenceErrorKind, line: number, message: string) => {
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
			.with({ kind: 'participant' }, (statement) => {
				if (indexOf.has(statement.id)) {
					fail('duplicate-id', line, `The id "${statement.id}" is already used.`);
					return;
				}
				indexOf.set(statement.id, participants.length);
				participants.push({ label: statement.label, tone: statement.tone });
			})
			.with({ kind: 'step' }, ({ step }) => {
				named.push({ step, line });
			})
			.exhaustive();
	});

	if (title === undefined) fail('missing-title', 1, 'The sequence needs a title "text" line.');
	if (participants.length === 0) {
		fail('missing-participants', 1, 'The sequence needs at least one participant id "Label" line.');
	}

	const steps: SequenceStep[] = [];
	for (const { step, line } of named) {
		const from = indexOf.get(step.from);
		const to = indexOf.get(step.to);
		for (const [id, found] of [[step.from, from], [step.to, to]] as const) {
			if (found === undefined) fail('unknown-id', line, `The participant "${id}" is not declared.`);
		}
		if (from === undefined || to === undefined) continue;
		steps.push(
			step.kind === 'message'
				? { kind: 'message', from, to, label: step.label, dashed: step.dashed }
				: { kind: 'note', from, to, text: step.text },
		);
	}

	if (errors.length > 0 || title === undefined) {
		return { kind: 'failure', errors: errors.toSorted((a, b) => a.line - b.line) };
	}
	return { kind: 'success', source: { title, participants, steps } };
}

export { parseSequence };
export type { ParseSequenceResult, SequenceError, SequenceErrorKind, SequenceSource };
