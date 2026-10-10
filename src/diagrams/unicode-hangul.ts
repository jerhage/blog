import type { DiagramEdge } from '../kandan/components/diagram';
import { BOX_HEIGHT, unicodeBox } from './unicode-box';

const PART_WIDTH = 110;
const PART_GAP = 15;
const MIDDLE = PART_WIDTH + PART_GAP;
const LAST = MIDDLE * 2;
const ROW_STEP = 90;

const syllable = unicodeBox(60, 0, 240, '한', 'U+D55C, one code point', 'accent');
const initial = unicodeBox(0, ROW_STEP, PART_WIDTH, 'ㅎ', 'initial, index 18', 'primary');
const medial = unicodeBox(MIDDLE, ROW_STEP, PART_WIDTH, 'ㅏ', 'medial, index 0', 'primary');
const final = unicodeBox(LAST, ROW_STEP, PART_WIDTH, 'ㄴ', 'final, index 4', 'primary');
const initialPoint = unicodeBox(0, ROW_STEP * 2, PART_WIDTH, 'U+1112', '0x1100 + 18');
const medialPoint = unicodeBox(MIDDLE, ROW_STEP * 2, PART_WIDTH, 'U+1161', '0x1161 + 0');
const finalPoint = unicodeBox(LAST, ROW_STEP * 2, PART_WIDTH, 'U+11AB', '0x11A7 + 4');

const HANGUL_SYLLABLE = {
  label:
    'The syllable 한, U+D55C, splits into three jamo. The initial ㅎ is index 18 of 19, the medial ㅏ is index 0 of 21, and the final ㄴ is index 4 of 28. Each jamo is also a conjoining code point: U+1112 is 0x1100 plus 18, U+1161 is 0x1161 plus 0, and U+11AB is 0x11A7 plus 4. Those three code points are the decomposed form of 한.',
  width: LAST + PART_WIDTH,
  height: ROW_STEP * 2 + BOX_HEIGHT,
  nodes: [syllable, initial, medial, final, initialPoint, medialPoint, finalPoint],
  edges: [
    { from: syllable, to: initial },
    { from: syllable, to: medial },
    { from: syllable, to: final },
    { from: initial, to: initialPoint },
    { from: medial, to: medialPoint },
    { from: final, to: finalPoint },
  ] satisfies readonly DiagramEdge[],
};

export { HANGUL_SYLLABLE };
