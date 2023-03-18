require('dotenv').config();
const fs = require('fs');
const { createCanvas, Image } = require('canvas');

const { IN_OUT_IMAGE } = process.env;

const COLORS = {
	yellow: '#e2d747',
	lightgreen: '#a5dd5f',
	green: '#56ba37',
	cyan: '#5fcfdb',
	cyanblue: '#3681c1',
	blue: '#091de0',
	lightmagenta: '#c276de',
	magenta: '$77197c',
	white: '#ffffff',
	lightgray: '#e4e4e4',
	gray: '#888888',
	black: '#000000',
	pink: '#f1aacf',
	red: '#d22d1f',
	orange: '#db9834',
	brown: '976c49',
};

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

const drawPix = (x, y, color) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width) {
		return;
	}
	ctx.fillStyle = COLORS[color];
	ctx.fillRect(x, y, 1, 1);
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
