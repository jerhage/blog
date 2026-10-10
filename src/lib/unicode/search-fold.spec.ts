import { describe, expect, it } from 'vitest';
import { foldForSearch, searchFold } from './search-fold';

describe('the search fold', () => {
	it('finds a katakana query in hiragana text and highlights the original characters', () => {
		const fold = searchFold('ねこがすき', 'ネコ');

		expect(fold.found).toBe(true);
		expect(fold.foldedQuery).toBe('ねこ');
		expect(fold.parts).toEqual([
			{ text: 'ねこ', matched: true },
			{ text: 'がすき', matched: false },
		]);
	});

	it('finds a full-width query in half-width text', () => {
		const fold = searchFold('ｶﾞｲﾄﾞ 1', 'ガイド');

		expect(fold.foldedText).toBe('がいど 1');
		expect(fold.parts[0]).toEqual({ text: 'ｶﾞｲﾄﾞ', matched: true });
	});

	it('joins a spacing voiced mark onto the kana before it', () => {
		const fold = searchFold('か゛っこいい', 'がっこ');

		expect(fold.foldedText).toBe('がっこいい');
		expect(fold.parts[0]).toEqual({ text: 'か゛っこ', matched: true });
	});

	it('highlights a whole square word when the search matches what it expands to', () => {
		const fold = searchFold('５㌔走る', 'キロ');

		expect(fold.foldedText).toBe('5きろ走る');
		expect(fold.parts).toEqual([
			{ text: '５', matched: false },
			{ text: '㌔', matched: true },
			{ text: '走る', matched: false },
		]);
	});

	it('maps each folded unit back to the offset of the cluster that produced it', () => {
		expect(foldForSearch('ｶﾞ').origins).toEqual([0]);
		expect(foldForSearch('㌔a').origins).toEqual([0, 0, 1]);
	});

	it('finds a composed query in a decomposed title as one cluster', () => {
		const fold = searchFold('がくえん 1', 'がくえん');

		expect(fold.found).toBe(true);
		expect(fold.parts[0]).toEqual({ text: 'がくえん', matched: true });
	});
});
