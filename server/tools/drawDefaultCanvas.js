/**
 * сохраняет в файл картинку в клеточку
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

const {
	WIDTH,
	HEIGHT,
	COLORS,
} = require('./constants.json');

const drawDefaultCanvas = (file, width = WIDTH, height = HEIGHT, mode = 'RANDOM') => { // WHITE, RANDOM, CHESS, CHESSX, TEXT
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);

	if (mode === 'RANDOM') {
		const inc = 40;
		for (let x = 0; x < width / inc; x++) {
			for (let y = 0; y < height / inc; y++) {
				const color = COLORS[Math.floor((Math.random() * COLORS.length))];
				ctx.fillStyle = color;
				ctx.fillRect(x * inc, y * inc, inc, inc);
			}
		}
	}

	if (mode === 'CHESS' || mode === 'CHESSX') {
		const squareSize = 40;
		const rows = Math.ceil(height / squareSize);
		const cols = Math.ceil(width / squareSize);
		ctx.strokeStyle = '#0000ff';
		for (let x = 0; x < cols; x++) {
			for (let y = 0; y < rows; y++) {
				if ((x + y) % 2 === 0) {
					ctx.fillStyle = '#aaa8d9';
					ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
				}
				if (mode === 'CHESSX') {
					ctx.fillStyle = '#008000';
					ctx.fillRect(x * squareSize, y * squareSize, 1, 1);
					ctx.fillStyle = '#0000ff';
					ctx.fillText(`${y + 1}:${x + 1}`, x * squareSize + 5, y * squareSize + 15);
				}
			}
		}
	}

	if (file === 'DATA') {
		return canvas;
	} else {
		fs.writeFileSync(file, canvas.toBuffer());
	}
};

module.exports = drawDefaultCanvas;
