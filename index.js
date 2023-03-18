require('dotenv').config();
const { spawn } = require('child_process');
const ee = require('./ee');
const { canvas, drawPix, saveCanvas, COLORS } = require('./canvas');
const chat = require('./chat');

const { RTMP_HOST_KEY, INPUT_AUDIO, FFMPEG_LOG } = process.env;

const args = `-i ${INPUT_AUDIO} -f image2pipe -r 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 2 -g 30 ${RTMP_HOST_KEY}`.split(' ');
const ffmpeg = spawn('ffmpeg', args);
if (FFMPEG_LOG === 'true') {
	ffmpeg.stderr.pipe(process.stdout);
}
ffmpeg.stdin.write(canvas.toBuffer());

const writeCanvas = () => {
	ffmpeg.stdin.write(canvas.toBuffer());
}

const frame = () => {
	writeCanvas();
}

setInterval(frame, 500);
setInterval(saveCanvas, 60 * 1000);

chat.init();

process.on('exit', function () {
	ffmpeg.stdin.end();
});

const isPixCommand = (value) => value.toLowerCase() === '!pix';
const isNumber = (value) => String(Number(value)) === String(value);
const isColor = (value) => value.toLowerCase() in COLORS;

const handleMessage = ({ from, text }) => {
	const words = text.split(/[\s\n]+/ig);
	const isValid = [isPixCommand, isNumber, isNumber, isColor].every((cb, index) => cb(words[index]));
	if (isValid) {
		const [, x, y, color] = words;
		drawPix(Number(x), Number(y), color);
	}
}

ee.on('ws:message', handleMessage);
