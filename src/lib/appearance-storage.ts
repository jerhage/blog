import { applyAppearance, pinnedScheme } from '../kandan/core/appearance.js';
import type { Appearance } from '../kandan/core/appearance.js';

const APPEARANCE_KEYS = { themeKey: 'blog.theme', schemeKey: 'blog.color-scheme' } as const;

function saveAppearance(root: HTMLElement, storage: Storage, chosen: Appearance): void {
	applyAppearance(root, chosen);
	try {
		storage.setItem(APPEARANCE_KEYS.themeKey, chosen.theme);
		const pinned = pinnedScheme(chosen.colorScheme);
		if (pinned === undefined) storage.removeItem(APPEARANCE_KEYS.schemeKey);
		else storage.setItem(APPEARANCE_KEYS.schemeKey, pinned);
	} catch {
		return;
	}
}

export { APPEARANCE_KEYS, saveAppearance };
