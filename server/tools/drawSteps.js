/**
 * каждые N пикселей сохраняет кадр в файл
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas, Image } = require('canvas');

const {
	WIDTH,
	HEIGHT,
	PPF,
} = require('./constants.json');

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;

const drawSteps = (file, backgroundImage) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	const imgBuf = fs.readFileSync(backgroundImage);
	const image = new Image;
	image.src = imgBuf;
	ctx.drawImage(image, 0, 0);

	// ctx.fillStyle = '#ffffff';
	// ctx.fillRect(0, 0, WIDTH, HEIGHT);

	let i = -1;
	let frame = 0;

	// const breakTime = Date.now() - day * 3;
	// const breakLine = 1758020 - 300_000;

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		i++;

		const [time, name, x, y, color] = line.split(';');

		// if (Number(time) < breakTime) {
		// 	return
		// }

		// if (i < breakLine) {
		// 	return
		// }

		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);

		if (i % PPF === 0) {
			const output = 'frames/' + String(++frame).padStart(8, '0') + '.png';

			fs.writeFileSync(output, canvas.toBuffer());
		}

		if (i % 54000 === 0) {
			console.log(`${Math.floor(frame / (1080))} minute, #${frame} frame, ${i} pixels`);
		}

		// if (i >= 1000) {
		// 	rl.pause();
		// 	rl.removeAllListeners('line');
		// 	rl.close();
		// 	console.log(`break, pixel #${i}, frame #${frame}`);
		// 	return;
		// }
	});

	rl.on('close', () => {
		const output = 'frames/' + String(++frame).padStart(8, '0') + '.png';

		fs.writeFileSync(output, canvas.toBuffer());

		console.log(`Total: ${Math.floor(frame / (1080))} minute(s), #${frame} frames, ${i} pixels`);
	});
};

module.exports = drawSteps;
