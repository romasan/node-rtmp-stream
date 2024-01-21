const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

import { colorBlendRGB, rgbToHex } from './color';

const getPosByXY = (x: number, y: number, w: number) => y * w * 4 + x * 4;
const getRGBByXY = (data: any, x: number, y: number, w: number, h?: number) => {
	const pos = getPosByXY(x, y, w);

	return data.slice(pos, pos + 3);
}

const eqA = (a: number[], b: number[]) => !a.some((e, i) => e !== b[i]);

const parallax = (v: number, size: number): number => v > (size - 1) ? (v - size) : v < 0 ? (size + v) : v;

const notWhiteFilter = (color: number[]) => !eqA(color, WHITE);
const blendSomeColors = (a: number[], b: number[]) => colorBlendRGB(a, b, 0.5);
const checkAround = (data: any, x: number, y: number, w: number, h: number) => {
	const colors = [
		getRGBByXY(data, parallax(x - 1, w), parallax(y - 1, h), w),
		getRGBByXY(data, x, parallax(y - 1, h), w),
		getRGBByXY(data, parallax(x + 1, w), parallax(y - 1, h), w),
		getRGBByXY(data, parallax(x - 1, w), y, w),
		getRGBByXY(data, parallax(x + 1, w), y, w),
		getRGBByXY(data, parallax(x - 1, w), parallax(y + 1, h), w),
		getRGBByXY(data, x, parallax(y + 1, h), w),
		getRGBByXY(data, parallax(x + 1, w), parallax(y + 1, h), w),
	].filter(notWhiteFilter);
	const color = colors.length === 3 ? colors.reduce(blendSomeColors) : BLACK;

	return [colors.length, color];
}

let raf = 0;

export const life = (canvas: any, data: any) => {
	if (!canvas) {
		return;
	}

	cancelAnimationFrame(raf);

	const ctx = canvas.getContext('2d');
	const w = canvas.width;
	const h = canvas.height;
	
	data = data || [...ctx.getImageData(0, 0, w, h).data];
	const next = new Array(data.length).fill(255);

	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const pos = getPosByXY(x, y, w);
			const color = getRGBByXY(data, x, y, w, h);
			const [aroundCount, aroundColor] = checkAround(data, x, y, w, h);

			if (eqA(color, WHITE)) {
				if (aroundCount === 3) {
					ctx.fillStyle = rgbToHex(aroundColor);
					ctx.fillRect(x, y, 1, 1);
					next[pos] = aroundColor[0];
					next[pos + 1] = aroundColor[1];
					next[pos + 2] = aroundColor[2];
				}
			} else if (aroundCount < 2 || aroundCount > 3) {
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(x, y, 1, 1);
				next[pos] = 255;
				next[pos + 1] = 255;
				next[pos + 2] = 255;
			} else {
				next[pos] = data[pos];
				next[pos + 1] = data[pos + 1];
				next[pos + 2] = data[pos + 2];
			}
		}
	}

	raf = requestAnimationFrame(() => life(canvas, next));
};
