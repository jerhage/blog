import { describe, expect, it } from 'vitest';
import { recursionCaption, recursionSteps } from './recursion';
import { CARD_TYPES } from './sample-data';

describe('recursionSteps', () => {
	it('walks one level per run and ends on an empty working table', () => {
		const steps = recursionSteps(CARD_TYPES, 1);
		expect(steps.map((step) => step.working.map((row) => row.name))).toEqual([
			['Card'],
			['Action', 'Equipment'],
			['Attack', 'Non-attack'],
			['Arrow'],
			[],
		]);
	});

	it('accumulates the result with the depth and path of each row', () => {
		const last = recursionSteps(CARD_TYPES, 1).at(-1);
		expect(last?.result.map((row) => [row.name, row.depth, row.path])).toEqual([
			['Card', 0, 'Card'],
			['Action', 1, 'Card > Action'],
			['Equipment', 1, 'Card > Equipment'],
			['Attack', 2, 'Card > Action > Attack'],
			['Non-attack', 2, 'Card > Action > Non-attack'],
			['Arrow', 3, 'Card > Action > Attack > Arrow'],
		]);
	});

	it('captions the anchor, a run and the end', () => {
		const steps = recursionSteps(CARD_TYPES, 1);
		expect(recursionCaption(0, steps[0]!)).toContain('anchor');
		expect(recursionCaption(4, steps[4]!)).toContain('empty');
	});
});
