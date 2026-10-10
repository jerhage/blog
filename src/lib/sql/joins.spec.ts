import { describe, expect, it } from 'vitest';
import { joinRows, joinSql } from './joins';
import type { JoinKind } from './joins';
import { CARDS, HEROES } from './sample-data';

function table(kind: JoinKind): readonly (readonly (string | number | null)[])[] {
	return joinRows(kind, HEROES, CARDS).map((row) => [
		row.hero?.name ?? null,
		row.card?.id ?? null,
		row.origin,
	]);
}

describe('joinRows', () => {
	it('keeps only matching pairs for an inner join', () => {
		expect(table('inner')).toEqual([
			['Dorinthea', 101, 'matched'],
			['Dorinthea', 102, 'matched'],
			['Dorinthea', 103, 'matched'],
			['Katsu', 104, 'matched'],
			['Bravo', 105, 'matched'],
		]);
	});

	it('adds a NULL card for a hero with no card in a left join', () => {
		expect(table('left').at(-1)).toEqual(['Oldhim', null, 'left-only']);
		expect(table('left')).toHaveLength(6);
	});

	it('adds a NULL hero for a card with no hero in a right join', () => {
		expect(table('right')[0]).toEqual([null, 106, 'right-only']);
		expect(table('right')).toHaveLength(6);
	});

	it('keeps the unmatched rows of both sides in a full join', () => {
		expect(table('full')).toEqual([
			[null, 106, 'right-only'],
			['Dorinthea', 101, 'matched'],
			['Dorinthea', 102, 'matched'],
			['Dorinthea', 103, 'matched'],
			['Katsu', 104, 'matched'],
			['Bravo', 105, 'matched'],
			['Oldhim', null, 'left-only'],
		]);
	});

	it('pairs every hero with every card in a cross join', () => {
		const rows = table('cross');
		expect(rows).toHaveLength(24);
		expect(rows.filter((row) => row[2] === 'matched')).toHaveLength(5);
	});
});

describe('joinSql', () => {
	it('writes the join keyword and the ON condition', () => {
		expect(joinSql('full')).toContain('FULL JOIN cards c ON c.hero_id = h.id');
		expect(joinSql('cross')).toContain('CROSS JOIN cards c\n');
	});
});
