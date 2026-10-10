import { describe, expect, it } from 'vitest';
import {
	PARTICLES,
	choseongOf,
	decomposeSyllable,
	particleFor,
	searchKind,
	syllableOf,
} from './hangul';
import type { Particle } from './hangul';

function particleNamed(pair: string): Particle {
	const found = PARTICLES.find((particle) => particle.pair === pair);
	if (found === undefined) throw new Error(`no particle ${pair}`);
	return found;
}

describe('the Hangul syllable formula', () => {
	it('splits 한 into initial 18, medial 0 and final 4', () => {
		const row = decomposeSyllable('한');

		expect(row?.initial).toEqual({ jamo: 'ㅎ', index: 18, conjoining: 'ᄒ' });
		expect(row?.medial).toEqual({ jamo: 'ㅏ', index: 0, conjoining: 'ᅡ' });
		expect(row?.final).toEqual({ jamo: 'ㄴ', index: 4, conjoining: 'ᆫ' });
		expect(row?.formula).toBe('0xAC00 + (18 × 21 + 0) × 28 + 4 = 0xD55C');
	});

	it('composes every one of the 11,172 syllables back from its three indices', () => {
		for (let offset = 0; offset < 19 * 21 * 28; offset += 1) {
			const character = String.fromCodePoint(0xac00 + offset);
			const row = decomposeSyllable(character);

			expect(row && syllableOf(row.initial.index, row.medial.index, row.final.index).syllable).toBe(
				character,
			);
		}
	});

	it('returns nothing for a character that is not a composed syllable', () => {
		expect(decomposeSyllable('ㄱ')).toBeNull();
		expect(decomposeSyllable('a')).toBeNull();
	});
});

describe('the initial consonants of a text', () => {
	it('keeps the initial of each syllable and the spaces, and drops the rest', () => {
		expect(choseongOf('라면')).toBe('ㄹㅁ');
		expect(choseongOf('띄어 쓰기')).toBe('ㄸㅇ ㅆㄱ');
		expect(choseongOf('네이버123')).toBe('ㄴㅇㅂ');
	});

	it('reads decomposed text like composed text', () => {
		expect(choseongOf('고양이'.normalize('NFD'))).toBe('ㄱㅇㅇ');
	});
});

describe('the search kind of a word', () => {
	it('finds 고양이 by its initial consonants and not 가방', () => {
		expect(searchKind('ㄱㅇㅇ', '고양이')).toBe('choseong');
		expect(searchKind('ㄱㅇㅇ', '가방')).toBe('none');
	});

	it('finds 고양이 inside 고양이가 as text, even when one side is decomposed', () => {
		expect(searchKind('고양이', '고양이가')).toBe('text');
		expect(searchKind('고양이'.normalize('NFD'), '고양이를')).toBe('text');
	});
});

describe('the particle that follows a word', () => {
	it('picks the form for a vowel ending and for a consonant ending', () => {
		expect(particleFor('사과', particleNamed('을/를'))).toBe('를');
		expect(particleFor('책', particleNamed('이/가'))).toBe('이');
		expect(particleFor('바나나', particleNamed('와/과'))).toBe('와');
	});

	it('treats a final ㄹ as a vowel ending for 으로/로 only', () => {
		expect(particleFor('서울', particleNamed('으로/로'))).toBe('로');
		expect(particleFor('집', particleNamed('으로/로'))).toBe('으로');
		expect(particleFor('서울', particleNamed('을/를'))).toBe('을');
	});
});
