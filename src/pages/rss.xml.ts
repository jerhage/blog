import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { listEntries } from '../lib/collections';
import { entryPath } from '../lib/kinds';

async function GET(context: APIContext) {
	const posts = await listEntries('posts');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site ?? '',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.published,
			link: entryPath('posts', post.id),
		})),
	});
}

export { GET };
