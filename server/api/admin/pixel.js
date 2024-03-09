const fs = require('fs');
const { getSearch, getPathByToken } = require('../../helpers');
const { getPixelAuthor, getPixelAuthorIPAddress, getPixelColor } = require('../../utils/canvas');
const { getUserData } = require('../../utils/auth');
const { getSessionUserName } = require('../../utils/sessions');

const pixel = (req, res) => {
	const { x, y } = getSearch(req.url);
	const { uuid, time } = getPixelAuthor(x, y);
	const pixelUser = getUserData(uuid);
	const name = pixelUser?.name || getSessionUserName(uuid);
	const ip = getPixelAuthorIPAddress(x, y);

	const errors = [];

	const filePath = getPathByToken(uuid, false);
	let table = [];

	if (fs.existsSync(filePath)) {
		const file = fs.readFileSync(filePath).toString();

		table = file
			.split('\n')
			.filter(Boolean)
			.map((line) => line.split(';'));
	} else {
		errors.push(`Error read file: ${filePath}`);
	}

	const _payload = {
		x,
		y,
		uuid,
		time,
		color: getPixelColor(x, y),
		name,
		user: pixelUser,
		logins: table,
		ip,
	};

	if (errors.length) {
		_payload.errors = errors;
	}

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end(JSON.stringify(_payload));
};

module.exports = {
	pixel,
};
