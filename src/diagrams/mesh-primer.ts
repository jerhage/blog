import type { DiagramBox, DiagramEdge, DiagramGroup } from '../kandan/components/diagram';

const BOX_WIDTH = 120;
const BOX_HEIGHT = 48;

function device(label: string, x: number, y: number): DiagramBox {
  return { kind: 'box', label, x, y, width: BOX_WIDTH, height: BOX_HEIGHT, tone: 'primary' };
}

const coordinator: DiagramBox = {
  kind: 'box',
  label: 'Coordination server',
  detail: 'introduces devices',
  x: 160,
  y: 0,
  width: 200,
  height: 56,
  tone: 'accent',
};

const devices: DiagramGroup = {
  kind: 'group',
  label: 'Devices',
  x: 0,
  y: 96,
  width: 520,
  height: 244,
};

const laptop = device('Laptop', 40, 140);
const phone = device('Phone', 360, 140);
const server = device('Server', 200, 268);

const MESH_PRIMER = {
  label:
    'A mesh VPN. A coordination server introduces the devices. The laptop, the phone and the server each connect directly to the other two.',
  width: 520,
  height: 340,
  nodes: [coordinator, devices, laptop, phone, server],
  edges: [
    { from: laptop, to: phone, heads: 'both' },
    { from: laptop, to: server, heads: 'both' },
    { from: phone, to: server, heads: 'both' },
  ] satisfies readonly DiagramEdge[],
};

export { MESH_PRIMER };
