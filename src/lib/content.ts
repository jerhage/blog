type Dated = {
	readonly published: Date;
	readonly updated?: Date | undefined;
};

type Draftable = {
	readonly draft: boolean;
};

type Tagged = {
	readonly tags: readonly string[];
};

type Entry<Data> = {
	readonly id: string;
	readonly data: Data;
};

type Neighbours<T> = {
	readonly previous: T | undefined;
	readonly next: T | undefined;
};

function newestFirst<T extends Entry<Dated>>(entries: readonly T[]): T[] {
	return entries.toSorted(
		(a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.id.localeCompare(b.id),
	);
}

function lastChanged(entry: Entry<Dated>): Date {
	return entry.data.updated ?? entry.data.published;
}

function recentlyChanged<T extends Entry<Dated>>(entries: readonly T[]): T[] {
	return entries.toSorted(
		(a, b) => lastChanged(b).valueOf() - lastChanged(a).valueOf() || a.id.localeCompare(b.id),
	);
}

function visibleEntries<T extends Entry<Dated & Draftable>>(
	entries: readonly T[],
	production: boolean,
): T[] {
	return newestFirst(entries.filter((entry) => !production || !entry.data.draft));
}

function neighbours<T extends Entry<Dated>>(newestFirstEntries: readonly T[], id: string): Neighbours<T> {
	const index = newestFirstEntries.findIndex((entry) => entry.id === id);
	if (index === -1) return { previous: undefined, next: undefined };
	return { previous: newestFirstEntries[index + 1], next: newestFirstEntries[index - 1] };
}

function groupByTag<T extends Entry<Tagged>>(entries: readonly T[]): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	for (const entry of entries) {
		for (const tag of entry.data.tags) {
			const group = groups.get(tag);
			if (group === undefined) groups.set(tag, [entry]);
			else group.push(entry);
		}
	}
	return groups;
}

export { groupByTag, lastChanged, neighbours, newestFirst, recentlyChanged, visibleEntries };
export type { Dated, Draftable, Entry, Neighbours, Tagged };
