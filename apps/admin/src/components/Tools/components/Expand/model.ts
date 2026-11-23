export interface CanvasSettings {
	width: number;
	height: number;
	shiftX: number;
	shiftY: number;
	colorScheme: string;
}
export type Corner = 'LT' | 'RT' | 'LB' | 'RB';

export const dimensionError = (value: string, minimum: number): string => {
	const size = Number(value);
	if (!value.trim() || !Number.isSafeInteger(size) || size <= 0) return 'Введите целое положительное число.';
	if (size < minimum) return `Уменьшение недоступно. Минимум — ${minimum} px.`;
	return '';
};

export const createResizePlan = (current: CanvasSettings, width: number, height: number, corner: Corner, colorScheme: string) => {
	const deltaWidth = width - current.width;
	const deltaHeight = height - current.height;
	const left = corner === 'RT' || corner === 'RB' ? deltaWidth : 0;
	const top = corner === 'LB' || corner === 'RB' ? deltaHeight : 0;
	const next: CanvasSettings = {
		width, height,
		shiftX: current.shiftX + left,
		shiftY: current.shiftY + top,
		colorScheme,
	};
	return {
		next,
		growth: { left, top, right: deltaWidth - left, bottom: deltaHeight - top },
		addedPixels: width * height - current.width * current.height,
		changed: Object.keys(next).some(key => next[key as keyof CanvasSettings] !== current[key as keyof CanvasSettings]),
	};
};
