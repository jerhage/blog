import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api';
import type {
	DiagramBox,
	DiagramEdge,
	DiagramGroup,
	DiagramNode,
} from '../../kandan/components/diagram';
import {
	CANVAS_MARGIN,
	GROUP_LABEL_BAND,
	GROUP_PADDING,
	LAYER_GAP,
	NODE_GAP,
	boxSize,
	edgeLabelSize,
	groupLabelWidth,
} from './metrics';
import type { DiagramSource, SourceBox, SourceGroup } from './parse';

type DiagramLayout = {
	readonly label: string;
	readonly width: number;
	readonly height: number;
	readonly nodes: readonly DiagramNode[];
	readonly edges: readonly DiagramEdge[];
};

const ELK_DIRECTIONS = { right: 'RIGHT', down: 'DOWN' } as const;

const elk = new ELK();

function elkBox(box: SourceBox): ElkNode {
	return { id: box.id, ...boxSize(box.label, box.detail) };
}

function elkGroup(group: SourceGroup): ElkNode {
	const minimumWidth = groupLabelWidth(group.label) + 2 * GROUP_PADDING;
	return {
		id: group.id,
		children: group.boxes.map(elkBox),
		layoutOptions: {
			'elk.padding': `[top=${GROUP_LABEL_BAND},left=${GROUP_PADDING},bottom=${GROUP_PADDING},right=${GROUP_PADDING}]`,
			'elk.nodeSize.constraints': 'MINIMUM_SIZE',
			'elk.nodeSize.minimum': `(${minimumWidth},0)`,
		},
	};
}

function elkEdges(source: DiagramSource): ElkExtendedEdge[] {
	return source.edges.map((edge, index) => ({
		id: `edge-${index}`,
		sources: [edge.from],
		targets: [edge.to],
		labels:
			edge.label === undefined ? [] : [{ text: edge.label, ...edgeLabelSize(edge.label) }],
	}));
}

function elkGraph(source: DiagramSource): ElkNode {
	return {
		id: 'diagram',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': ELK_DIRECTIONS[source.direction],
			'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
			'elk.padding': `[top=${CANVAS_MARGIN},left=${CANVAS_MARGIN},bottom=${CANVAS_MARGIN},right=${CANVAS_MARGIN}]`,
			'elk.spacing.nodeNode': String(NODE_GAP),
			'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYER_GAP),
			'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
			'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
		},
		children: source.members.map((member) =>
			member.kind === 'group' ? elkGroup(member) : elkBox(member),
		),
		edges: elkEdges(source),
	};
}

function placed(node: ElkNode, offsetX: number, offsetY: number) {
	return {
		x: Math.round(offsetX + (node.x ?? 0)),
		y: Math.round(offsetY + (node.y ?? 0)),
		width: Math.round(node.width ?? 0),
		height: Math.round(node.height ?? 0),
	};
}

function collectNodes(
	source: DiagramSource,
	laidOut: ElkNode,
): { nodes: DiagramNode[]; boxes: Map<string, DiagramBox> } {
	const nodes: DiagramNode[] = [];
	const boxes = new Map<string, DiagramBox>();
	const elkById = new Map((laidOut.children ?? []).map((child) => [child.id, child]));

	const addBox = (box: SourceBox, elkNode: ElkNode | undefined, offsetX: number, offsetY: number) => {
		if (elkNode === undefined) return;
		const drawn: DiagramBox = {
			kind: 'box',
			...placed(elkNode, offsetX, offsetY),
			label: box.label,
			detail: box.detail,
			tone: box.tone,
		};
		boxes.set(box.id, drawn);
		nodes.push(drawn);
	};

	for (const member of source.members) {
		const elkNode = elkById.get(member.id);
		if (member.kind === 'box') {
			addBox(member, elkNode, 0, 0);
			continue;
		}
		if (elkNode === undefined) continue;
		const group: DiagramGroup = {
			kind: 'group',
			...placed(elkNode, 0, 0),
			label: member.label,
		};
		nodes.push(group);
		const inner = new Map((elkNode.children ?? []).map((child) => [child.id, child]));
		for (const box of member.boxes) addBox(box, inner.get(box.id), group.x, group.y);
	}
	return { nodes, boxes };
}

function collectEdges(source: DiagramSource, boxes: ReadonlyMap<string, DiagramBox>): DiagramEdge[] {
	const edges: DiagramEdge[] = [];
	for (const edge of source.edges) {
		const from = boxes.get(edge.from);
		const to = boxes.get(edge.to);
		if (from === undefined || to === undefined) continue;
		edges.push({ from, to, label: edge.label });
		if (edge.arrows === 'both') edges.push({ from: to, to: from });
	}
	return edges;
}

async function layoutDiagram(source: DiagramSource): Promise<DiagramLayout> {
	const laidOut = await elk.layout(elkGraph(source));
	const { nodes, boxes } = collectNodes(source, laidOut);
	return {
		label: source.title,
		width: Math.ceil(laidOut.width ?? 0),
		height: Math.ceil(laidOut.height ?? 0),
		nodes,
		edges: collectEdges(source, boxes),
	};
}

export { layoutDiagram };
export type { DiagramLayout };
