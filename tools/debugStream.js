const fs = require('fs');
const { spawn } = require('child_process');
const { createCanvas } = require('canvas');

const INPUT_AUDIO = 'http://stream.antenne.de:80/antenne';

const debugStream = (INPUT_AUDIO, RTMP_HOST_KEY) => {
	const width = 1280;
	const height = 720;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#0000ff';
	ctx.fillRect(0, 0, width, height);
	
	// const args = `-thread_queue_size 1024 -i ${INPUT_AUDIO} -f image2pipe -r 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 2 -g 30 ${RTMP_HOST_KEY}`;
	const args = `-thread_queue_size 1024 -i ${INPUT_AUDIO} -f image2pipe -framerate 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 25 -g 30 -movflags +faststart ${RTMP_HOST_KEY}`;
	// const args = `-thread_queue_size 1024 -f image2pipe -r 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 2 -g 30 ${RTMP_HOST_KEY}`;
	const ffmpeg = spawn('ffmpeg', args.split(' '));
	
	console.log('ffmpeg ' + args);
	
	ffmpeg.stderr.pipe(process.stdout);
	
	const frame = () => {
		const color = [
			'#ffffff',
			'#000000',
			'#ff0000',
			'#00ff00',
			'#000080',
			'#ff00ff',
			'#ffff00',
			'#00ffff',
		][Math.floor(Math.random() * 8)];
		ctx.fillStyle = color;
		ctx.fillRect(100, 100, 100, 100);

		ffmpeg.stdin.write(canvas.toBuffer());
		// fs.writeFileSync('./output.png', canvas.toBuffer());
	};

	frame();

	setInterval(frame, 500);

	process.on('exit', function () {
		ffmpeg.stdin.end();
	});
};

const streamToFile = (OUTPUT, TEMPFILE) => {
	const width = 1280;
	const height = 720;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#0000ff';
	ctx.fillRect(0, 0, width, height);

	let count = 0;

	const textX = 150;
	const textY = 150;
	const textLineHeight = 70;

	const fframe = () => {
		const color = [
			'#ffffff',
			'#000000',
			'#ff0000',
			'#00ff00',
			'#000080',
			'#ff00ff',
			'#ffff00',
			'#00ffff',
		][Math.floor(Math.random() * 8)];
		ctx.fillStyle = color;
		ctx.fillRect(100, 100, 100, 100);

		const text = ++count;
		ctx.fillStyle = '#000';
		ctx.fillText(text, textX - 1, textY + textLineHeight - 1);
		ctx.fillText(text, textX + 1, textY + textLineHeight + 1);
		ctx.fillText(text, textX - 1, textY + textLineHeight + 1);
		ctx.fillText(text, textX + 1, textY + textLineHeight - 1);
		ctx.fillStyle = '#fff';
		ctx.fillText(text, textX, textY + textLineHeight);

		fs.writeFileSync(OUTPUT, canvas.toBuffer());
		// fs.renameSync(TEMPFILE, OUTPUT);
	};

	fframe();

	setInterval(fframe, 500);
};

module.exports = {
	debugStream,
	streamToFile,
};
