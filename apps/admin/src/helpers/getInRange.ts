export const getInRange = (value: number, range: [number, number]) =>
	Math.min(Math.max(value, range[0]), range[1]);
