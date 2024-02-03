require('dotenv').config();
const ee = require('./lib/ee');
const { drawPix, saveCanvas, COLORS } = require('./utils/canvas');
const chat = require('./utils/vkplay-chat-listener');
require('./utils/ws');
const fs = require('fs');

fs.writeFileSync(__dirname + '/../pid', process.pid.toString());

const { STREAM_ENABLE, VKPLAY_CHAT_ENABLE } = process.env;

if (STREAM_ENABLE == 'true') {
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

if (VKPLAY_CHAT_ENABLE === 'true') {
	chat.init();
}

ee.on('message', handleMessage);
