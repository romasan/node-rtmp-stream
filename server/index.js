const fs = require('fs');
const { initStreamCanvas, initStats, saveCanvas, getImageBuffer } = require('./utils/canvas');
const { initServer } = require('./utils/ws');
const { webServerHandler } = require('./api');
const { stream } = require('./config.json');

initStreamCanvas();
initStats();

if (stream.enable) {
	require('./utils/stream');
}

if (stream.file && stream.interval) {
	setInterval(() => {
		fs.writeFileSync(stream.file, getImageBuffer());
	}, Number(stream.interval));
}

initServer(webServerHandler);

setInterval(saveCanvas, 60 * 1000);
