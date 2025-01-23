/**
 * каждые N пикселей сохраняет кадр в файл
 */

const fs = require('fs');
const readline = require('readline');
const Progress = require('cli-progress');
const { createCanvas, Image, registerFont } = require('canvas');
// const { drawBGCanvas } = require('../utils/canvas');
// const { getFileLinesCount } = require('../helpers');

const getFileLinesCount = (file) => new Promise((resolve) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	let count = 0;

	rl.on('line', () => {
		count++;
	});

	rl.on('close', () => {
		resolve(count);
	});
});

registerFont(__dirname + '/../../assets/fonts/CustomFont.ttf', { family: 'Custom Font' });

const PPF = 100; // 300;
const FPS = 25;
const PPS = PPF * FPS;

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;

const textX = 1500;
const textY = 1000;
const textLineHeight = 70;

const videoWidth = 1080; // 1920;
const videoHeight = 720; // 1080;

// ffmpeg -r 25 -i %08d.png -vf "scale=1280:720" -c:v libx264 -c:a aac -shortest output.mp4

// const scale = 2;

const breakLine = Infinity;

// const drawDayBG = (ctx, day) => {
// 	const bg = drawBGCanvas(videoWidth, videoHeight);
// 	ctx.drawImage(bg, 0, 0);

// 	const text = `Day #${day}`;
// 	ctx.fillStyle = '#000';
// 	ctx.fillText(text, textX - 1, textY + textLineHeight - 1);
// 	ctx.fillText(text, textX + 1, textY + textLineHeight + 1);
// 	ctx.fillText(text, textX - 1, textY + textLineHeight + 1);
// 	ctx.fillText(text, textX + 1, textY + textLineHeight - 1);
// 	ctx.fillStyle = '#fff';
// 	ctx.fillText(text, textX, textY + textLineHeight);
// };

const backupCanvas = (canvas) => {
	const backupCanvas = createCanvas(canvas.width, canvas.height);
	const backupCtx = backupCanvas.getContext('2d');

	backupCtx.drawImage(canvas, 0, 0);

	return backupCanvas;
};

const gradientAnimation = (ctx, width, height) => {
	const circlesNum = 40;
	const minRadius  = 400;
	const maxRadius  = 400;
	const speed      = .02;

	const circles = [];
	for (let i = 0 ; i < circlesNum ; ++i) {
		circles.push(circle(width, height, minRadius, maxRadius));
	}

	return () => {
		ctx.clearRect(0, 0, width, height);
		circles.forEach(circle => circle(ctx, speed));
	};
};

const circle = (w, h, minR, maxR) => {
	let x = Math.random() * w;
	let y = Math.random() * h;
	let angle  = Math.random() * Math.PI * 2;
	const radius = Math.random() * (maxR - minR) + minR;
	const firstColor  = `hsla(${Math.random() * 360}, 100%, 50%, 1)`;
	const secondColor = `hsla(${Math.random() * 360}, 100%, 50%, 0)`;
	return (ctx, speed) => {
		angle += speed;
		const _x = x + Math.cos(angle) * 200;
		const _y = y + Math.sin(angle) * 200;
		const gradient = ctx.createRadialGradient(_x, _y, 0, _x, _y, radius);
					gradient.addColorStop(0, firstColor);
					gradient.addColorStop(1, secondColor);

		ctx.globalCompositeOperation = `overlay`;
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(_x, _y, radius, 0, Math.PI * 2);
		ctx.fill(); 
	};
};

const drawEpisode = async (ep, bg, firstFrame) => {
	console.log('Start draw episode', ep);

	const pixelsFile = `${__dirname}/../../db/${ep !== 'CURRENT' ? `archive/${ep}/` : ''}pixels.log`;
	const expandsFile = `${__dirname}/../../db/${ep !== 'CURRENT' ? `archive/${ep}/` : ''}expands.log`;
	const expands = fs.readFileSync(expandsFile)
		.toString()
		.split('\n')
		.map((line) => line.split(';'));
	const length = breakLine < Infinity ? breakLine : await getFileLinesCount(pixelsFile);
	const bar = new Progress.Bar();
	const canvas = createCanvas(videoWidth, videoHeight);
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	const drawFrameBg = bg === 'NOBG' ? () => {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, videoWidth, videoHeight);
	} : gradientAnimation(ctx, videoWidth, videoHeight);

	let part = 0;
	let nextPartStartTime = expands[part + 1] ? Number(expands[part + 1][0]) : Infinity;
	let width = Number(expands[part][2]);
	let height = Number(expands[part][3]);
	let scale = Math.min(
		Math.floor(videoWidth / width),
		Math.floor(videoHeight / height),
	);
	let pixelsFrameX = videoWidth / 2 - width * scale / 2;
	let pixelsFrameY = videoHeight / 2 - height * scale / 2;

	const startTime = Date.now();

	const mcanvas = createCanvas(Number(width), Number(height));
	const mctx = mcanvas.getContext('2d');

	bar.start(length, 0);

	mctx.fillStyle = '#fff';
	mctx.fillRect(0, 0, width, height);

	if (firstFrame) {
		const imgBuf = fs.readFileSync(firstFrame);
		const image = new Image;

		image.src = imgBuf;
		mctx.drawImage(image, 0, 0);
	}

	let i = -1;
	let frame = 0;

	const rl = readline.createInterface({
		input: fs.createReadStream(pixelsFile),
		crlfDelay: Infinity,
	});

	rl.on('line', (line) => {
		i++;

		bar.update(i);

		if (i >= breakLine) {
			return;
		}

		const [time, name, x, y, color] = line.split(';');

		if (Number(time) >= nextPartStartTime) {
			// backup
			const backupImage = backupCanvas(mcanvas);

			part++;
			nextPartStartTime = expands[part + 1] ? Number(expands[part + 1][0]) : Infinity;
			width = Number(expands[part][2] || width);
			height = Number(expands[part][3] || height);
			scale = Math.min(
				Math.floor(videoWidth / width),
				Math.floor(videoHeight / height),
			);
			pixelsFrameX = videoWidth / 2 - width * scale / 2;
			pixelsFrameY = videoHeight / 2 - height * scale / 2;

			// clear
			mcanvas.width = width;
			mcanvas.height = height;
			mctx.fillStyle = '#fff';
			mctx.fillRect(0, 0, width, height);

			// restore
			mctx.drawImage(backupImage, 0, 0);
		}

		mctx.fillStyle = color;
		mctx.fillRect(x, y, 1, 1);

		if (i % PPF === 0) {
			drawFrameBg();
			ctx.globalCompositeOperation = 'source-over';
			ctx.drawImage(mcanvas, 0, 0, width, height, pixelsFrameX, pixelsFrameY, width * scale, height * scale);

			const output = __dirname + '/../frames/' + String(++frame).padStart(8, '0') + '.png';

			fs.writeFileSync(output, canvas.toBuffer());
		}

		// if (i % 50_000 === 0) {
		// 	console.log(`#${frame} frame, ${i} pixels`);
		// }
	});

	rl.on('close', () => {
		bar.stop();
		drawFrameBg();
		ctx.globalCompositeOperation = 'source-over';
		ctx.drawImage(mcanvas, 0, 0, width, height, pixelsFrameX, pixelsFrameY, width * scale, height * scale);

		const output = __dirname + '/../frames/' + String(++frame).padStart(8, '0') + '.png';

		fs.writeFileSync(output, canvas.toBuffer());

		const sec = Math.floor(frame / FPS);
		const finalInTime = Math.floor(Date.now() - startTime);

		console.log(`Done in ${Math.floor(finalInTime / 60)}:${finalInTime % 60}`)
		console.log(`Total duration: ${Math.floor(sec / 60)}:${sec % 60}, ${frame} frames, ${i} pixels`);
	});
};

module.exports = {
	drawEpisode,
};
