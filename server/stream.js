require('dotenv').config();
const { spawn } = require('child_process');

const { RTMP_HOST_KEY, INPUT_AUDIO, FFMPEG_LOG } = process.env;

const { getImageBuffer } = require('./canvas');

const args = `-thread_queue_size 1024 -i ${INPUT_AUDIO} -f image2pipe -framerate 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 25 -movflags +faststart ${RTMP_HOST_KEY}`;
const ffmpeg = spawn('ffmpeg', args.split(' '));

if (FFMPEG_LOG === 'true') {
	try {
		ffmpeg.stderr.pipe(process.stdout);
	} catch (error) {
		console.log('Error:', error);
	}
}

const writeCanvas = () => {
	ffmpeg.stdin.write(getImageBuffer());
};

writeCanvas();

const frame = () => {
	// check has changes
	writeCanvas();
};

setInterval(frame, 500);

process.on('exit', function () {
	ffmpeg.stdin.end();
});
