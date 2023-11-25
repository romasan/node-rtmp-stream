export const posIsAbove = ([x, y]: [number, number], el: HTMLElement) => {
	const { left, top, width, height } = el.getBoundingClientRect();

	return (
		x >= left &&
		x <= left + width &&
		y >= top &&
		y <= top + height
	);
};
