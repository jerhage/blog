import type { DiagramEdge } from '../kandan/components/diagram';
import { BOX_HEIGHT, unicodeBox } from './unicode-box';

const UNIT_WIDTH = 84;
const UNIT_GAP = 8;
const POINT_WIDTH = UNIT_WIDTH * 2 + UNIT_GAP;
const POINT_GAP = 8;
const SECOND = POINT_WIDTH + POINT_GAP;

const grapheme = unicodeBox(60, 0, 240, 'が', 'one grapheme on screen', 'accent');
const baseKana = unicodeBox(0, 90, POINT_WIDTH, 'U+304B', 'か, a code point', 'primary');
const voicedMark = unicodeBox(SECOND, 90, POINT_WIDTH, 'U+3099', 'combining voiced mark', 'primary');
const baseUtf16 = unicodeBox(0, 180, UNIT_WIDTH, '304B', 'UTF-16: 1 unit');
const baseUtf8 = unicodeBox(UNIT_WIDTH + UNIT_GAP, 180, UNIT_WIDTH, 'E3 81 8B', 'UTF-8: 3 bytes');
const markUtf16 = unicodeBox(SECOND, 180, UNIT_WIDTH, '3099', 'UTF-16: 1 unit');
const markUtf8 = unicodeBox(
  SECOND + UNIT_WIDTH + UNIT_GAP,
  180,
  UNIT_WIDTH,
  'E3 82 99',
  'UTF-8: 3 bytes',
);

const ENCODING_LAYERS = {
  label:
    'The grapheme が, written decomposed, is two code points: U+304B, the kana か, and U+3099, the combining voiced mark. In UTF-16 each code point is one 16-bit unit, 304B and 3099. In UTF-8 each is three bytes, E3 81 8B and E3 82 99.',
  width: 360,
  height: 180 + BOX_HEIGHT,
  nodes: [grapheme, baseKana, voicedMark, baseUtf16, baseUtf8, markUtf16, markUtf8],
  edges: [
    { from: grapheme, to: baseKana },
    { from: grapheme, to: voicedMark },
    { from: baseKana, to: baseUtf16 },
    { from: baseKana, to: baseUtf8 },
    { from: voicedMark, to: markUtf16 },
    { from: voicedMark, to: markUtf8 },
  ] satisfies readonly DiagramEdge[],
};

export { ENCODING_LAYERS };
