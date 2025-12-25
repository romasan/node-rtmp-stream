/**
 * canvas полотно
 */

import fs from 'fs';
import { createCanvas, Image, Canvas, CanvasRenderingContext2D } from 'canvas';
import { pixelsLog } from './pixels';
import { updateStats } from './stats';
import { spam } from './ws';
import { getExpand } from './expands';
import { IPixel } from '../types';

const {
	stream: { videoSize, upscale, freezedFrame, debugTime },
} = require('../config.json');

// TODO use one storage for values db/values.json
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
		const expand = getExpand();

		canvas = createCanvas(expand.width, expand.height);
		ctx = canvas.getContext('2d');
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, expand.width, expand.height);

		fs.writeFileSync(file, canvas.toBuffer());

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
	const { shiftX, shiftY } = getExpand();

	if (
		x < -shiftX ||
		y < -shiftY ||
		x > (canvas.width - shiftX) ||
		y > (canvas.width - shiftY)
	) {
		return;
	}

	updateStats({
		time: Date.now(),
		area,
		x,
		y,
		color,
		uuid,
		ip,
		nickname,
	});

	ctx.fillStyle = color;
	ctx.fillRect(x + shiftX, y + shiftY, 1, 1);

	if (scale > 1 && scaledCTX) {
		scaledCTX.fillStyle = color;
		scaledCTX.fillRect(
			(x + shiftX) * scale,
			(y + shiftY) * scale,
			1 * scale,
			1 * scale
		);
	}

	pixelsLog({ x, y, color, area, nickname, uuid, ip });

	spam({
		event: 'drawPix',
		payload: {
			x,
			y,
			color,
		},
	});
};

export const expandCanvas = (width: number, height: number, shiftX: number, shiftY: number) => {
	const image = new Image;

	image.src = canvas.toBuffer();
	canvas = createCanvas(Number(width), Number(height));
	ctx = canvas.getContext('2d');
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, Number(width), Number(height));
	ctx.drawImage(image, Number(shiftX), Number(shiftY));

	saveCanvas();
};

export const saveCanvas = () => {
	if (!fs.existsSync(file)) {
		return;
	}

	fs.writeFileSync(file, canvas.toBuffer());
};
