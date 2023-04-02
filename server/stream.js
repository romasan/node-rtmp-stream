require('dotenv').config();
const { spawn } = require('child_process');

const { RTMP_HOST_KEY, INPUT_AUDIO, FFMPEG_LOG } = process.env;

const { getImageBuffer } = require('./canvas');

const args = `-thread_queue_size 1024 -i ${INPUT_AUDIO} -f image2pipe -r 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 2 -g 30 ${RTMP_HOST_KEY}`.split(' ');
const ffmpeg = spawn('ffmpeg', args);
if (FFMPEG_LOG === 'true') {
	ffmpeg.stderr.pipe(process.stdout);
}

const writeCanvas = () => {
	ffmpeg.stdin.write(getImageBuffer());
}

writeCanvas();

const frame = () => {
	writeCanvas();
}

setInterval(frame, 500);

process.on('exit', function () {
	ffmpeg.stdin.end();
});
