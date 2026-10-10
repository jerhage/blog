const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function compareNatural(a: string, b: string): number {
	const byCollator = collator.compare(a, b);
	if (byCollator !== 0) return byCollator;
	if (a === b) return 0;
	return a < b ? -1 : 1;
}

function naturalOrder(names: readonly string[]): readonly string[] {
	return names.toSorted(compareNatural);
}

function codeUnitOrder(names: readonly string[]): readonly string[] {
	return names.toSorted();
}

export { codeUnitOrder, compareNatural, naturalOrder };
