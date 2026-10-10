type BodyFont = {
	readonly name: string;
	readonly face: string;
	readonly stack: string;
	readonly proseCh: number;
};

const BODY_FONTS: readonly BodyFont[] = [
	{ name: 'system-ui', face: 'system-ui', stack: "system-ui, -apple-system, 'Segoe UI', sans-serif", proseCh: 68 },
	{ name: 'DM Sans', face: "'DM Sans'", stack: "'DM Sans', system-ui, sans-serif", proseCh: 68 },
	{ name: 'Geist', face: "'Geist'", stack: "'Geist', system-ui, sans-serif", proseCh: 68 },
	{ name: 'Figtree', face: "'Figtree'", stack: "'Figtree', system-ui, sans-serif", proseCh: 68 },
	{
		name: 'M PLUS Rounded 1c',
		face: "'M PLUS Rounded 1c'",
		stack: "'M PLUS Rounded 1c', system-ui, sans-serif",
		proseCh: 68,
	},
	{ name: 'Archivo', face: "'Archivo'", stack: "'Archivo', system-ui, sans-serif", proseCh: 68 },
	{ name: 'Literata', face: "'Literata'", stack: "'Literata', Georgia, serif", proseCh: 68 },
	{
		name: 'Zen Kaku Gothic New',
		face: "'Zen Kaku Gothic New'",
		stack: "'Zen Kaku Gothic New', 'Noto Sans JP', system-ui, sans-serif",
		proseCh: 85,
	},
];

const SENTENCE =
	'The quick brown fox jumps over the lazy dog, then trots along the river bank until the evening bell rings across the quiet valley and the lamps come on one by one.';

const PROSE_REM = 43;

function fontsNamed(names: readonly string[]): readonly BodyFont[] {
	return BODY_FONTS.filter((font) => names.includes(font.name));
}

export { BODY_FONTS, PROSE_REM, SENTENCE, fontsNamed };
export type { BodyFont };
