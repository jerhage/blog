import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { markdownToHtml } from 'satteri';
import { afterAll, describe, expect, it } from 'vitest';
import { takeDiagramFailures } from './build-guard';
import { diagramBlocks } from './diagram-blocks';
import { closeDiagramRenderer } from './render';

afterAll(closeDiagramRenderer);

async function render(markdown: string): Promise<string> {
	const { html } = await markdownToHtml(markdown, { mdastPlugins: [diagramBlocks()] });
	return html;
}

describe('diagramBlocks', () => {
	it('replaces a diagram block with its titled SVG in a scroll region', async () => {
		const html = await render('before\n\n```diagram\ntitle "Two peers"\na "Alpha"\nb "Beta"\na -> b\n```\n\nafter');
		expect(html).toMatch(/<div class="diagram-block"><div class="diagram-scroll"[^>]*aria-label="Two peers"[^>]*><svg[^>]*class="diagram"/u);
		expect(html).toMatch(/<title id="diagram-1-[^"]*">Two peers<\/title>/u);
		expect(html).toContain('Alpha');
		expect(html).not.toContain('<pre');
		expect(html).toContain('<p>before</p>');
		expect(html).toContain('<p>after</p>');
	});

	it('leaves other code blocks untouched', async () => {
		const html = await render('```bash\nip a\n```');
		expect(html).toContain('<pre><code class="language-bash">ip a');
		expect(html).not.toContain('<svg');
	});

	it('fails the build and names the id it cannot find', async () => {
		await expect(render('text\n\n```diagram\ntitle "t"\na "A"\na -> z\n```')).rejects.toThrow(
			'diagram: The id "z" is not declared.',
		);
		expect(takeDiagramFailures()).toHaveLength(1);
	});

	it('counts the lines of front matter that Astro strips before the plugin runs', async () => {
		const body = 'text\n\n```diagram\ntitle "t"\na "A"\na -> z\n```\n';
		const path = join(mkdtempSync(join(tmpdir(), 'diagram-')), 'post.md');
		writeFileSync(path, `---\ntitle: x\n---\n\n${body}`);
		await expect(
			markdownToHtml(body, { fileURL: pathToFileURL(path), mdastPlugins: [diagramBlocks()] }),
		).rejects.toThrow(`${path}:10: diagram:`);
	});
});
