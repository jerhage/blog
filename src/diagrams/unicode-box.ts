import type { DiagramBox, DiagramTone } from '../kandan/components/diagram';

const BOX_HEIGHT = 44;

function unicodeBox(
  x: number,
  y: number,
  width: number,
  label: string,
  detail: string,
  tone?: DiagramTone,
): DiagramBox {
  return {
    kind: 'box',
    x,
    y,
    width,
    height: BOX_HEIGHT,
    label,
    detail,
    ...(tone === undefined ? {} : { tone }),
  };
}

export { BOX_HEIGHT, unicodeBox };
