import { layoutDiagram } from './layout';
import type { StepsSource } from './steps-parse';
import type { StepsView } from './steps-view';

async function layoutSteps(steps: StepsSource): Promise<StepsView> {
	if (steps.kind === 'sequence') {
		const { title, participants, steps: parts } = steps.source;
		return {
			kind: 'sequence',
			label: title,
			participants,
			steps: parts,
			captions: steps.captions,
			active: steps.active,
		};
	}
	const layout = await layoutDiagram(steps.source);
	return {
		kind: 'diagram',
		label: layout.label,
		width: layout.width,
		height: layout.height,
		nodes: layout.nodes,
		edges: layout.edges,
		captions: steps.captions,
		active: steps.active,
	};
}

export { layoutSteps };
