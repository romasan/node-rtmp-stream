/**
 * управление стримом
 */

import { spawn } from 'child_process';
import fs from 'fs';
import { Log } from './log';
import { getImageBuffer } from './canvas';

const { stream: { rtmpHostKey, inputAudio, FFMPEGLog, streamFile, streamFilePath, interval } } = require('../config.json');

const args = `-thread_queue_size 1024 -i ${inputAudio} -f image2pipe -framerate 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 25 -g 30 -movflags +faststart ${rtmpHostKey}`;
const ffmpeg = streamFile ? null : spawn('ffmpeg', args.split(' '));

if (FFMPEGLog && !streamFile) {
	try {
		ffmpeg?.stderr.pipe(process.stdout);
	} catch (error) {
		Log('Error:', error);
	}
}

let onTransaction = false;

let index = 1;

const writeCanvas = () => {
	if (streamFile) {
		const buf = getImageBuffer();

		index = index === 1 ? 2 : 1;

		if (buf) {
			onTransaction = true;
			// fs.writeFileSync(streamFile, buf);
			const now = Date.now();
			fs.writeFile(streamFilePath + 'output.tmp', buf, () => {
			// fs.writeFile(streamFilePath + 'output.tmp', buf, () => {
				onTransaction = false;
				// fs.rename(streamFile + '.tmp', streamFile, () => {});
				fs.rename(streamFilePath + 'output.tmp', streamFilePath + index + '.png', () => {});
				// fs.rename(streamFilePath + 'output.tmp', streamFilePath + '000' + index + '.png', () => {});
			});
		}
	} else {
		ffmpeg?.stdin.write(getImageBuffer());
	}
};

writeCanvas();

const frame = () => {
	// TODO check has changes
	if (!onTransaction) {
		writeCanvas();
	}
};

setInterval(frame, interval ? Number(interval) : 500);

process.on('exit', function () {
	ffmpeg?.stdin.end();
});
