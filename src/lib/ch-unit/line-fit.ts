function fitCount(text: string, width: number, measure: (text: string) => number): number {
	const characters = Array.from(text);
	let low = 0;
	let high = characters.length;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (measure(characters.slice(0, middle).join('')) <= width) low = middle;
		else high = middle - 1;
	}
	return low;
}

export { fitCount };
