const parseCookies = (cookies = '') => {
	return cookies
		.split(';')
		.map((item) => item.split('='))
		.reduce((list, [key, value]) => ({ ...list, [key?.trim()]: value?.trim() }), {});
};

module.exports = {
	parseCookies,
};
