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

const countdownRanges = {
	authorized: {
		0: 0.3,
		10: 1,
		30: 2,
		50: 5,
		100: 10,
		200: 30,
		500: 60,
		1000: 60 * 3,
	},
	guest: {
		0: 3,
		5: 5,
		10: 10,
		100: 60,
		500: 60 * 3,
	},
};

const videoSize = {
	width: 1280, // 1920
	height: 720, // 1080
};

module.exports = {
	COLORS,
	countdownRanges,
	videoSize,
};
