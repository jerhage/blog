import { describe, expect, it } from 'vitest';
import { parseSteps } from './steps-parse';

const SEQUENCE = `sequence
title "Handshake"
participant a "Alpha"
participant b "Beta"
a -> b "Hello"
b --> a "Hi"
step "Alpha speaks first." : 1
step "Both are done." : 1 2
`;

const DIAGRAM = `diagram
title "Route"
group g "LAN" {
  x "X"
}
y "Y"
x -> y "go"
step "Start at X." : x
step "The link and Y." : x->y y
`;

function errorsOf(text: string) {
	const result = parseSteps(text);
	return result.kind === 'failure' ? result.errors : [];
}

describe('parseSteps', () => {
	it('reads a sequence with captions and the message numbers each step highlights', () => {
		const result = parseSteps(SEQUENCE);
		expect(result).toMatchObject({
			kind: 'success',
			steps: {
				kind: 'sequence',
				captions: ['Alpha speaks first.', 'Both are done.'],
				active: [[0], [0, 1]],
				source: { title: 'Handshake' },
			},
		});
	});

	it('reads a diagram with the nodes and edges each step highlights', () => {
		expect(parseSteps(DIAGRAM)).toMatchObject({
			kind: 'success',
			steps: {
				kind: 'diagram',
				active: [
					{ boxes: [0], edges: [] },
					{ boxes: [1], edges: [0] },
				],
			},
		});
	});

	it('reports a first line that is neither sequence nor diagram', () => {
		expect(errorsOf('packet\nstep "x" : 1')).toEqual([
			{ kind: 'unknown-kind', line: 1, message: expect.any(String) },
		]);
	});

	it('reports a steps block without a step line', () => {
		expect(errorsOf('sequence\ntitle "t"\nparticipant a "A"')).toEqual([
			{ kind: 'no-steps', line: 1, message: expect.any(String) },
		]);
	});

	it('reports a step line it cannot read on its own line', () => {
		expect(errorsOf(`${SEQUENCE}step "no colon" 1`)).toEqual([
			{ kind: 'syntax', line: 9, message: expect.any(String) },
		]);
	});

	it('reports a step that names a message, node or edge that does not exist', () => {
		expect(errorsOf(`${SEQUENCE}step "x" : 3`)).toEqual([
			{ kind: 'unknown-part', line: 9, message: expect.any(String) },
		]);
		expect(errorsOf(`${DIAGRAM}step "x" : nowhere\nstep "y" : y->x`).map((e) => [e.kind, e.line])).toEqual([
			['unknown-part', 10],
			['unknown-part', 11],
		]);
	});

	it('reports the underlying sequence or diagram error at its own line', () => {
		expect(errorsOf('sequence\ntitle "t"\nparticipant a "A"\na -> z "x"\nstep "s" : 1')).toEqual([
			{ kind: 'unknown-id', line: 4, message: expect.any(String) },
		]);
	});
});
