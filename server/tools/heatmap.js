/**
 * сохраняет картинку с тепловой картой по точкам
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas } = require('canvas');

const {
	WIDTH,
	HEIGHT,
} = require('./constants.json');

const {
	HSLToRGB,
	RGBToHEX,
	readJSON,
} = require('./helpers');

const heatmapCLI = (file, output, mode = 'COUNT') => { // COUNT, NEWEST
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	let list = [];
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	// let max = 0;

	rl.on('line', (line) => {
		const [time, area, x, y, color, uuid] = line.split(';');

		if (!list[x]) {
			list[x] = [];
		}

		if (mode === 'NEWEST') {
			list[x][y] = time;
		} else {
			list[x][y] = (list[x][y] | 0) + 1;
		}

		// max = debugValue || Math.max(max, list[x][y]);
	});

	rl.on('close', () => {
		let med = 0;

		if (mode === 'NEWEST') {
			const min = list
				.reduce((list, item) => [...list, ...item], [])
				.reduce((_min, item) => typeof item === 'undefined' ? _min : Math.min(_min, item), Infinity);

			list = list.map((line) => (
				line.map((item) => item - min)
			));

			const sorted = list
				.reduce((list, item) => [...list, ...item], [])
				.sort((a, b) => a < b ? 1 : -1);
			med = sorted[Math.floor(sorted.length / 2)];
			// const _list = list
			// 	.reduce((list, item) => [...list, ...item], [])
			// 	.filter((item) => typeof item !== 'undefined');
			// med = Math.floor(_list.reduce((sum, item) => sum + item, 0) / list.length);
		} else {
			const sorted = list
				.reduce((list, item) => [...list, ...item], [])
				.reduce((list, e) => list.includes(e) ? list : [...list, e], [])
				.sort((a, b) => a < b ? 1 : -1);
			med = sorted[Math.floor(sorted.length / 2)];
		}
		
		// const _sorted = list
		// 	.reduce((list, item, x) => [
		// 		...list,
		// 		...item.map((value, y) => ({ value, x, y })),
		// 	], [])
		// 	.sort((a, b) => a.value < b.value ? 1 : -1)
		// 	.map((e) => `${e?.x}-${e?.y}: ${e?.value}`);

		// fs.writeFileSync(
		// 	'./pixels.top',
		// 	sorted.join('\n'),
		// );

		for (const x in list) {
			for (const y in list[x]) {
				// console.log('====', x, y, med, list[x][y]);

				const h = (1.0 - (Math.min(list[x][y] / med, 1))) * 240;
				const hsl = [h, 100, 50];
				const rgb = HSLToRGB(hsl);
				const color = RGBToHEX(rgb);

				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		}

		if (output === 'DATA') {
			return canvas;
		} else {
			fs.writeFileSync(output, canvas.toBuffer());
		}
	});
};

const heatmapFromStats = async (stats, output) => {
	if (typeof stats === 'string') {
		stats = await readJSON(stats)
	}

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
			length++;
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
			const h = (1.0 - (Math.min(count / med, 1))) * 240;
			const hsl = [h, 100, 50];
			const rgb = HSLToRGB(hsl);
			const color = RGBToHEX(rgb);

			ctx.fillStyle = color;
			ctx.fillRect(x, y, 1, 1);
		}
	}

	if (output) {
		fs.writeFileSync(output, canvas.toBuffer());
	} else {
		return canvas;
	}
};

const heatmapNewestFromStats = async (stats, output) => {
	if (typeof stats === 'string') {
		stats = await readJSON(stats)
	}

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

	// const med = (max - min) / 2;
	const med = times.sort()[Math.floor(times.length / 2)] - min;

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const key = `${x}:${y}`;

			if (stats[key]) {
				const [time] = stats[key];
				const h = (1.0 - (Math.min((time - min) / med, 1))) * 240;
				const hsl = [h, 100, 50];
				const rgb = HSLToRGB(hsl);
				const color = RGBToHEX(rgb);
	
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	if (output) {
		fs.writeFileSync(output, canvas.toBuffer());
	} else {
		return canvas;
	}
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

module.exports = {
	heatmapCLI,
	heatmapFromStats,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
};
