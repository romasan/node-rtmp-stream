/**
 * canvas полотно
 */

import fs from 'fs';
import { createCanvas, Image, Canvas, CanvasRenderingContext2D } from 'canvas';
import { pixelsLog } from './pixels';
import { updateStats } from './stats';
import { spam } from '../utils/ws';
import { IPixel } from '../types';

const {
	colorShemes: { COLORS },
	stream: { videoSize, upscale, freezedFrame, withBg, debugTime },
} = require('../config.json');

const conf = {
	freezed: freezedFrame,
};

let scale = 1;
let canvas: Canvas;
let ctx: CanvasRenderingContext2D;
let freezedCanvas: Canvas;
let freezedCanvasCtx: CanvasRenderingContext2D;
let scaledCanvas: Canvas;
let scaledCTX: CanvasRenderingContext2D;

const _start = Date.now();

export const getCanvas = () => canvas;

export const getCanvasConf = () => conf;

export const updateCanvasConf = (value: {
	freezed: boolean;
}) => {
	conf.freezed = value.freezed ?? conf.freezed;
};

const file = __dirname + '/../../db/inout.png';

export const initStreamCanvas = () => {
	if (!fs.existsSync(file)) {
		return;
	}

	const imgBuf = fs.readFileSync(file);
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

export const updateFreezedFrame = () => {
	if (scale > 1 && scaledCanvas) {
		freezedCanvasCtx?.drawImage(scaledCanvas, 0, 0);
	} else {
		freezedCanvasCtx?.drawImage(canvas, 0, 0);
	}
};

const getStreamFrame = () => {
	if (conf.freezed) {
		return freezedCanvas;
	}

	if (scale > 1 && scaledCanvas) {
		return scaledCanvas;
	}

	return canvas;
};

export const getImageBuffer = () => {
	const _canvas = getStreamFrame();

	if (debugTime) {
		const tmpImage = new Image;

		tmpImage.src = _canvas.toBuffer();

		const tmpCanvas = createCanvas(tmpImage.width, tmpImage.height);
		const tmpCtx = tmpCanvas.getContext('2d');
		tmpCtx.drawImage(tmpImage, 0, 0);

		const sec = Math.floor((Date.now() - _start) / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);

		const time = [
			hour,
			min % 60,
			sec % 60
		].map(e => String(e).padStart(2, '0')).join(':');

		tmpCtx.font = '18px "Arial"';
		tmpCtx.fillStyle = '#000';
		tmpCtx.fillRect(10, 10, 80, 30);
		tmpCtx.fillStyle = '#fff';
		tmpCtx.fillText(time, 12, 30);

		return tmpCanvas?.toBuffer();
	}

	return _canvas?.toBuffer();
};

export const drawPix = ({ x, y, color, nickname, uuid, ip, area }: IPixel) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width || !COLORS[color]) {
		return;
	}

	const rawColor = COLORS[color];

	updateStats({
		time: Date.now(),
		area,
		x,
		y,
		color: rawColor,
		uuid,
		ip,
		nickname,
	});

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

export const saveCanvas = () => {
	if (!fs.existsSync(file)) {
		return;
	}

	fs.writeFileSync(file, canvas.toBuffer());
};
