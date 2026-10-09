import { defineHastPlugin } from 'satteri';
import { anchorSlug } from '../kandan/components/table-of-contents';

const ANCHORED_HEADINGS = ['h2', 'h3', 'h4'];

const UNNAMED_SECTION = 'section';

const ANCHOR_LABEL = 'Link to this section';

function unusedId(base: string, used: ReadonlySet<string>): string {
	if (!used.has(base)) return base;
	let suffix = 2;
	while (used.has(`${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

function headingAnchors() {
	return () => {
		const used = new Set<string>();
		return defineHastPlugin({
			name: 'heading-anchors',
			element: {
				filter: ANCHORED_HEADINGS,
				visit(node, ctx) {
					const id = unusedId(anchorSlug(ctx.textContent(node)) || UNNAMED_SECTION, used);
					used.add(id);
					ctx.setProperty(node, 'id', id);
					ctx.appendChild(node, {
						type: 'element',
						tagName: 'a',
						properties: { className: ['heading-anchor'], href: `#${id}`, ariaLabel: ANCHOR_LABEL },
						children: [],
					});
				},
			},
		});
	};
}

export { headingAnchors };
