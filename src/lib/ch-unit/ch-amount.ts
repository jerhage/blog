type LengthUnit = 'px' | 'em' | 'rem' | 'ex' | 'cap' | 'ch' | 'ic' | 'lh';

type WidthSpread = {
	readonly narrowest: number;
	readonly widest: number;
	readonly ratio: number;
};

function formatLength(amount: number, unit: LengthUnit): string {
	return `${amount}${unit}`;
}

function clampAmount(amount: number, min: number, max: number): number {
	if (Number.isNaN(amount)) return min;
	return Math.min(max, Math.max(min, amount));
}

function widthSpread(widths: readonly number[]): WidthSpread | null {
	if (widths.length === 0) return null;
	const narrowest = Math.min(...widths);
	const widest = Math.max(...widths);
	return { narrowest, widest, ratio: widest / narrowest };
}

export { clampAmount, formatLength, widthSpread };
export type { LengthUnit, WidthSpread };
