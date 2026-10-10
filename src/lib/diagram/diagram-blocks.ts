import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';
import { recordDiagramFailure } from './build-guard';
import { layoutDiagram } from './layout';
import { parseDiagram } from './parse';
import { parsePacket } from './packet-parse';
import { renderDiagram, renderPacket, renderSequence } from './render';
import { parseSequence } from './sequence-parse';
import type { SourceError } from './tokens';

type BlockOutcome =
	| { readonly kind: 'html'; readonly html: string }
	| { readonly kind: 'failure'; readonly errors: readonly SourceError[] };

type BlockRenderer = (text: string, idPrefix: string) => Promise<BlockOutcome>;

async function diagramHtml(text: string, idPrefix: string): Promise<BlockOutcome> {
	const parsed = parseDiagram(text);
	if (parsed.kind === 'failure') return parsed;
	const layout = await layoutDiagram(parsed.source);
	const html = await renderDiagram(layout, idPrefix);
	return { kind: 'html', html };
}

async function sequenceHtml(text: string, idPrefix: string): Promise<BlockOutcome> {
	const parsed = parseSequence(text);
	if (parsed.kind === 'failure') return parsed;
	const html = await renderSequence(parsed.source, idPrefix);
	return { kind: 'html', html };
}

async function packetHtml(text: string, idPrefix: string): Promise<BlockOutcome> {
	const parsed = parsePacket(text);
	if (parsed.kind === 'failure') return parsed;
	const html = await renderPacket(parsed.source, idPrefix);
	return { kind: 'html', html };
}

const BLOCK_RENDERERS: Readonly<Record<string, BlockRenderer | undefined>> = {
	diagram: diagramHtml,
	sequence: sequenceHtml,
	packet: packetHtml,
};

function bodyLineOffset(file: string | undefined, body: string): number {
	if (file === undefined || !existsSync(file)) return 0;
	const text = readFileSync(file, 'utf8');
	const start = text.indexOf(body);
	return start <= 0 ? 0 : text.slice(0, start).split('\n').length - 1;
}

function diagramBlocks() {
	return (factory: { readonly source: string; readonly fileURL: URL | undefined }) => {
		if (!Object.keys(BLOCK_RENDERERS).some((language) => factory.source.includes(language))) return null;
		const path = factory.fileURL === undefined ? undefined : fileURLToPath(factory.fileURL);
		const file = path ?? 'a block';
		const frontMatterLines = bodyLineOffset(path, factory.source);
		let rendered = 0;
		return defineMdastPlugin({
			name: 'diagram-blocks',
			options: { position: true },
			async code(node, ctx) {
				const renderer = node.lang === undefined || node.lang === null ? undefined : BLOCK_RENDERERS[node.lang];
				if (renderer === undefined) return;
				rendered += 1;
				const outcome = await renderer(node.value, `${node.lang}-${rendered}`);
				if (outcome.kind === 'failure') {
					const firstLine = frontMatterLines + (node.position?.start.line ?? 0);
					const message = outcome.errors
						.map((error) => `${file}:${firstLine + error.line}: ${node.lang}: ${error.message}`)
						.join('\n');
					recordDiagramFailure(message);
					throw new Error(message);
				}
				ctx.replaceNode(node, {
					raw: `<div class="${node.lang}-block">${outcome.html}</div>`,
					mdxExpressions: false,
				});
			},
		});
	};
}

export { diagramBlocks };
