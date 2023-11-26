require('dotenv').config();
const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const { COLORS, videoSize } = require('./const');
const log = require('./log');
const ee = require('./lib/ee');
const { getPixelsInfo, updateStats } = require('./tools/getPixelsInfo');
const { drawDefaultCanvas } = require('./tools');
const { getAuthId } = require('./auth');

const { UPSCALE, STREAM_FREEZED_FRAME, STREAM_WITH_BG, STREAM_DEBUG_TIME } = process.env;

const conf = {
	freezed: STREAM_FREEZED_FRAME === 'true',
	withBg: STREAM_WITH_BG === 'true',
};

const getCanvasConf = () => conf;

const updateCanvasConf = (value) => {
	conf.freezed = value.freezed ?? conf.freezed;
	conf.withBg = value.withBg ?? conf.withBg;
};

let stats = {};

console.log('init canvas');

const initStats = async () => {
	const _start = Date.now();

	stats = await getPixelsInfo();

	console.log(`\nstats inited at ${((Date.now() - _start) / 1000).toFixed(1)}s.\n`);
};

initStats();

const getStats = () => stats;

const getPixelAuthor = (x, y) => {
	const key = `${x}:${y}`;
	const [
		currentTime,
		currentUuid,
		// currentColor,
		// prevColorUuid,
		// prevColorColor,
		// prevUserUuid,
		// prevUserColor,
		// count,
	] = stats?.[key] || [];

	return {
		uuid: stats?.uuids?.[currentUuid],
		time: currentTime,
	};
};

const getPixelColor = (x, y) => {
	const key = `${x}:${y}`;
	const [
		currentTime,
		currentUuid,
		currentColor,
		// prevColorUuid,
		// prevColorColor,
		// prevUserUuid,
		// prevUserColor,
		// count,
	] = stats?.[key] || [];

	return stats?.colors?.[currentColor];
};

const getTotalPixels = () => {
	return stats?.totalCount || 0;
};

const getTopLeaderboard = (count = 10, uuid) => {
	const sorted = Object.entries(stats?.leaderboard || {})
		.sort(([, a], [, b]) => a < b ? 1 : -1);
	const output = sorted
		.slice(0, count)
		.reduce((list, [id, value], index) => [
			...list,
			{
				id,
				count: value,
				place: index + 1,
			},
		], []);

		if (uuid && !output.some((item) => item.uuid === uuid)) {
			const place = sorted.findIndex(([id]) => id === (getAuthId(uuid) || uuid));

			if (place >= output.length) {
				output.push({
					id: uuid,
					count: sorted[place][1],
					place: place + 1,
				});
			}
		}

		return output;
};

const getLastActivity = () => {
	return stats?.lastActivity || 0;
};

const bg = drawDefaultCanvas('DATA', videoSize.width, videoSize.height, 'CHESS');
const bgCTX = bg.getContext('2d');

const imgBuf = fs.readFileSync(__dirname + '/../db/inout.png');
const image = new Image;
image.src = imgBuf;

const canvas = createCanvas(image.width, image.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0);

const scale = UPSCALE === 'true'
	? Math.min(
		Math.floor(videoSize.width / canvas.width),
		Math.floor(videoSize.height / canvas.height),
	)
	: (Number(UPSCALE) || 1);

let scaledCanvas = null;
let scaledCTX = null;

if (scale > 1) {
	scaledCanvas = createCanvas(image.width * scale, image.height * scale);
	scaledCTX = scaledCanvas.getContext('2d');
	scaledCTX.imageSmoothingEnabled = false;
	scaledCTX.drawImage(image, 0, 0, image.width * scale, image.height * scale);
}

const freezedCanvas = (scale > 1 && scaledCanvas)
	? createCanvas(image.width * scale, image.height * scale)
	: createCanvas(image.width, image.height);
const freezedCanvasCtx = freezedCanvas.getContext('2d');

const updateFreezedFrame = () => {
	if (scale > 1 && scaledCanvas) {
		freezedCanvasCtx.drawImage(scaledCanvas, 0, 0);
	} else {
		freezedCanvasCtx.drawImage(canvas, 0, 0);
	}
};

updateFreezedFrame();

const getCanvas = () => {
	if (conf.withBg) {
		if (conf.freezed) {
			const x = Math.floor(videoSize.width / 2 - freezedCanvas.width / 2);
			const y = Math.floor(videoSize.height / 2 - freezedCanvas.height / 2);

			bgCTX.drawImage(freezedCanvas, x, y);
		} else if (scale > 1) {
			const x = Math.floor(videoSize.width / 2 - scaledCanvas.width / 2);
			const y = Math.floor(videoSize.height / 2 - scaledCanvas.height / 2);

			bgCTX.drawImage(scaledCanvas, x, y);
		} else {
			const x = Math.floor(videoSize.width / 2 - canvas.width / 2);
			const y = Math.floor(videoSize.height / 2 - canvas.height / 2);

			bgCTX.drawImage(canvas, x, y);
		}

		return bg;
	}

	if (conf.freezed) {
		return freezedCanvas;
	}

	if (scale > 1 && scaledCanvas) {
		return scaledCanvas;
	}

	return canvas;
};

const _start = Date.now();

const getImageBuffer = () => {
	const _canvas = getCanvas();

	if (STREAM_DEBUG_TIME === 'true') {
		const _ctx = _canvas.getContext('2d');
	
		const sec = Math.floor((Date.now() - _start) / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);
	
		const time = [
			hour,
			min % 60,
			sec % 60
		].map(e => String(e).padStart(2, '0')).join(':');
	
		_ctx.font = `bold 28px "Arial"`;
		_ctx.fillStyle = '#000';
		_ctx.fillRect(10, 10, 120, 30);
		_ctx.fillStyle = '#fff';
		_ctx.fillText(time, 12, 36);
	}

	return _canvas.toBuffer();
};

const drawPix = ({ x, y, color, nickname, uuid }) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width || !COLORS[color]) {
		return;
	}

	const rawColor = COLORS[color];

	updateStats(stats, [
		Date.now(),
		nickname,
		x,
		y,
		rawColor,
		uuid,
	]);

	ctx.fillStyle = rawColor;
	ctx.fillRect(x, y, 1, 1);

	if (scale > 1 && scaledCTX) {
		scaledCTX.fillStyle = rawColor;
		scaledCTX.fillRect(x * scale, y * scale, 1 * scale, 1 * scale);
	}

	log({x, y, color: rawColor, nickname, uuid});

	// TODO update last activity for uuid (for check active online count)

	ee.emit('spam', {
		event: 'drawPix',
		payload: {
			x,
			y,
			color: rawColor,
		},
	});
};

const saveCanvas = () => {
	fs.writeFileSync(__dirname + '/../db/inout.png', canvas.toBuffer());
};

module.exports = {
	canvas,
	COLORS,
	conf,
	getCanvasConf,
	updateCanvasConf,
	updateFreezedFrame,
	drawPix,
	saveCanvas,
	getImageBuffer,
	getStats,
	getPixelColor,
	getPixelAuthor,
	getTotalPixels,
	getTopLeaderboard,
	getLastActivity,
};
