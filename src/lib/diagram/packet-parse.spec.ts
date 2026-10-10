import { describe, expect, it } from 'vitest';
import { parsePacket } from './packet-parse';

const EXAMPLE = `# a comment
title "WireGuard message header"
bits 32
offsets 0 8 16 24
row "Type" 8 tone primary | "Reserved" 24 detail "Zero"
row "Sender index" 32
`;

function errorsOf(text: string) {
	const result = parsePacket(text);
	return result.kind === 'failure' ? result.errors : [];
}

const HEAD = 'title "t"\nbits 32\n';

describe('parsePacket', () => {
	it('reads the bits, the ruler and rows of fields with a detail and a tone', () => {
		expect(parsePacket(EXAMPLE)).toEqual({
			kind: 'success',
			source: {
				title: 'WireGuard message header',
				bits: 32,
				offsets: [0, 8, 16, 24],
				rows: [
					[
						{ name: 'Type', span: 8, tone: 'primary' },
						{ name: 'Reserved', span: 24, detail: 'Zero' },
					],
					[{ name: 'Sender index', span: 32 }],
				],
			},
		});
	});

	it('reports a missing title and missing bits on line 1', () => {
		expect(errorsOf('row "A" 8')).toEqual([
			{ kind: 'missing-title', line: 1, message: expect.any(String) },
			{ kind: 'missing-bits', line: 1, message: expect.any(String) },
		]);
	});

	it('reports a line it cannot read', () => {
		expect(errorsOf(`${HEAD}row "A" wide`)).toEqual([
			{ kind: 'syntax', line: 3, message: expect.any(String) },
		]);
	});

	it('reports a tone that does not exist', () => {
		expect(errorsOf(`${HEAD}row "A" 32 tone pink`)).toEqual([
			{ kind: 'unknown-tone', line: 3, message: expect.any(String) },
		]);
	});

	it('reports a row that does not fill the bits on the row own line', () => {
		expect(errorsOf(`${HEAD}row "A" 32\nrow "B" 8 | "C" 8`)).toEqual([
			{ kind: 'does-not-fit', line: 4, message: expect.stringContaining('16 bits') },
		]);
	});

	it('reports a ruler offset beyond the row on the offsets line', () => {
		expect(errorsOf(`${HEAD}offsets 0 40\nrow "A" 32`)).toEqual([
			{ kind: 'does-not-fit', line: 3, message: expect.stringContaining('40') },
		]);
	});
});
