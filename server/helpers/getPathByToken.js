const validateToken = require('./validateToken');

const getPathByToken = (token = '', prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return '';
	}

	const prefix = token.slice(0, 2);

	return `${__dirname}/../../db/sessions/${prefix}/${token}`;
};

module.exports = {
	getPathByToken,
};
