/**
 * карты активности
 */

import { createCanvas } from 'canvas';
import { getColorHeat, getGradient } from '../helpers/colors';
import { getExpand } from './expands';

const isPixelKey = (key: string) => key.indexOf(':') > 0;

/**
 * разбирает ключ "x:y" в логические координаты пикселя
 */
const pixelXY = (key: string) => key.split(':').map(Number);

export const heatmapFromStats = (stats: any) => {
	const { width, height, shiftX, shiftY } = getExpand();
	let sum = 0;
	let length = 0;

	Object.keys(stats).forEach((key) => {
		if (isPixelKey(key)) {
			const [,,, count] = stats[key];

			sum += count;
			length += +count ? 1 : 0;
		}
	});

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width, height);

	const med = sum / length;

	Object.keys(stats).forEach((key) => {
		if (!isPixelKey(key)) {
			return;
		}

		const [x, y] = pixelXY(key);
		const [,,, count = 0] = stats[key];

		if (count) {
			const color = getColorHeat(1.0 - (Math.min(count / med, 1)), 250);

			ctx.fillStyle = color;
			ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
		}
	});

	return canvas;
};

export const heatmapNewestFromStats = (stats: any) => {
	const { width, height, shiftX, shiftY } = getExpand();
	let min = Infinity;

	const times: number[] = [];

	Object.keys(stats).forEach((key) => {
		if (isPixelKey(key)) {
			const [time] = stats[key];

			min = Math.min(min, time);
			times.push(time);
		}
	});

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width, height);

	const med = times.sort()[Math.floor(times.length / 2)] - min;

	Object.keys(stats).forEach((key) => {
		if (!isPixelKey(key)) {
			return;
		}

		const [x, y] = pixelXY(key);
		const [time] = stats[key];
		const color = getColorHeat(1.0 - (Math.min((time - min) / med, 1)), 250);

		ctx.fillStyle = color;
		ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
	});

	return canvas;
};

export const heatmapNewestByIndex = (stats: any) => {
	const { width, height, shiftX, shiftY } = getExpand();
	let max = 0;

	Object.keys(stats).forEach((key) => {
		if (isPixelKey(key)) {
			const [,,,,, index] = stats[key];

			max = Math.max(max, index);
		}
	});

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width, height);

	Object.keys(stats).forEach((key) => {
		if (!isPixelKey(key)) {
			return;
		}

		const [x, y] = pixelXY(key);
		const [,,,,, index] = stats[key];
		const color = getColorHeat(1.0 - (Math.min(index / max, 1)), 250);

		ctx.fillStyle = color;
		ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
	});

	return canvas;
};

export const mapLastPixelsFromStats = (stats: any, count: number) => {
	const { width, height, shiftX, shiftY } = getExpand();
	let times: any[] = [];

	Object.keys(stats).forEach((key) => {
		if (isPixelKey(key)) {
			const [x, y] = pixelXY(key);
			const [time] = stats[key];

			times.push({ x, y, time });
		}
	});

	times.sort((a, b) => a.time < b.time ? 1 : -1);

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#f658b8';
	ctx.fillRect(0, 0, width, height);

	for (let i = 0; i < Math.min(count, times.length); i++) {
		const { x, y } = times[i];
		const key = `${x}:${y}`;

		if (stats[key]) {
			const color = stats.colors[stats[key][2]];

			ctx.fillStyle = color;
			ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
		}
	}

	return canvas;
};

export const mapByUsersFromStats = (stats: any, UUID: string) => {
	const { width, height, shiftX, shiftY } = getExpand();
	const uuids: Record<string, boolean> = {};

	Object.keys(stats).forEach((key) => {
		if (isPixelKey(key)) {
			const [, uuid] = stats[key];

			uuids[uuid] = true;
		}
	});

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = UUID ? '#f658b8' : '#000000';
	ctx.fillRect(0, 0, width, height);

	const length = Object.keys(uuids).length;
	const colors = UUID ? [] : getGradient(length);
	const uuidsData: any = Object.keys(uuids).reduce((list, key, index) => ({ ...list, [key]: index }), {});

	Object.keys(stats).forEach((key) => {
		if (!isPixelKey(key)) {
			return;
		}

		const [x, y] = pixelXY(key);
		const [, uuid, color] = stats[key];

		if (typeof uuid !== 'undefined' && (!UUID || stats.uuids[uuid] === UUID)) {
			ctx.fillStyle = UUID ? stats.colors[color] : colors[uuidsData[uuid]];
			ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
		}
	});

	return canvas;
};

export const mapByIP = (stats: any, IP: string) => {
	const { width, height, shiftX, shiftY } = getExpand();
	const IPs: Record<string, boolean> = {};

	Object.keys(stats).forEach((key) => {
		if (isPixelKey(key)) {
			const [,,,, ip] = stats[key];

			IPs[ip] = true;
		}
	});

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = IP ? '#f658b8' : '#000000';
	ctx.fillRect(0, 0, width, height);

	const length = Object.keys(IPs).length;
	const colors = IP ? [] : getGradient(length);
	const IPsData: any = Object.keys(IPs).reduce((list, key, index) => ({ ...list, [key]: index }), {});

	Object.keys(stats).forEach((key) => {
		if (!isPixelKey(key)) {
			return;
		}

		const [x, y] = pixelXY(key);
		const [,, color,, ip] = stats[key];

		if (typeof ip !== 'undefined' && (!IP || stats.ips[ip]?.split(', ').includes(IP))) {
			ctx.fillStyle = IP ? stats.colors[color] : colors[IPsData[ip]];
			ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
		}
	});

	return canvas;
};

export const mapByTime = (stats: any, TIME: number) => {
	const { width, height, shiftX, shiftY } = getExpand();

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#f658b8';
	ctx.fillRect(0, 0, width, height);

	const breakTime = Date.now() - TIME;

	Object.keys(stats).forEach((key) => {
		if (!isPixelKey(key)) {
			return;
		}

		const [x, y] = pixelXY(key);
		const [time,, color] = stats[key];

		if (Number(time) >= breakTime) {
			ctx.fillStyle = stats.colors[color];
			ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
		}
	});

	return canvas;
};
