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
} = require('./helpers');

const heatmap = (file, output, mode = 'COUNT') => { // COUNT, NEWEST
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
		const [time, nick, x, y, color, uuid] = line.split(';');

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

module.exports = heatmap;
