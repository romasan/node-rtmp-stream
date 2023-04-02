require('dotenv').config();
const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const { COLORS } = require('./const');
const log = require('./log');
const ee = require('./lib/ee');

const { IN_OUT_IMAGE } = process.env;

const imgBuf = fs.readFileSync(IN_OUT_IMAGE);
const image = new Image;
image.src = imgBuf;

const canvas = createCanvas(image.width, image.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0);

const randomColor = (depth) => Math.floor(Math.random() * depth)
const random = (min, max) => (Math.random() * (max - min)) + min;

const drawRandomLine = () => {
	ctx.beginPath();
	ctx.strokeStyle = `rgb(${randomColor(255)}, ${randomColor(255)}, ${randomColor(255)})`
	ctx.moveTo(random(0, canvas.width), random(0, canvas.height));
	ctx.lineTo(random(0, canvas.width), random(0, canvas.height));
	ctx.stroke();
}

const drawPix = ({x, y, color, nickname}) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width || !COLORS[color]) {
		return;
	}

	const rawColor = COLORS[color];

	ctx.fillStyle = rawColor;
	ctx.fillRect(x, y, 1, 1);
	log({x, y, color: rawColor, nickname});
	ee.emit('spam', {
		event: 'drawPix',
		payload: {
			x,
			y,
			color: rawColor,
		},
	});
}

const drawRandomPix = () => {
	ctx.fillStyle = `rgb(${randomColor(255)}, ${randomColor(255)}, ${randomColor(255)})`
	ctx.fillRect(random(0, canvas.width), random(0, canvas.height), 1, 1);
}

let i = 0;
const drawFrameText = () => {
	ctx.fillStyle = '#ff0000';
	ctx.fillRect(5, 5, 500, 60);

	ctx.font = '48px serif';
	ctx.fillStyle = '#ffffff';
	const [m, s, ms] = ['getMinutes', 'getSeconds', 'getMilliseconds'].map((key) => String(new Date()[key]()).padStart(2, 0));
	ctx.fillText(`Frame: ${i} - ${m}:${s}:${ms}`, 10, 50);
	i++;
}

const saveCanvas = () => {
	fs.writeFileSync(IN_OUT_IMAGE, canvas.toBuffer());
}

module.exports = {
	canvas,
	COLORS,
	drawPix,
	drawRandomLine,
	drawRandomPix,
	drawFrameText,
	saveCanvas,
};
