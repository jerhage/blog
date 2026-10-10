import { describe, expect, it } from 'vitest';
import { authorHeroIds, winnerHeroIds } from './sample-data';
import { originLabel, setOperation, setOperationSql } from './set-operations';
import type { SetOperator } from './set-operations';

function values(operator: SetOperator): readonly number[] {
	return setOperation(operator, authorHeroIds(), winnerHeroIds()).map((row) => row.value);
}

describe('setOperation', () => {
	it('reproduces the result tables of the post for every operator', () => {
		expect(values('union')).toEqual([1, 2, 3]);
		expect(values('union-all')).toEqual([1, 1, 1, 1, 2, 3, 3]);
		expect(values('intersect')).toEqual([1]);
		expect(values('except')).toEqual([2]);
		expect(values('except-reversed')).toEqual([3]);
	});

	it('marks each distinct value with the lists that hold it', () => {
		const rows = setOperation('union', authorHeroIds(), winnerHeroIds());
		expect(rows.map((row) => row.origin)).toEqual(['both', 'a', 'b']);
	});

	it('marks each repeated row with the list it came from', () => {
		const rows = setOperation('union-all', authorHeroIds(), winnerHeroIds());
		expect(rows.map((row) => originLabel('union-all', row.origin))).toEqual([
			'from A',
			'from A',
			'from B',
			'from B',
			'from A',
			'from B',
			'from B',
		]);
	});
});

describe('setOperationSql', () => {
	it('writes the second query first when the sides are swapped', () => {
		expect(setOperationSql('except-reversed')).toBe(
			"SELECT hero_id FROM matches WHERE result = 'won'\nEXCEPT\nSELECT hero_id FROM cards WHERE format = 'cc'\nORDER BY hero_id;",
		);
	});
});
