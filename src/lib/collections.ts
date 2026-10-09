import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { visibleEntries } from './content';
import { CONTENT_KINDS } from './kinds';
import type { ContentKind } from './kinds';

type ListedEntry = {
	readonly kind: ContentKind;
	readonly entry: CollectionEntry<ContentKind>;
};

async function listEntries(kind: ContentKind): Promise<CollectionEntry<ContentKind>[]> {
	return visibleEntries(await getCollection(kind), import.meta.env.PROD);
}

async function listEveryEntry(): Promise<ListedEntry[]> {
	const lists = await Promise.all(
		CONTENT_KINDS.map(async (kind) => {
			const entries = await listEntries(kind);
			return entries.map((entry) => ({ kind, entry }));
		}),
	);
	return lists.flat();
}

export { listEntries, listEveryEntry };
export type { ListedEntry };
