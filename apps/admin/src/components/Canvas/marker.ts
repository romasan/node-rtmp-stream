export interface CanvasPoint { x: number; y: number; }
export interface CanvasGeometry { width: number; height: number; shiftX: number; shiftY: number; }

export const getMarkerPosition = (point: CanvasPoint, geometry: CanvasGeometry): CanvasPoint | null => {
	if (![point.x, point.y, geometry.width, geometry.height, geometry.shiftX, geometry.shiftY].every(Number.isSafeInteger)) return null;
	const x = point.x + geometry.shiftX;
	const y = point.y + geometry.shiftY;
	return x >= 0 && y >= 0 && x < geometry.width && y < geometry.height ? { x, y } : null;
};

export const getMarkerFocus = (pixel: CanvasPoint, viewport: { width: number; height: number }, scale: number, isClear: (point: CanvasPoint) => boolean): CanvasPoint => {
	const center = { x: viewport.width / 2, y: viewport.height / 2 };
	const candidates = [.5, .75, .25, .9, .1, .95, .05].flatMap(x => [.5, .75, .25, .9, .1].map(y => ({ x: viewport.width * x, y: viewport.height * y })));
	// Prefer the center, then try a free position beside the floating admin panels.
	const target = isClear(center) ? center : candidates.find(isClear) || center;
	return { x: center.x + (target.x - center.x) / scale - pixel.x - .5, y: center.y + (target.y - center.y) / scale - pixel.y - .5 };
};
