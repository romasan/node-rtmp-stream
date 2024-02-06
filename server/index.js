const { saveCanvas } = require('./utils/canvas');
require('./utils/ws');

const { stream } = require('./config.json');

if (stream.enable) {
	require('./utils/stream');
}

setInterval(saveCanvas, 60 * 1000);
