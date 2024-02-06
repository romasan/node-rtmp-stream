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

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, width, height);

	// let _break = false;
	// let _breakTime = Date.now() - (1000 * 60 * 60 * 2) + (1000 * 60 * 30);

	if (backgroundImage !== 'NOIMAGE') {
		const imgBuf = fs.readFileSync(backgroundImage);
		const image = new Image;
		image.src = imgBuf;
	
		ctx.drawImage(image, 0, 0);
	}

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		// if (_break) {
		// 	return
		// }
		const [time,,x,y,color] = line.split(';');
		// if (time >= _breakTime) {
		// 	console.log('====', time);
		// 	_break = true;
		// 	return;
		// }

		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);
	});

	rl.on('close', () => {
		// if (_break) {
		// 	return
		// }
		fs.writeFileSync(output, canvas.toBuffer());
	});
};

// TODO use alternative canvas library
// make perfomance test
// 1) only read file, without canvas rendering
// 2) with canvas
// 3) canvaskit-wasm
// 4) skia-canvas
// 5) @napi-rs/canvas

module.exports = recover;
