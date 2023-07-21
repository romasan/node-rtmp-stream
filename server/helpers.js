const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

const getSecret = () => {
	return Array(4).fill().map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const coolDownRanges = {
	authorized: {
		10: 1,
		50: 5,
		100: 10,
		200: 30,
		500: 60,
		1000: 60 * 3,
	},
	guest: {
		1: 60 * 3,
	},
}

const getCooldown = (token) => {
	const isAuthorized = true;
	const onlineCount = 10;
	const isFirstTime = true;

	if (isFirstTime) {
		return 0;
	}


}

module.exports = {
	getSecret,
};
