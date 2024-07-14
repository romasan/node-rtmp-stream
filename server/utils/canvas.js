/**
 * canvas полотно
 */

const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const { pixelsLog } = require('./pixels');
const { updateStats } = require('./stats');
const {
	colorShemes: { COLORS },
	stream: { videoSize, upscale, freezedFrame, withBg, debugTime },
} = require('../config.json');
const { spam } = require('../utils/ws');

const conf = {
	freezed: freezedFrame,
	withBg: withBg,
};

let scale = 1;
let canvas,
	ctx,
	freezedCanvas,
	freezedCanvasCtx,
	scaledCanvas,
	scaledCTX,
	bg,
	bgCTX;

const _start = Date.now();

const getCanvas = () => canvas;

const getCanvasConf = () => conf;

const updateCanvasConf = (value) => {
	conf.freezed = value.freezed ?? conf.freezed;
	conf.withBg = value.withBg ?? conf.withBg;
};

const drawBGCanvas = (width, height, mode = 'RANDOM') => { // WHITE, RANDOM, CHESS, CHESSX, TEXT
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

	return canvas;
};

const initStreamCanvas = () => {
	bg = drawBGCanvas(videoSize.width, videoSize.height, 'CHESS');
	bgCTX = bg.getContext('2d');

	const imgBuf = fs.readFileSync(__dirname + '/../../db/inout.png');
	const image = new Image;
	image.src = imgBuf;

	canvas = createCanvas(image.width, image.height);
	ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);

	scale = (typeof upscale === 'boolean' && upscale)
		? Math.min(
			Math.floor(videoSize.width / canvas.width),
			Math.floor(videoSize.height / canvas.height),
		)
		: typeof upscale === 'number'
			? upscale
			: 1;

	if (scale > 1) {
		scaledCanvas = createCanvas(image.width * scale, image.height * scale);
		scaledCTX = scaledCanvas.getContext('2d');
		scaledCTX.imageSmoothingEnabled = false;
		scaledCTX.drawImage(image, 0, 0, image.width * scale, image.height * scale);
	}

	freezedCanvas = (scale > 1 && scaledCanvas)
		? createCanvas(image.width * scale, image.height * scale)
		: createCanvas(image.width, image.height);
	freezedCanvasCtx = freezedCanvas.getContext('2d');

	updateFreezedFrame();
};

const updateFreezedFrame = () => {
	if (scale > 1 && scaledCanvas) {
		freezedCanvasCtx?.drawImage(scaledCanvas, 0, 0);
	} else {
		freezedCanvasCtx?.drawImage(canvas, 0, 0);
	}
};

const getStreamFrame = () => {
	if (conf.withBg) {
		if (conf.freezed) {
			const x = Math.floor(videoSize.width / 2 - freezedCanvas?.width / 2);
			const y = Math.floor(videoSize.height / 2 - freezedCanvas?.height / 2);

			bgCTX?.drawImage(freezedCanvas, x, y);
		} else if (scale > 1) {
			const x = Math.floor(videoSize.width / 2 - scaledCanvas.width / 2);
			const y = Math.floor(videoSize.height / 2 - scaledCanvas.height / 2);

			bgCTX?.drawImage(scaledCanvas, x, y);
		} else {
			const x = Math.floor(videoSize.width / 2 - canvas.width / 2);
			const y = Math.floor(videoSize.height / 2 - canvas.height / 2);

			bgCTX?.drawImage(canvas, x, y);
		}

		return bg;
	}

	if (conf.freezed) {
		return freezedCanvas;
	}

	if (scale > 1 && scaledCanvas) {
		return scaledCanvas;
	}

	return canvas;
};

const getImageBuffer = () => {
	const _canvas = getStreamFrame();

	if (debugTime) {
		const _ctx = _canvas.getContext('2d');
	
		const sec = Math.floor((Date.now() - _start) / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);
	
		const time = [
			hour,
			min % 60,
			sec % 60
		].map(e => String(e).padStart(2, '0')).join(':');
	
		_ctx.font = 'bold 28px "Arial"';
		_ctx.fillStyle = '#000';
		_ctx.fillRect(10, 10, 120, 30);
		_ctx.fillStyle = '#fff';
		_ctx.fillText(time, 12, 36);
	}

	return _canvas.toBuffer();
};

const drawPix = ({ x, y, color, nickname, uuid, ip, area }) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width || !COLORS[color]) {
		return;
	}

	const rawColor = COLORS[color];

	updateStats([
		Date.now(),
		area,
		x,
		y,
		rawColor,
		uuid,
		ip,
		nickname,
	]);

	ctx.fillStyle = rawColor;
	ctx.fillRect(x, y, 1, 1);

	if (scale > 1 && scaledCTX) {
		scaledCTX.fillStyle = rawColor;
		scaledCTX.fillRect(x * scale, y * scale, 1 * scale, 1 * scale);
	}

	pixelsLog({ x, y, color: rawColor, area, nickname, uuid, ip });

	spam({
		event: 'drawPix',
		payload: {
			x,
			y,
			color: rawColor,
		},
	});
};

const saveCanvas = () => {
	fs.writeFileSync(__dirname + '/../../db/inout.png', canvas.toBuffer());
};

module.exports = {
	initStreamCanvas,
	getCanvas,
	getCanvasConf,
	updateCanvasConf,
	updateFreezedFrame,
	drawPix,
	saveCanvas,
	getImageBuffer,
	drawBGCanvas,
};
