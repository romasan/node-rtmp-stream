const { saveCanvas } = require('./utils/canvas');
const { onConnect } = require('./utils/ws');
const { webServerHandler } = require('./api');
const { stream } = require('./config.json');

if (stream.enable) {
	require('./utils/stream');
}

onConnect(webServerHandler);

setInterval(saveCanvas, 60 * 1000);
