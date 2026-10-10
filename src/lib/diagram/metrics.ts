import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TYPE_SCALE_FILE = join(process.cwd(), 'src/kandan/core/styles/base/primitives.css');

const ROOT_FONT_PX = 16;

const GLYPH_WIDTH_EM = 0.6;

const EYEBROW_GLYPH_WIDTH_EM = 0.7;

const EYEBROW_TRACKING_EM = 0.08;

const GROUP_LABEL_INSET_EM = 0.75;

const GROUP_LABEL_BAND_EM = 3;

const BOX_MIN_WIDTH = 120;

const BOX_HEIGHT = 48;

const BOX_PADDING_X = 16;

const GROUP_PADDING = 20;

const CANVAS_MARGIN = 10;

const NODE_GAP = 24;

const LAYER_GAP = 48;

function fontSizePx(typeScale: string, name: string): number {
	const found = new RegExp(`--ds-fz-${name}:\\s*([0-9.]+)rem`, 'u').exec(typeScale);
	if (found === null) throw new Error(`Kandan's type scale has no --ds-fz-${name}`);
	return Number(found[1]) * ROOT_FONT_PX;
}

const typeScale = readFileSync(TYPE_SCALE_FILE, 'utf8');

const LABEL_FONT_PX = fontSizePx(typeScale, 'sm');

const SMALL_FONT_PX = fontSizePx(typeScale, 'xs');

const GROUP_LABEL_BAND = Math.ceil(SMALL_FONT_PX * GROUP_LABEL_BAND_EM);

function textWidth(text: string, fontPx: number): number {
	return text.length * fontPx * GLYPH_WIDTH_EM;
}

function boxSize(label: string, detail: string | undefined): { width: number; height: number } {
	const widest = Math.max(
		textWidth(label, LABEL_FONT_PX),
		detail === undefined ? 0 : textWidth(detail, SMALL_FONT_PX),
	);
	return { width: Math.max(BOX_MIN_WIDTH, Math.ceil(widest + 2 * BOX_PADDING_X)), height: BOX_HEIGHT };
}

function groupLabelWidth(label: string): number {
	const advance = EYEBROW_GLYPH_WIDTH_EM + EYEBROW_TRACKING_EM;
	return Math.ceil(label.length * SMALL_FONT_PX * advance + 2 * GROUP_LABEL_INSET_EM * SMALL_FONT_PX);
}

function edgeLabelSize(label: string): { width: number; height: number } {
	return { width: Math.ceil(textWidth(label, SMALL_FONT_PX)), height: Math.ceil(SMALL_FONT_PX * 1.5) };
}

export {
	CANVAS_MARGIN,
	GROUP_LABEL_BAND,
	GROUP_PADDING,
	LAYER_GAP,
	NODE_GAP,
	boxSize,
	edgeLabelSize,
	groupLabelWidth,
};
