import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { blockWrappers } from './block-wrappers';

async function render(markdown: string): Promise<string> {
	const { html } = await markdownToHtml(markdown, { hastPlugins: [blockWrappers()] });
	return html;
}

describe('blockWrappers', () => {
	it('puts a copy button beside each code block inside a frame', async () => {
		const html = await render('```\nip a\n```');
		expect(html).toMatch(/<div class="codeblock-frame"><pre class="codeblock">.*<\/pre><button[^>]*data-copy-code/su);
	});

	it('wraps a Markdown table in the Kandan table wrapper', async () => {
		const html = await render('| a | b |\n| - | - |\n| 1 | 2 |');
		expect(html).toMatch(/<div class="table-wrapper"><table class="table">/u);
	});
});
