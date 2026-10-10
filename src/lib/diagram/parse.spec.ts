import { describe, expect, it } from 'vitest';
import { parseDiagram } from './parse';

const EXAMPLE = `# a comment
title "Direct path between two peers"
direction down
group home "Home LAN" {
  laptop "Laptop" detail "100.64.0.2" tone primary
  router "Router" detail "NAT"
}
group office "Office" tone accent {
  server "Server" tone danger
}
relay "DERP relay"
laptop -> router
router -> relay "fallback"
laptop <-> server "WireGuard"
relay -- server
`;

function errorsOf(text: string) {
	const result = parseDiagram(text);
	return result.kind === 'failure' ? result.errors : [];
}

describe('parseDiagram', () => {
	it('reads a title, a direction, groups, nodes and edges', () => {
		expect(parseDiagram(EXAMPLE)).toEqual({
			kind: 'success',
			source: {
				title: 'Direct path between two peers',
				direction: 'down',
				members: [
					{
						kind: 'group',
						id: 'home',
						label: 'Home LAN',
						boxes: [
							{ kind: 'box', id: 'laptop', label: 'Laptop', detail: '100.64.0.2', tone: 'primary' },
							{ kind: 'box', id: 'router', label: 'Router', detail: 'NAT', tone: undefined },
						],
					},
					{
						kind: 'group',
						id: 'office',
						label: 'Office',
						tone: 'accent',
						boxes: [{ kind: 'box', id: 'server', label: 'Server', detail: undefined, tone: 'danger' }],
					},
					{ kind: 'box', id: 'relay', label: 'DERP relay', detail: undefined, tone: undefined },
				],
				edges: [
					{ from: 'laptop', to: 'router', arrows: 'forward' },
					{ from: 'router', to: 'relay', arrows: 'forward', label: 'fallback' },
					{ from: 'laptop', to: 'server', arrows: 'both', label: 'WireGuard' },
					{ from: 'relay', to: 'server', arrows: 'none' },
				],
			},
		});
	});

	it('defaults the direction to right', () => {
		const result = parseDiagram('title "t"\na "A"');
		expect(result.kind === 'success' && result.source.direction).toBe('right');
	});

	it('reports a missing title', () => {
		expect(errorsOf('a "A"')).toEqual([
			{ kind: 'missing-title', line: 1, message: expect.any(String) },
		]);
	});

	it('reports a line it cannot read', () => {
		expect(errorsOf('title "t"\na "A" colour red')).toEqual([
			{ kind: 'syntax', line: 2, message: expect.any(String) },
		]);
	});

	it('reports an id declared twice on the second line', () => {
		expect(errorsOf('title "t"\na "A"\na "B"')).toEqual([
			{ kind: 'duplicate-id', line: 3, message: expect.any(String) },
		]);
	});

	it('reports an edge to an id nobody declared', () => {
		expect(errorsOf('title "t"\na "A"\na -> b')).toEqual([
			{ kind: 'unknown-id', line: 3, message: expect.any(String) },
		]);
	});

	it('reports a tone that does not exist on a node and on a group', () => {
		expect(
			errorsOf('title "t"\na "A" tone pink\ngroup g "G" tone pink {').map((e) => [e.kind, e.line]),
		).toEqual([
			['unknown-tone', 2],
			['unknown-tone', 3],
		]);
	});

	it('reports a group inside a group', () => {
		expect(errorsOf('title "t"\ngroup g "G" {\ngroup h "H" {\n}\n}')).toEqual([
			{ kind: 'nested-group', line: 3, message: expect.any(String) },
			{ kind: 'syntax', line: 5, message: expect.any(String) },
		]);
	});
});
