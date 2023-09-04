require('dotenv').config();

const { VKPLAY_HOST, VKPLAY_USER_NAME } = process.env;

const COLORS = {
	yellow: '#e2d747',
	lightgreen: '#a5dd5f',
	green: '#56ba37',
	cyan: '#5fcfdb',
	cyanblue: '#3681c1',
	blue: '#091de0',
	lightmagenta: '#c276de',
	magenta: '#77197c',
	white: '#ffffff',
	lightgray: '#e4e4e4',
	gray: '#888888',
	black: '#000000',
	pink: '#f1aacf',
	red: '#d22d1f',
	orange: '#db9834',
	brown: '#976c49',
};

const CHAT_WINDOW_LOCATION = `${VKPLAY_HOST}/${VKPLAY_USER_NAME}/only-chat`;

const countdownRanges = {
	authorized: {
		0: 1,
		10: 3,
		50: 5,
		100: 10,
		200: 30,
		500: 60,
		1000: 60 * 3,
	},
	guest: {
		0: 60 * 3,
	},
};

module.exports = {
	COLORS,
	CHAT_WINDOW_LOCATION,
	countdownRanges,
};
