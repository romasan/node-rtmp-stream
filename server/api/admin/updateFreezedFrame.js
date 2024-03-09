const { updateFreezedFrame: updateFreezedFrameTool } = require('../../utils/canvas');
const updateFreezedFrame = (req, res) => {
	updateFreezedFrameTool();

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};

module.exports = {
	updateFreezedFrame,
};
