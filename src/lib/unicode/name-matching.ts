import { foldForSearch } from './search-fold';
import { collatorComparisons, plainComparisons } from './text-inspection';
import type { Comparison } from './text-inspection';

const INNER_SPACE = /\s+/gu;

function tagName(raw: string): string {
	return raw.trim().normalize('NFC').replaceAll(INNER_SPACE, ' ');
}

function sameTagName(left: string, right: string): boolean {
	return foldForSearch(tagName(left)).text === foldForSearch(tagName(right)).text;
}

function comparisonRows(left: string, right: string): readonly Comparison[] {
	return [
		...plainComparisons(left, right),
		...collatorComparisons(left, right),
		{ label: 'sameTagName(left, right)', equal: sameTagName(left, right) },
	];
}

export { comparisonRows, sameTagName, tagName };
