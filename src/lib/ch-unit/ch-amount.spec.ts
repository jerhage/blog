import { describe, expect, it } from 'vitest';
import { clampAmount, formatLength, widthSpread } from './ch-amount';

describe('the ch amount', () => {
	it('writes a number and a unit as one CSS length', () => {
		expect(formatLength(68, 'ch')).toBe('68ch');
		expect(formatLength(42.5, 'rem')).toBe('42.5rem');
	});

	it('keeps an amount inside the range', () => {
		expect(clampAmount(500, 10, 120)).toBe(120);
		expect(clampAmount(2, 10, 120)).toBe(10);
		expect(clampAmount(68, 10, 120)).toBe(68);
	});

	it('falls back to the minimum for a number that is not one', () => {
		expect(clampAmount(Number.NaN, 10, 120)).toBe(10);
	});

	it('reports the narrowest, the widest and how many times wider the widest is', () => {
		expect(widthSpread([548, 685, 744])).toEqual({
			narrowest: 548,
			widest: 744,
			ratio: 744 / 548,
		});
	});

	it('reports nothing for no widths', () => {
		expect(widthSpread([])).toBeNull();
	});
});
