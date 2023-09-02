export const hexToRgb = (hex: string) => [
	parseInt(hex.substring(1, 3), 16),
	parseInt(hex.substring(3, 5), 16),
	parseInt(hex.substring(5, 7), 16),
];

export const rgbToHex = ([r, g, b]: number[]): string => '#' +
	r.toString(16).padStart(2, '0') +
	g.toString(16).padStart(2, '0') +
	b.toString(16).padStart(2, '0');

export const invertRgb = ([r, g, b]: number[]): number[] => [
	255 - r,
	255 - g,
	255 - b,
];