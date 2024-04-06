const fs = require('fs');
const { saveCanvas, getImageBuffer } = require('./utils/canvas');
const { onConnect } = require('./utils/ws');
const { webServerHandler } = require('./api');
const { stream } = require('./config.json');

if (stream.enable) {
	require('./utils/stream');
}

if (stream.file && stream.interval) {
	setInterval(() => {
		fs.writeFileSync(stream.file, getImageBuffer());
	}, Number(stream.interval));
}

onConnect(webServerHandler);

setInterval(saveCanvas, 60 * 1000);
