import type { DiagramEdge } from '../kandan/components/diagram';
import { BOX_HEIGHT, unicodeBox } from './unicode-box';

const FORM_WIDTH = 150;
const RIGHT = 360 - FORM_WIDTH;
const TOP = 24;
const LOWER = 130;

const nfc = unicodeBox(0, TOP, FORM_WIDTH, 'NFC', 'ｶﾞ stays ｶﾞ; が stays が', 'primary');
const nfd = unicodeBox(RIGHT, TOP, FORM_WIDTH, 'NFD', 'が becomes か + U+3099', 'primary');
const nfkc = unicodeBox(0, LOWER, FORM_WIDTH, 'NFKC', 'ｶﾞ becomes ガ', 'accent');
const nfkd = unicodeBox(RIGHT, LOWER, FORM_WIDTH, 'NFKD', 'ｶﾞ becomes カ + U+3099', 'accent');

const NORMALIZATION_SQUARE = {
  label:
    'Four boxes in a square. The top row is canonical: NFC, composed, and NFD, decomposed. The bottom row is compatibility: NFKC, composed, and NFKD, decomposed. Composing turns the right-hand column into the left. Compatibility mapping turns the top row into the bottom row. Half-width ｶﾞ is unchanged by NFC and NFD and becomes full-width ガ under NFKC.',
  width: 360,
  height: LOWER + BOX_HEIGHT,
  nodes: [nfc, nfd, nfkc, nfkd],
  edges: [
    { from: nfd, to: nfc, label: 'compose' },
    { from: nfkd, to: nfkc, label: 'compose' },
    { from: nfc, to: nfkc, label: 'compatibility' },
    { from: nfd, to: nfkd, label: 'compatibility' },
  ] satisfies readonly DiagramEdge[],
};

export { NORMALIZATION_SQUARE };
