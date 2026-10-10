import { describe, expect, it } from 'vitest';
import { parseSequence } from './sequence-parse';

const EXAMPLE = `# a comment
title "WireGuard handshake"
participant initiator "Initiator" tone primary
participant responder "Responder"
initiator -> responder "Handshake initiation"
responder --> initiator "Handshake response"
initiator -> initiator "Derive the session keys"
note initiator..responder "Both peers now share keys"
`;

function errorsOf(text: string) {
	const result = parseSequence(text);
	return result.kind === 'failure' ? result.errors : [];
}

const HEAD = 'title "t"\nparticipant a "A"\nparticipant b "B"\n';

describe('parseSequence', () => {
	it('reads participants, solid and dashed messages, a self-message and a note', () => {
		expect(parseSequence(EXAMPLE)).toEqual({
			kind: 'success',
			source: {
				title: 'WireGuard handshake',
				participants: [{ label: 'Initiator', tone: 'primary' }, { label: 'Responder' }],
				steps: [
					{ kind: 'message', from: 0, to: 1, label: 'Handshake initiation', dashed: false },
					{ kind: 'message', from: 1, to: 0, label: 'Handshake response', dashed: true },
					{ kind: 'message', from: 0, to: 0, label: 'Derive the session keys', dashed: false },
					{ kind: 'note', from: 0, to: 1, text: 'Both peers now share keys' },
				],
			},
		});
	});

	it('reports a missing title and a sequence with no participants on line 1', () => {
		expect(errorsOf('')).toEqual([
			{ kind: 'missing-title', line: 1, message: expect.any(String) },
			{ kind: 'missing-participants', line: 1, message: expect.any(String) },
		]);
	});

	it('reports a line it cannot read', () => {
		expect(errorsOf(`${HEAD}a -> b`)).toEqual([{ kind: 'syntax', line: 4, message: expect.any(String) }]);
	});

	it('reports a participant declared twice on the second line', () => {
		expect(errorsOf(`${HEAD}participant a "Again"`)).toEqual([
			{ kind: 'duplicate-id', line: 4, message: expect.any(String) },
		]);
	});

	it('reports a message and a note that name a participant nobody declared', () => {
		expect(errorsOf(`${HEAD}a -> z "x"\nnote a..y "n"`).map((e) => [e.kind, e.line])).toEqual([
			['unknown-id', 4],
			['unknown-id', 5],
		]);
	});

	it('reports a tone that does not exist', () => {
		expect(errorsOf(`${HEAD}participant c "C" tone danger`)).toEqual([
			{ kind: 'unknown-tone', line: 4, message: expect.any(String) },
		]);
	});
});
