import { describe, expect, it } from 'vitest';
import { fitCount } from './line-fit';

const tenPixelsEach = (text: string): number => Array.from(text).length * 10;

describe('the line fit', () => {
	it('counts the characters whose width stays within the box', () => {
		expect(fitCount('abcdefghij', 45, tenPixelsEach)).toBe(4);
	});

	it('counts a character that exactly fills the box', () => {
		expect(fitCount('abcdefghij', 50, tenPixelsEach)).toBe(5);
	});

	it('counts every character when the text is shorter than the box', () => {
		expect(fitCount('abc', 500, tenPixelsEach)).toBe(3);
	});

	it('counts none when the first character is wider than the box', () => {
		expect(fitCount('abc', 5, tenPixelsEach)).toBe(0);
	});

	it('counts a character outside the BMP as one', () => {
		expect(fitCount('𠮟𠮟𠮟', 25, tenPixelsEach)).toBe(2);
	});

	it('follows a measure where letters differ in width', () => {
		const narrowI = (text: string): number =>
			Array.from(text).reduce((sum, letter) => sum + (letter === 'i' ? 4 : 10), 0);

		expect(fitCount('iiiiiiXX', 34, narrowI)).toBe(7);
	});
});
