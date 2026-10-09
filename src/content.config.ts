import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const TAG = /^[a-z0-9]+(-[a-z0-9]+)*$/u;

const entrySchema = z
	.object({
		title: z.string(),
		description: z.string(),
		published: z.coerce.date(),
		updated: z.coerce.date().optional(),
		tags: z.array(z.string().regex(TAG)).default([]),
		draft: z.boolean().default(false),
	})
	.strict();

function collectionOf(folder: string) {
	return defineCollection({
		loader: glob({ base: `./src/content/${folder}`, pattern: '*.{md,mdx}' }),
		schema: entrySchema,
	});
}

const collections = {
	posts: collectionOf('posts'),
	notes: collectionOf('notes'),
	docs: collectionOf('docs'),
};

export { collections };
