type SqlValue = string | number | null;

type Hero = { readonly id: number; readonly name: string };

type Card = {
	readonly id: number;
	readonly heroId: number | null;
	readonly name: string;
	readonly format: 'cc' | 'blitz';
};

type MatchResult = 'won' | 'lost' | 'draw';

type Match = {
	readonly id: number;
	readonly heroId: number;
	readonly points: number;
	readonly result: MatchResult;
};

type CardType = {
	readonly id: number;
	readonly parentId: number | null;
	readonly name: string;
};

const HEROES: readonly Hero[] = [
	{ id: 1, name: 'Dorinthea' },
	{ id: 2, name: 'Katsu' },
	{ id: 3, name: 'Bravo' },
	{ id: 4, name: 'Oldhim' },
];

const CARDS: readonly Card[] = [
	{ id: 101, heroId: 1, name: "Warrior's Valor", format: 'cc' },
	{ id: 102, heroId: 1, name: 'Driving Blade', format: 'blitz' },
	{ id: 103, heroId: 1, name: 'Overpower', format: 'cc' },
	{ id: 104, heroId: 2, name: 'Head Jab', format: 'cc' },
	{ id: 105, heroId: 3, name: 'Chokeslam', format: 'blitz' },
	{ id: 106, heroId: null, name: 'Sink Below', format: 'blitz' },
];

const MATCHES: readonly Match[] = [
	{ id: 1, heroId: 1, points: 30, result: 'won' },
	{ id: 2, heroId: 1, points: 45, result: 'lost' },
	{ id: 3, heroId: 1, points: 20, result: 'won' },
	{ id: 4, heroId: 2, points: 60, result: 'draw' },
	{ id: 5, heroId: 2, points: 15, result: 'lost' },
	{ id: 6, heroId: 3, points: 25, result: 'won' },
	{ id: 7, heroId: 3, points: 25, result: 'won' },
	{ id: 8, heroId: 3, points: 40, result: 'lost' },
];

const CARD_TYPES: readonly CardType[] = [
	{ id: 1, parentId: null, name: 'Card' },
	{ id: 2, parentId: 1, name: 'Action' },
	{ id: 3, parentId: 2, name: 'Attack' },
	{ id: 4, parentId: 2, name: 'Non-attack' },
	{ id: 5, parentId: 1, name: 'Equipment' },
	{ id: 6, parentId: 3, name: 'Arrow' },
];

function authorHeroIds(): readonly number[] {
	return CARDS.flatMap((card) =>
		card.format === 'cc' && card.heroId !== null ? [card.heroId] : [],
	).toSorted((a, b) => a - b);
}

function winnerHeroIds(): readonly number[] {
	return MATCHES.filter((match) => match.result === 'won')
		.map((match) => match.heroId)
		.toSorted((a, b) => a - b);
}

export { CARDS, CARD_TYPES, HEROES, MATCHES, authorHeroIds, winnerHeroIds };
export type { Card, CardType, Hero, Match, MatchResult, SqlValue };
