const { spawn } = require('child_process');
const fs = require('fs');

const { stream: { rtmpHostKey, inputAudio, FFMPEGLog, streamFile, interval } } = require('../config.json');

const { getImageBuffer } = require('./canvas');

const args = `-thread_queue_size 1024 -i ${inputAudio} -f image2pipe -framerate 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 25 -g 30 -movflags +faststart ${rtmpHostKey}`;
const ffmpeg = streamFile ? null : spawn('ffmpeg', args.split(' '));

if (FFMPEGLog && !streamFile) {
	try {
		ffmpeg.stderr.pipe(process.stdout);
	} catch (error) {
		console.log('Error:', error);
	}
}

const writeCanvas = () => {
	if (streamFile) {
		fs.writeFileSync(streamFile, getImageBuffer());
	} else {
		ffmpeg.stdin.write(getImageBuffer());
	}
};

writeCanvas();

const frame = () => {
	// TODO check has changes
	writeCanvas();
};

setInterval(frame, interval ? Number(interval) : 500);

process.on('exit', function () {
	ffmpeg?.stdin.end();
});
