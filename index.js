require('dotenv').config();
const { spawn } = require('child_process');
const { createCanvas, Image } = require('canvas');
const fs = require('fs');

const { RTMP_HOST_KEY, IN_OUT_IMAGE, INPUT_AUDIO, FFMPEG_LOG } = process.env;
// const [WIDTH, HEIGHT] = SIZE.split('x').map(Number);

const imgBuf = fs.readFileSync(IN_OUT_IMAGE);
const image = new Image;
image.src = imgBuf;

const canvas = createCanvas(image.width, image.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0);

// ffmpeg -stream_loop -1 -i out.mp4 -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 15 -g 30 "rtmp://live-fra.twitch.tv/app/live_878680836_9dLuMUXgIvJ0eFLTtIkDj1SRJ5kJOi"
// + const args = `${SOUND} -f image2pipe -r 1 -i - -vcodec libx264 -pix_fmt yuv420p -preset slow -r 15 -g 30 -x264-params "no-scenecut=1" -nal-hrd cbr -f ${OUT}`.split(' ');
const args = `-i ${INPUT_AUDIO} -f image2pipe -r 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 2 -g 30 ${RTMP_HOST_KEY}`.split(' ');
const ffmpeg = spawn('ffmpeg', args);
if (FFMPEG_LOG === 'true') {
	ffmpeg.stderr.pipe(process.stdout);
}
ffmpeg.stdin.write(canvas.toBuffer());

// const pngStream = canvas.createPNGStream();
// pngStream.pipe(ffmpeg.stdin, { end: false });

const randomColor = (depth) => Math.floor(Math.random() * depth)
const random = (min, max) => (Math.random() * (max - min)) + min;

const drawRandomLine = () => {
	ctx.beginPath();
	ctx.strokeStyle = `rgb(${randomColor(255)}, ${randomColor(255)}, ${randomColor(255)})`
	ctx.moveTo(random(0, canvas.width), random(0, canvas.height));
	ctx.lineTo(random(0, canvas.width), random(0, canvas.height));
	ctx.stroke();
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

const writeCanvas = () => {
	ffmpeg.stdin.write(canvas.toBuffer());
	// fs.writeFileSync("out.png", canvas.toBuffer());
}

const frame = () => {
	// const now = Date.now();
	// drawRandomLine();
	drawRandomPix();
	writeCanvas();
	// drawFrameText();
	// console.log(`==== frame #${i} at ${Date.now() - now}ms.\n`);
}

const noop = () => {};

// setTimeout(frame, 500);
// setTimeout(frame, 1000);
// setTimeout(frame, 5000);
// setTimeout(frame, 10000);

setInterval(frame, 500);

process.on('exit', function () {
	ffmpeg.stdin.end();
});
