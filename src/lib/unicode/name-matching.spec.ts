import { describe, expect, it } from 'vitest';
import { comparisonRows, sameTagName, tagName } from './name-matching';
import { codeUnitOrder, naturalOrder } from './natural-order';

describe('the tag name', () => {
	it('trims, composes with NFC and collapses inner whitespace', () => {
		expect(tagName('  my \t words ')).toBe('my words');
		expect(tagName('が')).toBe('が');
	});

	it('reports half-width katakana and hiragana as one tag name', () => {
		expect(sameTagName('ﾀｸﾞ', 'たぐ')).toBe(true);
	});

	it('reports names that differ only in case and spaces as one tag name', () => {
		expect(sameTagName('  my   words ', 'My words')).toBe(true);
	});
});

describe('the same-or-not rows', () => {
	it('lists three plain rows, four collator rows and the tag name row', () => {
		const rows = comparisonRows('ﾀｸﾞ', 'たぐ');

		expect(rows.map((one) => one.equal)).toEqual([
			false,
			false,
			false,
			true,
			true,
			true,
			false,
			true,
		]);
		expect(rows[3]?.label).toBe("Intl.Collator('ja', { sensitivity: 'base' })");
		expect(rows.at(-1)?.label).toBe('sameTagName(left, right)');
	});
});

describe('the file name orders', () => {
	it('puts page 2 before page 10 in natural order and after it by code units', () => {
		const names = ['page10.jpg', 'page2.jpg'];

		expect(naturalOrder(names)).toEqual(['page2.jpg', 'page10.jpg']);
		expect(codeUnitOrder(names)).toEqual(['page10.jpg', 'page2.jpg']);
	});
});
