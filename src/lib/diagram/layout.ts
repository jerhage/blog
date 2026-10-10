import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkLabel, ElkNode } from 'elkjs/lib/elk-api';
import type {
	DiagramBox,
	DiagramEdge,
	DiagramGroup,
	DiagramHeads,
	DiagramNode,
	DiagramPoint,
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
import type { DiagramSource, EdgeArrows, SourceBox, SourceGroup } from './parse';

type DiagramLayout = {
	readonly label: string;
	readonly width: number;
	readonly height: number;
	readonly nodes: readonly DiagramNode[];
	readonly edges: readonly DiagramEdge[];
};

const EDGE_HEADS: Readonly<Record<EdgeArrows, DiagramHeads>> = {
	forward: 'end',
	both: 'both',
	none: 'none',
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
			'elk.edgeRouting': 'ORTHOGONAL',
			'elk.json.edgeCoords': 'ROOT',
			'elk.json.shapeCoords': 'PARENT',
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
	const groups: DiagramGroup[] = [];
	const boxNodes: DiagramBox[] = [];
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
		boxNodes.push(drawn);
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
			tone: member.tone,
		};
		groups.push(group);
		const inner = new Map((elkNode.children ?? []).map((child) => [child.id, child]));
		for (const box of member.boxes) addBox(box, inner.get(box.id), group.x, group.y);
	}
	return { nodes: [...groups, ...boxNodes], boxes };
}

function routeOf(edge: ElkExtendedEdge | undefined): DiagramPoint[] {
	return (edge?.sections ?? []).flatMap((section) => [
		section.startPoint,
		...(section.bendPoints ?? []),
		section.endPoint,
	]);
}

function labelCentre(label: ElkLabel | undefined): DiagramPoint | undefined {
	if (label?.x === undefined || label.y === undefined) return undefined;
	return { x: label.x + (label.width ?? 0) / 2, y: label.y + (label.height ?? 0) / 2 };
}

function roundedPoint(point: DiagramPoint): DiagramPoint {
	return { x: Math.round(point.x), y: Math.round(point.y) };
}

function collectEdges(
	source: DiagramSource,
	boxes: ReadonlyMap<string, DiagramBox>,
	routed: readonly ElkExtendedEdge[],
): DiagramEdge[] {
	const edges: DiagramEdge[] = [];
	source.edges.forEach((edge, index) => {
		const from = boxes.get(edge.from);
		const to = boxes.get(edge.to);
		if (from === undefined || to === undefined) return;
		const found = routed.find((candidate) => candidate.id === `edge-${index}`);
		const points = routeOf(found).map(roundedPoint);
		const centre = labelCentre(found?.labels?.[0]);
		edges.push({
			from,
			to,
			label: edge.label,
			heads: EDGE_HEADS[edge.arrows],
			points: points.length >= 2 ? points : undefined,
			labelAt: centre === undefined ? undefined : roundedPoint(centre),
			labelBacked: edge.label === undefined ? undefined : true,
		});
	});
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
		edges: collectEdges(source, boxes, laidOut.edges ?? []),
	};
}

export { layoutDiagram };
export type { DiagramLayout };
