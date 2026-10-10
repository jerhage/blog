import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import type { DiagramLayout } from './layout';
import type { PacketSource } from './packet-parse';
import type { SequenceSource } from './sequence-parse';

const COMPONENT_FILES = {
	diagram: 'Diagram.svelte',
	sequence: 'SequenceDiagram.svelte',
	packet: 'PacketLayout.svelte',
} as const;

const PROJECT_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const HYDRATION_COMMENT = /<!--.*?-->/gu;

let loading: Promise<ViteDevServer> | undefined;

function startServer(): Promise<ViteDevServer> {
	return createServer({
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
}

async function renderComponent<Props extends Record<string, unknown>>(
	name: keyof typeof COMPONENT_FILES,
	props: Props,
	idPrefix: string,
): Promise<string> {
	loading ??= startServer();
	const server = await loading;
	const file = fileURLToPath(new URL(`../../kandan/components/${COMPONENT_FILES[name]}`, import.meta.url));
	const loaded = await server.ssrLoadModule(file);
	const component: Component<Props> = loaded.default;
	const { body } = render(component, { props, idPrefix });
	return body.replace(HYDRATION_COMMENT, '').replace(/\s*\n\s*/gu, ' ').trim();
}

function renderDiagram(layout: DiagramLayout, idPrefix: string): Promise<string> {
	return renderComponent('diagram', { ...layout, scrollLabel: layout.label }, idPrefix);
}

function renderSequence(source: SequenceSource, idPrefix: string): Promise<string> {
	const { title, participants, steps } = source;
	return renderComponent('sequence', { label: title, participants, steps }, idPrefix);
}

function renderPacket(source: PacketSource, idPrefix: string): Promise<string> {
	const { title, bits, offsets, rows } = source;
	return renderComponent('packet', { label: title, bits, offsets, rows }, idPrefix);
}

async function closeDiagramRenderer(): Promise<void> {
	if (loading === undefined) return;
	const server = await loading;
	loading = undefined;
	await server.close();
}

export { closeDiagramRenderer, renderDiagram, renderPacket, renderSequence };
