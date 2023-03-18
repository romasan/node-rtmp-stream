const { createCanvas, Image } = require('canvas');
const fs = require('fs');

const WIDTH = 300;
const HEIGHT = 300;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, WIDTH, HEIGHT);

fs.writeFileSync('inout.png', canvas.toBuffer());
