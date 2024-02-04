const ee = require('./lib/ee');
const { drawPix, saveCanvas, COLORS } = require('./utils/canvas');
// const chat = require('./utils/vkplay-chat-listener');
const fs = require('fs');
require('./utils/ws');

fs.writeFileSync(__dirname + '/../pid', process.pid.toString());

const { stream } = require('./config.json');

if (stream.enable) {
	require('./utils/stream');
}

const isCommand = (command) => (value) => value.toLowerCase() === command;
const isNumber = (value) => String(Number(value)) === String(value);
const isColor = (value) => value.toLowerCase() in COLORS;
const isHEXColor = (value) => value.toUpperCase().match(/^#([1-9A-F]{3}|[1-9A-F]{3})$/);
const checkMessage = (words, validations) => validations.every((cb, index) => cb(words[index]));

const handleMessage = ({ from, text }) => {
	const words = text.split(/[\s\n]+/ig);

	const isDrawCommand = checkMessage(words, [isCommand('!pix'), isNumber, isNumber, isColor]);
	if (isDrawCommand) {
		const [, x, y, color] = words;
		drawPix({
			x: Number(x),
			y: Number(y),
			color,
			nickname: from,
			uuid: '',
		});
	}

	const isJoinCommand = checkMessage(words, [isCommand('!join')]);
	if (isJoinCommand) {
		// wsJoinUser(from);
	}
}

setInterval(saveCanvas, 60 * 1000);

ee.on('message', handleMessage);
