/**
 * сохраняет картинку с пикселями конкретного юзера (или аналог heatmap)
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas, Image } = require('canvas');

const {
	WIDTH,
	HEIGHT,
} = require('./constants.json');

const drawDiffMask = (file, output, uuid) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		const [time, area, x, y, color, _uuid] = line.split(';');

		if (uuid) {
			if (_uuid === uuid) {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		} else {
			ctx.fillStyle = '#00000033';
			ctx.fillRect(x, y, 1, 1);
		}

	});

	rl.on('close', () => {
		fs.writeFileSync(output, canvas.toBuffer());
	});
};

module.exports = drawDiffMask;
