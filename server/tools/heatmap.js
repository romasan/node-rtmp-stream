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

const heatmap = (file, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const list = [];
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

		list[x][y] = (list[x][y] | 0) + 1;

		// max = debugValue || Math.max(max, list[x][y]);
	});

	rl.on('close', () => {
		const sorted = list
			.reduce((list, item) => [
				...list,
				...item, // .filter((e) => !list.includes(e))
			], [])
			.reduce((list, e) => list.includes(e) ? list : [...list, e], [])
			.sort((a, b) => a < b ? 1 : -1);
		const med = sorted[Math.floor(sorted.length / 2)];
		
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
				const h = (1.0 - (Math.min(list[x][y] / med, 1))) * 240;
				const hsl = [h, 100, 50];
				const rgb = HSLToRGB(hsl);
				const color = RGBToHEX(rgb);

				// if (list[x][y] > 1000) {
				// 	console.log('====', med, list[x][y], x, y, hsl, rgb);
				// }
				// if (list[x][y] < med * 2) {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
				// }
			}
		}

		fs.writeFileSync(output, canvas.toBuffer());
	});
};

module.exports = heatmap;
