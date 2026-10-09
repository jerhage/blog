const failures: string[] = [];

function recordDiagramFailure(message: string): void {
	failures.push(message);
}

function takeDiagramFailures(): string[] {
	return failures.splice(0);
}

function diagramBuildGuard() {
	return {
		name: 'diagram-build-guard',
		hooks: {
			'astro:build:done': () => {
				const found = takeDiagramFailures();
				if (found.length > 0) throw new Error(`${found.length} diagram block(s) failed:\n${found.join('\n')}`);
			},
		},
	};
}

export { diagramBuildGuard, recordDiagramFailure, takeDiagramFailures };
