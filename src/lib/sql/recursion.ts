import type { CardType } from './sample-data';

type TreeRow = {
	readonly id: number;
	readonly name: string;
	readonly depth: number;
	readonly path: string;
};

type RecursionStep = {
	readonly working: readonly TreeRow[];
	readonly result: readonly TreeRow[];
};

function anchorRows(types: readonly CardType[], rootId: number): readonly TreeRow[] {
	return types
		.filter((type) => type.id === rootId)
		.map((type) => ({ id: type.id, name: type.name, depth: 0, path: type.name }));
}

function nextRows(types: readonly CardType[], working: readonly TreeRow[]): readonly TreeRow[] {
	return working.flatMap((parent) =>
		types
			.filter((type) => type.parentId === parent.id)
			.map((type) => ({
				id: type.id,
				name: type.name,
				depth: parent.depth + 1,
				path: `${parent.path} > ${type.name}`,
			})),
	);
}

function recursionSteps(types: readonly CardType[], rootId: number): readonly RecursionStep[] {
	const steps: RecursionStep[] = [];
	let working = anchorRows(types, rootId);
	let result: readonly TreeRow[] = [];
	while (true) {
		result = [...result, ...working];
		steps.push({ working, result });
		if (working.length === 0) return steps;
		working = nextRows(types, working);
	}
}

function recursionCaption(index: number, step: RecursionStep): string {
	if (index === 0) return 'The anchor runs once and returns the starting row.';
	if (step.working.length === 0) {
		return 'The working table is empty, so the recursion ends.';
	}
	return `Run ${index}: the recursive part joins the previous working table to card_types and finds depth ${index}.`;
}

export { recursionCaption, recursionSteps };
export type { RecursionStep, TreeRow };
