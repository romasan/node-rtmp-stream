require('dotenv').config();
const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const { COLORS } = require('./const');
const log = require('./log');
const ee = require('./lib/ee');

const { IN_OUT_IMAGE, UPSCALE } = process.env;

const scale = Number(UPSCALE) || 1;

const imgBuf = fs.readFileSync(IN_OUT_IMAGE);
const image = new Image;
image.src = imgBuf;

const canvas = createCanvas(image.width, image.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0);

let scaledCanvas = null;
let scaledCTX = null;

// scale = Math.min(
// 	Math.floor(background.width / canvas.width),
// 	Math.floor(background.height / canvas.height),
// );

if (scale > 1) {
	scaledCanvas = createCanvas(image.width * scale, image.height * scale);
	scaledCTX = scaledCanvas.getContext('2d');
	scaledCTX.imageSmoothingEnabled = false;
	scaledCTX.drawImage(image, 0, 0, image.width * scale, image.height * scale);

	// add background like ZX Spectrum but squares
}

const getImageBuffer = () => {
	if (scale > 1 && scaledCanvas) {
		return scaledCanvas.toBuffer();
	}

	// if (FREEZE_STREAM_FRAME) {
	// 	return freezeCanvas.toBuffer();
	// }

	return canvas.toBuffer();
}

const drawPix = ({ x, y, color, nickname, uuid }) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width || !COLORS[color]) {
		return;
	}

	const rawColor = COLORS[color];

	ctx.fillStyle = rawColor;
	ctx.fillRect(x, y, 1, 1);

	if (scale > 1 && scaledCTX) {
		scaledCTX.fillStyle = rawColor;
		scaledCTX.fillRect(x * scale, y * scale, 1 * scale, 1 * scale);
	}

	log({x, y, color: rawColor, nickname, uuid});

	ee.emit('spam', {
		event: 'drawPix',
		payload: {
			x,
			y,
			color: rawColor,
		},
	});
}

const saveCanvas = () => {
	fs.writeFileSync(IN_OUT_IMAGE, canvas.toBuffer());
}

module.exports = {
	canvas,
	COLORS,
	drawPix,
	saveCanvas,
	getImageBuffer,
};
