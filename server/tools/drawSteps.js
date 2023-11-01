/**
 * каждые N пикселей сохраняет кадр в файл
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas, Image, registerFont } = require('canvas');
const drawDefaultCanvas = require('./drawDefaultCanvas');

registerFont(__dirname + '/../../res/fonts/CustomFont.ttf', { family: 'Custom Font' });

const {
	WIDTH,
	HEIGHT,
} = require('./constants.json');

const PPF = 333;
const FPS = 30;
const PPS = PPF * FPS;

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;

const textX = 1500;
const textY = 1000;
const textLineHeight = 70;

const videoWidth = 1920;
const videoHeight = 1080;

const scale = 2;

const drawDayBG = (ctx, day) => {
	const bg = drawDefaultCanvas('DATA', videoWidth, videoHeight);
	ctx.drawImage(bg, 0, 0);

	// const text = `Day #${day}`;
	// ctx.fillStyle = '#000';
	// ctx.fillText(text, textX - 1, textY + textLineHeight - 1);
	// ctx.fillText(text, textX + 1, textY + textLineHeight + 1);
	// ctx.fillText(text, textX - 1, textY + textLineHeight + 1);
	// ctx.fillText(text, textX + 1, textY + textLineHeight - 1);
	// ctx.fillStyle = '#fff';
	// ctx.fillText(text, textX, textY + textLineHeight);
};

const backupFixelsFrame = (canvas) => {
	const backupCanvas = createCanvas(WIDTH * scale, HEIGHT * scale);
	const backupCtx = backupCanvas.getContext('2d');

	const frameX = videoWidth / 2 - WIDTH * scale / 2;
	const frameY = videoHeight / 2 - HEIGHT * scale / 2;

	backupCtx.drawImage(
		canvas,
		frameX, frameY, WIDTH * scale, HEIGHT * scale,
		0, 0, WIDTH * scale, HEIGHT * scale
	);

	return backupCanvas;
}

const drawSteps = (file, backgroundImage, width = WIDTH, height = HEIGHT, skip = 0) => {

	const canvas = createCanvas(videoWidth, videoHeight);
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	// ctx.font = `bold ${textLineHeight}px "Custom Font"`;

	drawDayBG(ctx, 1);

	const pixelsFrameX = videoWidth / 2 - width * scale / 2;
	const pixelsFrameY = videoHeight / 2 - height * scale / 2;

	if (backgroundImage !== 'NOIMAGE') {
		const firstFrameBuf = fs.readFileSync(backgroundImage);
		const firstFrame = new Image;
		firstFrame.src = firstFrameBuf;

		ctx.drawImage(firstFrame, pixelsFrameX, pixelsFrameY, width * scale, height * scale);
	}

	ctx.fillStyle = '#fff';
	ctx.fillRect(pixelsFrameX, pixelsFrameY, width * scale, height * scale);

	let i = -1;
	let frame = 0;

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	let firstPixelTime = 0;
	// let dayNumber = 0;
	
	rl.on('line', (line) => {
		i++;

		// if (i < breakLine) {
		// 	return
		// }

		const [time, name, x, y, color] = line.split(';');

		// if (Number(time) < breakTime) {
		// 	return
		// }

		if (!firstPixelTime) {
			firstPixelTime = time;
		}

		// const _dayNumber = Math.floor((time - firstPixelTime) / day);

		// if (_dayNumber !== dayNumber) {
		// 	dayNumber = _dayNumber;

		// 	console.log(`DAY #${dayNumber + 1}`);

		// 	const backup = backupFixelsFrame(canvas);

		// 	drawDayBG(ctx, dayNumber + 1);
		// 	ctx.drawImage(backup, pixelsFrameX, pixelsFrameY);
		// }

		ctx.fillStyle = color;
		ctx.fillRect(pixelsFrameX + x * scale, pixelsFrameY + y * scale, scale, scale);

		if ((i % PPF === 0 || i === skip) && i >= skip) {
			const output = __dirname + '/../frames/' + String(++frame).padStart(8, '0') + '.png';

			fs.writeFileSync(output, canvas.toBuffer());
		}

		if (i % 50_000 === 0) {
			const sec = Math.floor(frame / PPS);

			console.log(`duration: ${Math.floor(sec / 60)}:${sec % 60}, #${frame} frame, ${i} pixels`);
		}
	});

	rl.on('close', () => {
		const output = __dirname + '/../frames/' + String(++frame).padStart(8, '0') + '.png';

		fs.writeFileSync(output, canvas.toBuffer());

		const sec = Math.floor(frame / PPS);

		console.log(`Total. duration: ${Math.floor(sec / 60)}:${sec % 60}, #${frame} frame, ${i} pixels`);
	});
};

module.exports = drawSteps;
