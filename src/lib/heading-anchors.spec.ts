import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { headingAnchors } from './heading-anchors';

async function render(markdown: string): Promise<string> {
	const { html } = await markdownToHtml(markdown, { hastPlugins: [headingAnchors()] });
	return html;
}

describe('headingAnchors', () => {
	it('gives each h2 to h4 an id and a link to it', async () => {
		const html = await render('## Mesh networks\n\n### Hole punching\n\n#### Relays');
		expect(html).toContain('<h2 id="mesh-networks">Mesh networks<a class="heading-anchor" href="#mesh-networks"');
		expect(html).toContain('id="hole-punching"');
		expect(html).toContain('href="#relays"');
	});

	it('leaves other heading levels alone', async () => {
		const html = await render('# Title\n\n##### Deep');
		expect(html).not.toContain('heading-anchor');
	});

	it('numbers a repeated heading so its id stays unique', async () => {
		const html = await render('## Setup\n\n## Setup');
		expect(html).toContain('id="setup"');
		expect(html).toContain('id="setup-2"');
	});
});
