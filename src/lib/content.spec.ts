import { describe, expect, it } from 'vitest';
import { groupByTag, neighbours, recentlyChanged, visibleEntries } from './content';

function entry(id: string, published: string, extra: { draft?: boolean; updated?: string; tags?: string[] } = {}) {
	return {
		id,
		data: {
			published: new Date(published),
			updated: extra.updated === undefined ? undefined : new Date(extra.updated),
			draft: extra.draft ?? false,
			tags: extra.tags ?? [],
		},
	};
}

describe('visibleEntries', () => {
	const entries = [
		entry('old', '2026-01-01'),
		entry('draft', '2026-03-01', { draft: true }),
		entry('new', '2026-02-01'),
	];

	it('drops drafts in production', () => {
		expect(visibleEntries(entries, true).map((e) => e.id)).toEqual(['new', 'old']);
	});

	it('keeps drafts outside production', () => {
		expect(visibleEntries(entries, false).map((e) => e.id)).toEqual(['draft', 'new', 'old']);
	});
});

describe('recentlyChanged', () => {
	it('orders by the update date when there is one', () => {
		const entries = [entry('a', '2026-03-01'), entry('b', '2026-01-01', { updated: '2026-04-01' })];
		expect(recentlyChanged(entries).map((e) => e.id)).toEqual(['b', 'a']);
	});
});

describe('neighbours', () => {
	const entries = [entry('c', '2026-03-01'), entry('b', '2026-02-01'), entry('a', '2026-01-01')];

	it('names the older entry previous and the newer entry next', () => {
		const around = neighbours(entries, 'b');
		expect(around.previous?.id).toBe('a');
		expect(around.next?.id).toBe('c');
	});

	it('leaves the missing side empty at either end', () => {
		expect(neighbours(entries, 'c').next).toBeUndefined();
		expect(neighbours(entries, 'a').previous).toBeUndefined();
	});
});

describe('groupByTag', () => {
	it('lists an entry under each of its tags', () => {
		const entries = [entry('a', '2026-01-01', { tags: ['vpn', 'mesh'] }), entry('b', '2026-01-02', { tags: ['vpn'] })];
		const groups = groupByTag(entries);
		expect(groups.get('vpn')?.map((e) => e.id)).toEqual(['a', 'b']);
		expect(groups.get('mesh')?.map((e) => e.id)).toEqual(['a']);
	});
});
