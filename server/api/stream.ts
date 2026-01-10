import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { getCanvas } from '../utils/canvas';
import { createCanvas, Image } from 'canvas';

const {
	stream: { bgImage },
} = require('../config.json');

const imgBuf = fs.readFileSync(bgImage);
const image = new Image;
image.src = imgBuf;

const rootCanvas = createCanvas(image.width, image.height);
const ctx = rootCanvas.getContext('2d');
ctx.imageSmoothingEnabled = false; 

const UPDATE_DELAY = 5_000;
const UPDATE_INTERVAL = 1_000;

let lastRequestTime = Date.now();

let buffer: Buffer = null as any;

const render = () => {
	if (Date.now() - lastRequestTime > UPDATE_DELAY) {
		return;
	}

	const canvas = getCanvas();

	if (!canvas) {
		return;
	}

	const scale = Math.min(rootCanvas.width / canvas.width, rootCanvas.height / canvas.height);
	const width = canvas.width * scale;
	const height = canvas.height * scale;
	const x = (rootCanvas.width - width) / 2;
	const y = (rootCanvas.height - height) / 2;

	ctx.drawImage(image, 0, 0);
	ctx.drawImage(canvas, x, y, width, height);

	buffer = rootCanvas.toBuffer();
};
render();

setInterval(render, UPDATE_INTERVAL);

export const getStreamFrame = (req: IncomingMessage, res: ServerResponse) => {
	lastRequestTime = Date.now();

	res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

	if (!buffer) {
		res.end(rootCanvas.toBuffer());

		return;
	}

	res.end(buffer);
};
