require('dotenv').config();
const { spawn } = require('child_process');

const { RTMP_HOST_KEY, INPUT_AUDIO, FFMPEG_LOG } = process.env;

const { getImageBuffer } = require('./canvas');

// ffmpeg -re -i - -stream_loop -1 -i audio.mp3 -c:v libx264 -preset veryfast -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p -g 60 -c:a aac -b:a 128k -ac 2 -ar 44100 -f flv rtmp://live.twitch.tv/app/{stream key}
// const args = `-re -i - -stream_loop -1 -i ${INPUT_AUDIO} -c:v libx264 -preset veryfast -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p -g 60 -c:a aac -b:a 128k -ac 2 -ar 44100 -f flv ${RTMP_HOST_KEY}`.args.split(' ')
const args = `-thread_queue_size 1024 -i ${INPUT_AUDIO} -f image2pipe -r 2 -i - -f flv -vcodec libx264 -pix_fmt yuv420p -preset slow -r 2 -g 30 ${RTMP_HOST_KEY}`;
const ffmpeg = spawn('ffmpeg', args.split(' '));
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
