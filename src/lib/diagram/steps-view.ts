import type { DiagramEdge, DiagramNode } from '../../kandan/components/diagram';
import type { Emphasis } from '../../kandan/components/emphasis';
import type { SequenceParticipant, SequenceStep } from '../../kandan/components/sequence';
import type { DiagramParts } from './steps-parse';

type StepsView =
	| {
			readonly kind: 'sequence';
			readonly label: string;
			readonly participants: readonly SequenceParticipant[];
			readonly steps: readonly SequenceStep[];
			readonly captions: readonly string[];
			readonly active: readonly (readonly number[])[];
	  }
	| {
			readonly kind: 'diagram';
			readonly label: string;
			readonly width: number;
			readonly height: number;
			readonly nodes: readonly DiagramNode[];
			readonly edges: readonly DiagramEdge[];
			readonly captions: readonly string[];
			readonly active: readonly DiagramParts[];
	  };

function emphasisOf(active: readonly number[] | undefined, part: number): Emphasis {
	return active?.includes(part) === true ? 'active' : 'dimmed';
}

function sequenceStepsAt(
	steps: readonly SequenceStep[],
	active: readonly (readonly number[])[],
	step: number,
): SequenceStep[] {
	return steps.map((part, index) => ({ ...part, emphasis: emphasisOf(active[step], index) }));
}

function diagramPartsAt(
	nodes: readonly DiagramNode[],
	edges: readonly DiagramEdge[],
	active: readonly DiagramParts[],
	step: number,
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
	let boxIndex = 0;
	return {
		nodes: nodes.map((node) => {
			if (node.kind === 'group') return node;
			const emphasis = emphasisOf(active[step]?.boxes, boxIndex);
			boxIndex += 1;
			return { ...node, emphasis };
		}),
		edges: edges.map((edge, index) => ({ ...edge, emphasis: emphasisOf(active[step]?.edges, index) })),
	};
}

export { diagramPartsAt, sequenceStepsAt };
export type { StepsView };
