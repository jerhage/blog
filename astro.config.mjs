// @ts-check

import { readFileSync, readdirSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { blockWrappers } from './src/lib/block-wrappers.ts';
import { diagramBuildGuard } from './src/lib/diagram/build-guard.ts';
import { diagramBlocks } from './src/lib/diagram/diagram-blocks.ts';
import { headingAnchors } from './src/lib/heading-anchors.ts';

const FONT_FOLDER = 'src/kandan/core/fonts';

const FONT_LICENSE = /\.OFL\.txt$/u;

function fontLicensesPublished() {
	return {
		name: 'font-licenses-published',
		apply: 'build',
		applyToEnvironment: (/** @type {{ config: { consumer: string } }} */ environment) =>
			environment.config.consumer === 'client',
		generateBundle() {
			for (const name of readdirSync(FONT_FOLDER)) {
				if (!FONT_LICENSE.test(name)) continue;
				this.emitFile({
					type: 'asset',
					fileName: `fonts/${name}`,
					source: readFileSync(`${FONT_FOLDER}/${name}`),
				});
			}
		},
	};
}

export default defineConfig({
	site: 'https://example.com',
	markdown: {
		processor: satteri({ mdastPlugins: [diagramBlocks()], hastPlugins: [headingAnchors(), blockWrappers()] }),
		shikiConfig: { theme: 'css-variables' },
	},
	integrations: [mdx(), sitemap(), svelte(), diagramBuildGuard()],
	vite: { plugins: [fontLicensesPublished()], optimizeDeps: { include: ['ts-pattern'] } },
});
