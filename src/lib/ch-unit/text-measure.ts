import { fitCount } from './line-fit';

async function loadFaces(faces: readonly string[]): Promise<void> {
	await Promise.allSettled(faces.map((face) => document.fonts.load(`1rem ${face}`)));
}

function charactersThatFit(line: Element, text: string, width: number): number {
	const style = getComputedStyle(line);
	const context = document.createElement('canvas').getContext('2d');
	if (context === null) return 0;
	context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
	context.letterSpacing = style.letterSpacing;
	return fitCount(text, width, (candidate) => context.measureText(candidate).width);
}

export { charactersThatFit, loadFaces };
