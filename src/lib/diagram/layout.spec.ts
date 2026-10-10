import { describe, expect, it } from 'vitest';
import type { DiagramBox, DiagramGroup } from '../../kandan/components/diagram';
import { layoutDiagram } from './layout';
import { parseDiagram } from './parse';
import type { DiagramSource } from './parse';

function sourceOf(text: string): DiagramSource {
	const result = parseDiagram(text);
	if (result.kind === 'failure') throw new Error(JSON.stringify(result.errors));
	return result.source;
}

const EXAMPLE = `title "Peers"
group home "Home LAN" {
  laptop "Laptop" detail "100.64.0.2"
  router "Router"
}
group office "Office" {
  server "Server"
}
relay "DERP relay"
laptop -> router
router -> relay "fallback"
laptop <-> server "WireGuard"`;

function boxNamed(nodes: readonly { kind: string; label: string }[], label: string): DiagramBox {
	const found = nodes.find((node): node is DiagramBox => node.kind === 'box' && node.label === label);
	if (found === undefined) throw new Error(label);
	return found;
}

function groupNamed(nodes: readonly { kind: string; label: string }[], label: string): DiagramGroup {
	const found = nodes.find((node): node is DiagramGroup => node.kind === 'group' && node.label === label);
	if (found === undefined) throw new Error(label);
	return found;
}

function inside(box: DiagramBox, group: DiagramGroup): boolean {
	return (
		box.x >= group.x &&
		box.y >= group.y &&
		box.x + box.width <= group.x + group.width &&
		box.y + box.height <= group.y + group.height
	);
}

describe('layoutDiagram', () => {
	it('draws each group around its own nodes, below its label', async () => {
		const { nodes } = await layoutDiagram(sourceOf(EXAMPLE));
		const home = groupNamed(nodes, 'Home LAN');
		const office = groupNamed(nodes, 'Office');
		expect(inside(boxNamed(nodes, 'Laptop'), home)).toBe(true);
		expect(inside(boxNamed(nodes, 'Router'), home)).toBe(true);
		expect(inside(boxNamed(nodes, 'Server'), office)).toBe(true);
		expect(inside(boxNamed(nodes, 'Server'), home)).toBe(false);
		expect(inside(boxNamed(nodes, 'DERP relay'), home)).toBe(false);
		expect(boxNamed(nodes, 'Laptop').y).toBeGreaterThan(home.y + 16);
	});

	it('joins the boxes an edge names, and draws a two-way edge as one edge with a head at each end', async () => {
		const { nodes, edges } = await layoutDiagram(sourceOf(EXAMPLE));
		expect(edges).toHaveLength(3);
		expect(edges[0]).toMatchObject({ from: boxNamed(nodes, 'Laptop'), to: boxNamed(nodes, 'Router'), heads: 'end' });
		expect(edges[2]).toMatchObject({
			from: boxNamed(nodes, 'Laptop'),
			to: boxNamed(nodes, 'Server'),
			label: 'WireGuard',
			heads: 'both',
		});
	});

	it('routes each edge from one box to the other along right angles and backs its label', async () => {
		const { nodes, edges } = await layoutDiagram(sourceOf(`${EXAMPLE}\nrelay -- server`));
		const [first] = edges;
		const points = first.points ?? [];
		const laptop = boxNamed(nodes, 'Laptop');
		expect(points[0].x).toBe(laptop.x + laptop.width);
		expect(points.at(-1)?.x).toBe(boxNamed(nodes, 'Router').x);
		for (const edge of edges) {
			const route = edge.points ?? [];
			expect(route.length).toBeGreaterThanOrEqual(2);
			route.slice(1).forEach((point, index) => {
				const before = route[index];
				expect(point.x === before.x || point.y === before.y).toBe(true);
			});
		}
		expect(edges[1]).toMatchObject({ labelBacked: true, labelAt: expect.objectContaining({ x: expect.any(Number) }) });
		expect(edges[3]).toMatchObject({ heads: 'none', from: boxNamed(nodes, 'DERP relay') });
		expect(first.labelBacked).toBeUndefined();
	});

	it('gives a group its tone', async () => {
		const { nodes } = await layoutDiagram(sourceOf('title "t"\ngroup g "G" tone success {\na "A"\n}'));
		expect(groupNamed(nodes, 'G').tone).toBe('success');
	});

	it('lays layers along the x axis going right and the y axis going down', async () => {
		const chain = 'title "t"\na "A"\nb "B"\na -> b';
		const right = await layoutDiagram(sourceOf(chain));
		const down = await layoutDiagram(sourceOf(`direction down\n${chain}`));
		expect(boxNamed(right.nodes, 'B').x).toBeGreaterThan(boxNamed(right.nodes, 'A').x);
		expect(boxNamed(right.nodes, 'B').y).toBe(boxNamed(right.nodes, 'A').y);
		expect(boxNamed(down.nodes, 'B').y).toBeGreaterThan(boxNamed(down.nodes, 'A').y);
		expect(boxNamed(down.nodes, 'B').x).toBe(boxNamed(down.nodes, 'A').x);
	});

	it('returns the same layout for the same source', async () => {
		const source = sourceOf(EXAMPLE);
		expect(await layoutDiagram(source)).toEqual(await layoutDiagram(source));
	});
});
