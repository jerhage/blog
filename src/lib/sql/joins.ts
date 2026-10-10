import { match } from 'ts-pattern';
import type { Card, Hero } from './sample-data';

type JoinKind = 'inner' | 'left' | 'right' | 'full' | 'cross';

type JoinOrigin = 'matched' | 'left-only' | 'right-only' | 'unrelated';

type JoinedRow = {
	readonly hero: Hero | null;
	readonly card: Card | null;
	readonly origin: JoinOrigin;
};

const JOIN_KINDS: readonly JoinKind[] = ['inner', 'left', 'right', 'full', 'cross'];

function compareNullsFirst(left: number | null, right: number | null): number {
	return (left ?? 0) - (right ?? 0);
}

function compareRows(left: JoinedRow, right: JoinedRow): number {
	return (
		compareNullsFirst(left.hero?.id ?? null, right.hero?.id ?? null) ||
		compareNullsFirst(left.card?.id ?? null, right.card?.id ?? null)
	);
}

function pairs(heroes: readonly Hero[], cards: readonly Card[]): readonly JoinedRow[] {
	return heroes.flatMap((hero) =>
		cards.map(
			(card): JoinedRow => ({
				hero,
				card,
				origin: card.heroId === hero.id ? 'matched' : 'unrelated',
			}),
		),
	);
}

function heroesWithoutCards(heroes: readonly Hero[], cards: readonly Card[]): readonly JoinedRow[] {
	return heroes
		.filter((hero) => !cards.some((card) => card.heroId === hero.id))
		.map((hero): JoinedRow => ({ hero, card: null, origin: 'left-only' }));
}

function cardsWithoutHeroes(heroes: readonly Hero[], cards: readonly Card[]): readonly JoinedRow[] {
	return cards
		.filter((card) => !heroes.some((hero) => hero.id === card.heroId))
		.map((card): JoinedRow => ({ hero: null, card, origin: 'right-only' }));
}

function joinRows(
	kind: JoinKind,
	heroes: readonly Hero[],
	cards: readonly Card[],
): readonly JoinedRow[] {
	const all = pairs(heroes, cards);
	const matched = all.filter((row) => row.origin === 'matched');
	return match(kind)
		.returnType<readonly JoinedRow[]>()
		.with('inner', () => matched)
		.with('left', () => [...matched, ...heroesWithoutCards(heroes, cards)])
		.with('right', () => [...matched, ...cardsWithoutHeroes(heroes, cards)])
		.with('full', () => [
			...matched,
			...heroesWithoutCards(heroes, cards),
			...cardsWithoutHeroes(heroes, cards),
		])
		.with('cross', () => all)
		.exhaustive()
		.toSorted(compareRows);
}

function joinClause(kind: JoinKind): string {
	return match(kind)
		.with('inner', () => 'JOIN cards c ON c.hero_id = h.id')
		.with('left', () => 'LEFT JOIN cards c ON c.hero_id = h.id')
		.with('right', () => 'RIGHT JOIN cards c ON c.hero_id = h.id')
		.with('full', () => 'FULL JOIN cards c ON c.hero_id = h.id')
		.with('cross', () => 'CROSS JOIN cards c')
		.exhaustive();
}

function joinSql(kind: JoinKind): string {
	return `SELECT h.name, c.id AS card_id, c.name AS card\nFROM heroes h\n${joinClause(kind)}\nORDER BY h.id, c.id;`;
}

function joinKindLabel(kind: JoinKind): string {
	return match(kind)
		.with('inner', () => 'INNER')
		.with('left', () => 'LEFT')
		.with('right', () => 'RIGHT')
		.with('full', () => 'FULL OUTER')
		.with('cross', () => 'CROSS')
		.exhaustive();
}

function joinOriginLabel(origin: JoinOrigin): string {
	return match(origin)
		.with('matched', () => 'matched')
		.with('left-only', () => 'left only')
		.with('right-only', () => 'right only')
		.with('unrelated', () => 'not a match')
		.exhaustive();
}

export { JOIN_KINDS, joinKindLabel, joinOriginLabel, joinRows, joinSql };
export type { JoinKind, JoinOrigin, JoinedRow };
