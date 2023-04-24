require('dotenv').config();
const ee = require('./lib/ee');
const { drawPix, saveCanvas, COLORS } = require('./canvas');
const chat = require('./vkplay-chat-listener');
require('./ws');
const fs = require('fs');

fs.writeFileSync('./pid', process.pid.toString());

const { STREAM_ENABLE } = process.env;

if (STREAM_ENABLE == 'true') {
	require('./stream');
}

const isCommand = (command) => (value) => value.toLowerCase() === command;
const isNumber = (value) => String(Number(value)) === String(value);
const isColor = (value) => value.toLowerCase() in COLORS;
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
		});
	}

	const isJoinCommand = checkMessage(words, [isCommand('!join')]);
	if (isJoinCommand) {
		// wsJoinUser(from);
	}
}

setInterval(saveCanvas, 60 * 1000);

chat.init();
ee.on('message', handleMessage);
