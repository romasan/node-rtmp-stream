const validateToken = (token) => {
	return typeof token === 'string' && token.match(/^[0-9a-f][0-9a-f\-]{35}$/);
};

module.exports = {
	validateToken,
};
