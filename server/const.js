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

/*
const COLORS = {
	deepcarmine: '#ae233d',
	flame: '#ec5427',
	yelloworange: '#f4ab3c',
	naplesyellow: '#f9d759',
	mediumseagreen: '#48a06d',
	emerald: '#5cc87f',
	inchworm: '#9ae96c',
	myrtlegreen: '#317270',
	verdigris: '#469ca8',
	cyancobaltblue: '#2d519e',
	unitednationsblue: '#4d90e3',
	mediumskyblue: '#7ee6f2',
	oceanblue: '#4440ba',
	VeryLightBlue: '#6662f6',
	grape: '#772b99',
	purpleplum: '#a754ba',
	darkpink: '#eb4e81',
	mauvelous: '#f19eab',
	coffee: '#684a34',
	coconut: '#956a34',
	black: '#000000',
	philippinegray: '#898d90',
	lightsilver: '#d5d7d9',
	white: '#ffffff',
};
*/

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

const tempBans = {
	uuid: {
		"0309fb36-a56a-4a42-8003-d8eafb8fbcf9": true,
	},
	nick: {
		"foo_bar": true,
	},
	ip: {
		"1.2.3.4": true,
	},
};

module.exports = {
	COLORS,
	countdownRanges,
	videoSize,
	tempBans,
};
