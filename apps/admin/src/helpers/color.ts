import { pipe } from './pipe';

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

export const invertHex = (value: string) => pipe(value, hexToRgb, invertRgb, rgbToHex);

export const getPixelColor = (canvas: any, x: number, y: number) => {
	let color = '#fff';

	try {
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
	
		color = rgbToHex(ctx.getImageData(x, y, 1, 1).data);
	} catch (ignore) {}

	return color;
};

const colorChannelMixer = (a: number, b: number, amountToMix: number) =>
	Math.ceil(a * amountToMix + b * (1 - amountToMix));

export const colorBlendRGB = (rgbA: number[], rgbB: number[], amountToMix: number) => [
	colorChannelMixer(rgbA[0], rgbB[0], amountToMix),
	colorChannelMixer(rgbA[1], rgbB[1], amountToMix),
	colorChannelMixer(rgbA[2], rgbB[2], amountToMix),
];

const blendWithWhiteAndBlack = (color: number, whiteOpacity: number, blackOpacity: number) =>
	Math.round((1 - blackOpacity) * (whiteOpacity * 255 + (1 - whiteOpacity) * color));

export const blendColorWhiteBlack = (hexColor: string, whiteOpacity: number, blackOpacity: number) => {
	const [red, green, blue] = hexToRgb(hexColor);

	return rgbToHex([
		blendWithWhiteAndBlack(red, whiteOpacity, blackOpacity),
		blendWithWhiteAndBlack(green, whiteOpacity, blackOpacity),
		blendWithWhiteAndBlack(blue, whiteOpacity, blackOpacity),
	]);
};

export const isHEX = (str: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(str);

export const expandShortHex = (shortHex: string) => { 
	if (!/^#[0-9A-Fa-f]{3}$/.test(shortHex)) {
		return shortHex;
	}

	return '#' + shortHex.substring(1).split('').map(char => char + char).join('');
};

const num2rgb = (num: number) => [
	(num >> 16) & 0xFF,
	(num >> 8) & 0xFF,
	num & 0xFF
];

export const getRandomColor = () => pipe(Math.random() * 0xffffff, Math.floor, num2rgb, rgbToHex);
