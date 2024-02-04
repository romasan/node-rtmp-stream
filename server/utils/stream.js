const { spawn } = require('child_process');

const { rtmpHostKey, inputAudio, FFMPEGLog } = require('../config.json');

const { getImageBuffer } = require('./canvas');

const args = `-thread_queue_size 1024 -i ${inputAudio} -f image2pipe -framerate 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 25 -g 30 -movflags +faststart ${rtmpHostKey}`;
const ffmpeg = spawn('ffmpeg', args.split(' '));

if (FFMPEGLog) {
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
