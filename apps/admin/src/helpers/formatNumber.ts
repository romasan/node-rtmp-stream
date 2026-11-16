export const formatNumber = (value: number): string => {
	return String(value)
		.split('')
		.reverse()
		.reduce((list: string[], item: string, index: number) => [
			...list,
			(index % 3 === 0 ? item + ' ' : item)
		], [])
		.reverse()
		.join('')
		.trim();
};
