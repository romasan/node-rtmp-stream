const fs = require('fs');

const DBFileName = __dirname + '/../../db/bans.json';

let bans = {
	token: {},
	ip: {},
	nick: {},
};

// TODO use database
const getAllBans = () => {
	if (!fs.existsSync(DBFileName)) {
		fs.writeFileSync(DBFileName, JSON.stringify(bans));
	} else {
		bans = require(DBFileName);
	}

	if (!bans.token) {
		bans.token = {};
	}

	if (!bans.ip) {
		bans.ip = {};
	}

	if (!bans.nick) {
		bans.nick = {};
	}
};

getAllBans();

const saveBans = () => {
	fs.writeFileSync(
		DBFileName,
		JSON.stringify(bans),
		() => {},
	);
};

const checkBan = ({ token, nick, ip }) => {
	if (token && bans.token[token]) {
		if (typeof bans.token[token] === 'number' && Date.now() >= bans.token[token]) {
			unban('token', token);

			return false;
		}

		return true;
	}

	if (nick && bans.nick[nick]) {
		if (typeof bans.nick[nick] === 'number' && Date.now() >= bans.nick[nick]) {
			unban('nick', nick);

			return false;
		}

		return true;
	}

	if (ip && bans.ip[ip]) {
		if (typeof bans.ip[ip] === 'number' && Date.now() >= bans.ip[ip]) {
			unban('ip', ip);

			return false;
		}

		return true;
	}

	return false;
};

const ban = (type, value, datetime) => {
	bans[type][value] = datetime ? Number(datetime) : true;
	saveBans();
};

const unban = (type, value) => {
	bans[type][value] = false;
	saveBans();
};

const getBans = () => {
	return bans;
};

module.exports = {
	checkBan,
	ban,
	unban,
	getBans,
};
