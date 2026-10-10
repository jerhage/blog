import { match } from 'ts-pattern';

type SetOperator = 'union' | 'union-all' | 'intersect' | 'except' | 'except-reversed';

type SetOrigin = 'a' | 'b' | 'both';

type SetResultRow = { readonly value: number; readonly origin: SetOrigin };

const SET_OPERATORS: readonly SetOperator[] = [
	'union',
	'union-all',
	'intersect',
	'except',
	'except-reversed',
];

const FIRST_QUERY = "SELECT hero_id FROM cards WHERE format = 'cc'";

const SECOND_QUERY = "SELECT hero_id FROM matches WHERE result = 'won'";

function byValue(left: SetResultRow, right: SetResultRow): number {
	return left.value - right.value;
}

function distinctRows(a: readonly number[], b: readonly number[]): readonly SetResultRow[] {
	const inA = new Set(a);
	const inB = new Set(b);
	return [...new Set([...a, ...b])].map((value): SetResultRow => {
		const origin = inA.has(value) && inB.has(value) ? 'both' : inA.has(value) ? 'a' : 'b';
		return { value, origin };
	});
}

function setOperation(
	operator: SetOperator,
	a: readonly number[],
	b: readonly number[],
): readonly SetResultRow[] {
	return match(operator)
		.returnType<readonly SetResultRow[]>()
		.with('union-all', () =>
			[
				...a.map((value): SetResultRow => ({ value, origin: 'a' })),
				...b.map((value): SetResultRow => ({ value, origin: 'b' })),
			].toSorted(byValue),
		)
		.with('union', () => distinctRows(a, b).toSorted(byValue))
		.with('intersect', () =>
			distinctRows(a, b)
				.filter((row) => row.origin === 'both')
				.toSorted(byValue),
		)
		.with('except', () =>
			distinctRows(a, b)
				.filter((row) => row.origin === 'a')
				.toSorted(byValue),
		)
		.with('except-reversed', () =>
			distinctRows(a, b)
				.filter((row) => row.origin === 'b')
				.toSorted(byValue),
		)
		.exhaustive();
}

function keyword(operator: SetOperator): string {
	return match(operator)
		.with('union', () => 'UNION')
		.with('union-all', () => 'UNION ALL')
		.with('intersect', () => 'INTERSECT')
		.with('except', 'except-reversed', () => 'EXCEPT')
		.exhaustive();
}

function setOperationSql(operator: SetOperator): string {
	const [first, second] =
		operator === 'except-reversed' ? [SECOND_QUERY, FIRST_QUERY] : [FIRST_QUERY, SECOND_QUERY];
	return `${first}\n${keyword(operator)}\n${second}\nORDER BY hero_id;`;
}

function setOperatorLabel(operator: SetOperator): string {
	return match(operator)
		.with('union', () => 'A UNION B')
		.with('union-all', () => 'A UNION ALL B')
		.with('intersect', () => 'A INTERSECT B')
		.with('except', () => 'A EXCEPT B')
		.with('except-reversed', () => 'B EXCEPT A')
		.exhaustive();
}

function originLabel(operator: SetOperator, origin: SetOrigin): string {
	return match({ operator, origin })
		.with({ operator: 'union-all', origin: 'a' }, () => 'from A')
		.with({ operator: 'union-all', origin: 'b' }, () => 'from B')
		.with({ origin: 'a' }, () => 'A only')
		.with({ origin: 'b' }, () => 'B only')
		.with({ origin: 'both' }, () => 'A and B')
		.exhaustive();
}

export {
	SET_OPERATORS,
	originLabel,
	setOperation,
	setOperationSql,
	setOperatorLabel,
};
export type { SetOperator, SetOrigin, SetResultRow };
