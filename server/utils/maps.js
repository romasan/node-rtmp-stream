/**
 * карты активности
 */

const { createCanvas } = require('canvas');
const { HSLToRGB, RGBToHEX } = require('../helpers/colors');

const heatmapFromStats = (stats) => {
	let width = 0;
	let height = 0;
	let max = 0;
	let sum = 0;
	let length = 0;
	// const list = [];

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');
			const [,,, count] = stats[key];

			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
			max = Math.max(max, count);
			sum += count;
			length += +count ? 1 : 0;
			// list.push(count);
		}
	});

	width++;
	height++;

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width, height);

	// const med = max / 2;
	const med = sum / length;
	// list.sort();
	// const med = list[Math.floor(list.length / 2)];

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const key = `${x}:${y}`;
			const [,,, count = 0] = stats[key] || [];

			if (count) {
				const h = (1.0 - (Math.min(count / med, 1))) * 360;
				const hsl = [h, 100, 50];
				const rgb = HSLToRGB(hsl);
				const color = RGBToHEX(rgb);

				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	return canvas;
};

const heatmapNewestFromStats = (stats) => {
	let width = 0;
	let height = 0;
	let max = 0;
	let min = Infinity;

	const times = [];

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');
			const [time] = stats[key];

			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
			max = Math.max(max, time);
			min = Math.min(min, time);
			times.push(time);
		}
	});

	width++;
	height++;

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width, height);

	// const med = Math.floor((max - min) / 2);
	const med = times.sort()[Math.floor(times.length / 2)] - min;

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const key = `${x}:${y}`;

			if (stats[key]) {
				const [time] = stats[key];
				const h = (1.0 - (Math.min((time - min) / med, 1))) * 360;
				const hsl = [h, 100, 50];
				const rgb = HSLToRGB(hsl);
				const color = RGBToHEX(rgb);
	
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	return canvas;
};

const mapLastPixelsFromStats = (stats, count) => {
	let width = 0;
	let height = 0;
	let max = 0;

	let times = [];

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');
			const [time] = stats[key];

			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
			max = Math.max(max, time);
			times.push({ x, y, time });
		}
	});

	width++;
	height++;

	times.sort((a, b) => a.time < b.time ? 1 : -1);

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#f658b8';
	ctx.fillRect(0, 0, width, height);

	for (let i = 0; i < Math.min(count, times.length); i++) {
		const { x, y, time } = times[i];
		const key = `${x}:${y}`;

		if (stats[key]) {
			const color = stats.colors[stats[key][2]];

			ctx.fillStyle = color;
			ctx.fillRect(x, y, 1, 1);
		}
	}

	return canvas;
};

const mapByUsersFromStats = (stats, UUID) => {
	let width = 0;
	let height = 0;
	let uuids = {};

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');
			const [, uuid] = stats[key];

			uuids[uuid] = true;
			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
		}
	});

	const canvas = createCanvas(width + 1, height + 1);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = UUID ? '#f658b8' : '#000000';
	ctx.fillRect(0, 0, width + 1, height + 1);

	const length = Object.keys(uuids).length;
	const colors = Array(length + 1).fill().map((e, i) => (
		'#' + (
				Math.floor(0xffffff / length) * i
		).toString(16).padStart(6, '0')
	));

	colors.shift();

	uuids = Object.keys(uuids).reduce((list, key, index) => ({ ...list, [key]: index }), {});

	for (let x = 0; x <= width; x++) {
		for (let y = 0; y <= height; y++) {
			const key = `${x}:${y}`;
			const [, uuid, color] = stats[key] || [];

			if (typeof uuid !== 'undefined' && (!UUID || stats.uuids[uuid] === UUID)) {
				ctx.fillStyle = UUID ? stats.colors[color] : colors[uuids[uuid]];
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	return canvas;
};

const mapByIP = (stats, IP) => {
	let width = 0;
	let height = 0;
	let IPs = {};

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');
			const [,,,, ip] = stats[key];

			IPs[ip] = true;
			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
		}
	});

	const canvas = createCanvas(width + 1, height + 1);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = IP ? '#f658b8' : '#000000';
	ctx.fillRect(0, 0, width + 1, height + 1);

	const length = Object.keys(IPs).length;
	const colors = Array(length + 1).fill().map((e, i) => (
		'#' + (
				Math.floor(0xffffff / length) * i
		).toString(16).padStart(6, '0')
	));

	colors.shift();

	IPs = Object.keys(IPs).reduce((list, key, index) => ({ ...list, [key]: index }), {});

	for (let x = 0; x <= width; x++) {
		for (let y = 0; y <= height; y++) {
			const key = `${x}:${y}`;
			const [,, color,, ip] = stats[key] || [];

			if (typeof ip !== 'undefined' && (!IP || stats.ips[ip]?.split(', ').includes(IP))) {
				ctx.fillStyle = IP ? stats.colors[color] : colors[IPs[ip]];
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	return canvas;
};

const mapByTime = (stats, TIME) => {
	let width = 0;
	let height = 0;

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');

			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
		}
	});

	const canvas = createCanvas(width + 1, height + 1);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#f658b8';
	ctx.fillRect(0, 0, width + 1, height + 1);

	const breakTime = Date.now() - TIME;

	for (let x = 0; x <= width; x++) {
		for (let y = 0; y <= height; y++) {
			const key = `${x}:${y}`;
			const [time,, color] = stats[key] || [];

			if (Number(time) >= breakTime) {
				ctx.fillStyle = stats.colors[color];
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	return canvas;
};

module.exports = {
	heatmapFromStats,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
	mapByUsersFromStats,
	mapByIP,
	mapByTime,
};