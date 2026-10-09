import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';
import { recordDiagramFailure } from './build-guard';
import { layoutDiagram } from './layout';
import { parseDiagram } from './parse';
import { renderDiagram } from './render';

const DIAGRAM_LANGUAGE = 'diagram';

function bodyLineOffset(file: string | undefined, body: string): number {
	if (file === undefined || !existsSync(file)) return 0;
	const text = readFileSync(file, 'utf8');
	const start = text.indexOf(body);
	return start <= 0 ? 0 : text.slice(0, start).split('\n').length - 1;
}

function diagramBlocks() {
	return (factory: { readonly source: string; readonly fileURL: URL | undefined }) => {
		if (!factory.source.includes(DIAGRAM_LANGUAGE)) return null;
		const path = factory.fileURL === undefined ? undefined : fileURLToPath(factory.fileURL);
		const file = path ?? 'a diagram block';
		const frontMatterLines = bodyLineOffset(path, factory.source);
		let rendered = 0;
		return defineMdastPlugin({
			name: 'diagram-blocks',
			options: { position: true },
			async code(node, ctx) {
				if (node.lang !== DIAGRAM_LANGUAGE) return;
				const parsed = parseDiagram(node.value);
				if (parsed.kind === 'failure') {
					const firstLine = frontMatterLines + (node.position?.start.line ?? 0);
					const lines = parsed.errors.map(
						(error) => `${file}:${firstLine + error.line}: diagram: ${error.message}`,
					);
					const message = lines.join('\n');
					recordDiagramFailure(message);
					throw new Error(message);
				}
				const layout = await layoutDiagram(parsed.source);
				rendered += 1;
				const html = await renderDiagram(layout, `diagram-${rendered}`);
				ctx.replaceNode(node, {
					raw: `<div class="diagram-block">${html}</div>`,
					mdxExpressions: false,
				});
			},
		});
	};
}

export { diagramBlocks };
