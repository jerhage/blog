import { match } from 'ts-pattern';

const SYLLABLE_FIRST = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
const INITIAL_BASE = 0x1100;
const MEDIAL_BASE = 0x1161;
const FINAL_BASE = 0x11a7;
const INITIAL_LAST = 0x1112;
const MEDIAL_COUNT = 21;
const FINAL_COUNT = 28;
const RIEUL_FINAL = 8;

const INITIALS: readonly string[] = Array.from('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ');
const MEDIALS: readonly string[] = Array.from('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ');
const FINALS: readonly string[] = ['', ...Array.from('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ')];

const COMPATIBILITY_CONSONANT = /^[ㄱ-ㅎ]$/u;
const WHITESPACE = /^\s$/u;

type JamoPart = {
	readonly jamo: string;
	readonly index: number;
	readonly conjoining: string;
};

type Syllable = {
	readonly syllable: string;
	readonly codePoint: string;
	readonly initial: JamoPart;
	readonly medial: JamoPart;
	readonly final: JamoPart;
	readonly formula: string;
};

type SearchKind = 'text' | 'choseong' | 'none';

type FinalKind = 'vowel' | 'rieul' | 'consonant';

type Particle = {
	readonly pair: string;
	readonly afterConsonant: string;
	readonly afterVowel: string;
	readonly afterRieul: string;
};

type ParticleRow = {
	readonly pair: string;
	readonly particle: string;
	readonly joined: string;
};

const PARTICLES: readonly Particle[] = [
	{ pair: '이/가', afterConsonant: '이', afterVowel: '가', afterRieul: '이' },
	{ pair: '을/를', afterConsonant: '을', afterVowel: '를', afterRieul: '을' },
	{ pair: '은/는', afterConsonant: '은', afterVowel: '는', afterRieul: '은' },
	{ pair: '와/과', afterConsonant: '과', afterVowel: '와', afterRieul: '과' },
	{ pair: '으로/로', afterConsonant: '으로', afterVowel: '로', afterRieul: '로' },
];

function hex(value: number): string {
	return value.toString(16).toUpperCase().padStart(4, '0');
}

function initialPart(index: number): JamoPart {
	return {
		jamo: INITIALS[index] ?? '',
		index,
		conjoining: String.fromCodePoint(INITIAL_BASE + index),
	};
}

function medialPart(index: number): JamoPart {
	return {
		jamo: MEDIALS[index] ?? '',
		index,
		conjoining: String.fromCodePoint(MEDIAL_BASE + index),
	};
}

function finalPart(index: number): JamoPart {
	return {
		jamo: FINALS[index] ?? '',
		index,
		conjoining: index === 0 ? '' : String.fromCodePoint(FINAL_BASE + index),
	};
}

function syllableOf(initial: number, medial: number, final: number): Syllable {
	const value = SYLLABLE_FIRST + (initial * MEDIAL_COUNT + medial) * FINAL_COUNT + final;
	return {
		syllable: String.fromCodePoint(value),
		codePoint: `U+${hex(value)}`,
		initial: initialPart(initial),
		medial: medialPart(medial),
		final: finalPart(final),
		formula: `0xAC00 + (${initial} × ${MEDIAL_COUNT} + ${medial}) × ${FINAL_COUNT} + ${final} = 0x${hex(value)}`,
	};
}

function isSyllable(value: number): boolean {
	return value >= SYLLABLE_FIRST && value <= SYLLABLE_LAST;
}

function decomposeSyllable(character: string): Syllable | null {
	const value = character.codePointAt(0);
	if (value === undefined || !isSyllable(value)) return null;

	const offset = value - SYLLABLE_FIRST;
	return syllableOf(
		Math.floor(offset / (MEDIAL_COUNT * FINAL_COUNT)),
		Math.floor(offset / FINAL_COUNT) % MEDIAL_COUNT,
		offset % FINAL_COUNT,
	);
}

function syllableRows(text: string): readonly Syllable[] {
	return Array.from(text.normalize('NFC'), decomposeSyllable).filter((row) => row !== null);
}

function choseongLetter(character: string): string {
	const value = character.codePointAt(0) ?? 0;
	if (value >= INITIAL_BASE && value <= INITIAL_LAST) return INITIALS[value - INITIAL_BASE] ?? '';
	if (COMPATIBILITY_CONSONANT.test(character) || WHITESPACE.test(character)) return character;
	return '';
}

function choseongOf(text: string): string {
	return Array.from(text.normalize('NFD'), choseongLetter).join('');
}

function isChoseongQuery(query: string): boolean {
	return query.length > 0 && Array.from(query).every((letter) => INITIALS.includes(letter));
}

function searchKind(query: string, word: string): SearchKind {
	const needle = query.trim().normalize('NFC');
	if (needle === '') return 'none';

	const text = word.normalize('NFC');
	if (text.includes(needle)) return 'text';
	if (isChoseongQuery(needle) && choseongOf(text).includes(needle)) return 'choseong';
	return 'none';
}

function finalKindOf(word: string): FinalKind {
	const last = Array.from(word.normalize('NFC')).at(-1);
	const final = last === undefined ? 0 : (decomposeSyllable(last)?.final.index ?? 0);

	if (final === 0) return 'vowel';
	return final === RIEUL_FINAL ? 'rieul' : 'consonant';
}

function particleFor(word: string, particle: Particle): string {
	return match(finalKindOf(word))
		.with('vowel', () => particle.afterVowel)
		.with('rieul', () => particle.afterRieul)
		.with('consonant', () => particle.afterConsonant)
		.exhaustive();
}

function particleRows(word: string): readonly ParticleRow[] {
	return PARTICLES.map((particle) => {
		const chosen = particleFor(word, particle);
		return { pair: particle.pair, particle: chosen, joined: word + chosen };
	});
}

export {
	FINALS,
	INITIALS,
	MEDIALS,
	PARTICLES,
	choseongOf,
	decomposeSyllable,
	finalKindOf,
	particleFor,
	particleRows,
	searchKind,
	syllableOf,
	syllableRows,
};
export type { FinalKind, JamoPart, Particle, ParticleRow, SearchKind, Syllable };
