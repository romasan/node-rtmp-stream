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

export const getPixelColor = (canvas: any, x: number, y: number) => {
	if (!canvas) {
		return '#fff';
	}

	const ctx = canvas.getContext('2d');

	return rgbToHex(ctx.getImageData(x, y, 1, 1).data);
};

const colorChannelMixer = (a: number, b: number, amountToMix: number) =>
	Math.ceil(a * amountToMix + b * (1 - amountToMix));

export const colorBlendRGB = (rgbA: number[], rgbB: number[], amountToMix: number) => [
	colorChannelMixer(rgbA[0], rgbB[0], amountToMix),
	colorChannelMixer(rgbA[1], rgbB[1], amountToMix),
	colorChannelMixer(rgbA[2], rgbB[2], amountToMix),
];
