import { defineHastPlugin } from 'satteri';

const COPY_LABEL = 'Copy the code';

const COPIED_LABEL = 'Copied';

const ICON_ATTRIBUTES =
	'aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24"';

const COPY_ICON = `<svg class="btn-icon codeblock-copy-icon" ${ICON_ATTRIBUTES}><rect height="14" rx="2" ry="2" width="14" x="8" y="8"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;

const COPIED_ICON = `<svg class="btn-icon codeblock-copied-icon" ${ICON_ATTRIBUTES}><path d="M20 6 9 17l-5-5"></path></svg>`;

const CODE_FRAME = `<div class="codeblock-frame"><button class="btn btn-sm btn-square codeblock-copy" type="button" data-copy-code data-copied-label="${COPIED_LABEL}">${COPY_ICON}${COPIED_ICON}<span class="visually-hidden" aria-live="polite">${COPY_LABEL}</span></button></div>`;

const TABLE_WRAPPER = '<div class="table-wrapper"></div>';

function classNamesOf(properties: Readonly<Record<string, unknown>> | undefined): string[] {
	const names = properties?.className;
	return Array.isArray(names) ? names.filter((name) => typeof name === 'string') : [];
}

function blockWrappers() {
	return defineHastPlugin({
		name: 'block-wrappers',
		element: [
			{
				filter: ['pre'],
				visit(node, ctx) {
					ctx.setProperty(node, 'className', [...classNamesOf(node.properties), 'codeblock']);
					ctx.wrapNode(node, { raw: CODE_FRAME });
				},
			},
			{
				filter: ['table'],
				visit(node, ctx) {
					ctx.setProperty(node, 'className', [...classNamesOf(node.properties), 'table']);
					ctx.wrapNode(node, { raw: TABLE_WRAPPER });
				},
			},
		],
	});
}

export { blockWrappers };
