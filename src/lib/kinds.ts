const CONTENT_KINDS = ['posts', 'notes', 'docs'] as const;

type ContentKind = (typeof CONTENT_KINDS)[number];

type KindLabels = {
	readonly plural: string;
	readonly singular: string;
	readonly path: string;
};

const KIND_LABELS: Readonly<Record<ContentKind, KindLabels>> = {
	posts: { plural: 'Posts', singular: 'Post', path: '/posts/' },
	notes: { plural: 'Notes', singular: 'Note', path: '/notes/' },
	docs: { plural: 'Docs', singular: 'Doc', path: '/docs/' },
};

function entryPath(kind: ContentKind, id: string): string {
	return `${KIND_LABELS[kind].path}${id}/`;
}

function tagPath(tag: string): string {
	return `/tags/${tag}/`;
}

export { CONTENT_KINDS, KIND_LABELS, entryPath, tagPath };
export type { ContentKind, KindLabels };
