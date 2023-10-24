/**
 * сохраняет картинку со всеми пикселями
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas, Image } = require('canvas');

const {
	WIDTH,
	HEIGHT,
} = require('./constants.json');

const recover = (file, backgroundImage, output, width = WIDTH, height = HEIGHT) => {
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	const imgBuf = fs.readFileSync(backgroundImage);
	const image = new Image;
	image.src = imgBuf;

	ctx.drawImage(image, 0, 0);

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		const [,,x,y,color] = line.split(';');

		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);
	});

	rl.on('close', () => {
		fs.writeFileSync(output, canvas.toBuffer());
	});
};

module.exports = recover;
