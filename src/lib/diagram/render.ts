import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import type { DiagramEdge, DiagramNode } from '../../kandan/components/diagram';
import type { DiagramLayout } from './layout';

type DiagramProps = {
	label: string;
	width: number;
	height: number;
	nodes: readonly DiagramNode[];
	edges: readonly DiagramEdge[];
};

type Loaded = {
	readonly server: ViteDevServer;
	readonly diagram: Component<DiagramProps>;
};

const DIAGRAM_COMPONENT = fileURLToPath(
	new URL('../../kandan/components/Diagram.svelte', import.meta.url),
);

const PROJECT_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const HYDRATION_COMMENT = /<!--.*?-->/gu;

let loading: Promise<Loaded> | undefined;

async function load(): Promise<Loaded> {
	const server = await createServer({
		configFile: false,
		mode: 'production',
		root: PROJECT_ROOT,
		appType: 'custom',
		logLevel: 'silent',
		server: { middlewareMode: true, ws: false, watch: null },
		optimizeDeps: { noDiscovery: true, include: [] },
		ssr: { optimizeDeps: { noDiscovery: true, include: [] } },
		plugins: [svelte({ compilerOptions: { dev: false } })],
	});
	const loaded = await server.ssrLoadModule(DIAGRAM_COMPONENT);
	return { server, diagram: loaded.default };
}

function diagramComponent(): Promise<Loaded> {
	loading ??= load();
	return loading;
}

async function renderDiagram(layout: DiagramLayout, idPrefix: string): Promise<string> {
	const { diagram } = await diagramComponent();
	const { body } = render(diagram, { props: layout, idPrefix });
	return body.replace(HYDRATION_COMMENT, '').replace(/\s*\n\s*/gu, ' ').trim();
}

async function closeDiagramRenderer(): Promise<void> {
	if (loading === undefined) return;
	const { server } = await loading;
	loading = undefined;
	await server.close();
}

export { closeDiagramRenderer, renderDiagram };
