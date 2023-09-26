const validateToken = (token) => {
	return typeof token === 'string' && token.match(/^[0-9a-f]{1}[0-9a-f\-]{35}$/);
};

const getPathByToken = (token = '', prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return '';
	}

	const [a, b, c] = token.split('');

	return `./sessions/${a}/${b}/${c}/${token}`;
};

const getPostPayload = (req) => {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk) => {
			body += chunk.toString();
		});

		req.on('end', () => {
			resolve(body);
		});

		req.on('error', () => {
			reject();
		});
	});
};

const inRange = (value, [from, to]) => value >= from && value <= to;

const parseCookies = (cookies = '') => {
	return cookies
		.split(';')
		.map((item) => item.split('='))
		.reduce((list, [key, value]) => ({ ...list, [key?.trim()]: value?.trim() }), {});
};

module.exports = {
	validateToken,
	getPathByToken,
	getPostPayload,
	inRange,
	parseCookies,
};
