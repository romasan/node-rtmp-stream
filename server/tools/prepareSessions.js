const fs = require('fs');
const readline = require('readline');

const prepareSessions = () => {
	const whiteList = {};

	const auth = require(__dirname + '/../../db/auth.json');

	Object.keys(auth.sessions).forEach((uuid) => {
		whiteList[uuid] = (whiteList[uuid] || 0) + 1;
	});

	const rl = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../../db/logout.log'),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		const [, uuid] = line.split(';');

		whiteList[uuid] = (whiteList[uuid] || 0) + 1;
	});

	rl.on('close', () => {
		console.log('====', Object.keys(whiteList).length);
	});
};

const unlinkOldEmptySessions = () => {
	// TODO
};

const addNicknameList = () => {
	const auth = require(__dirname + '/../../db/auth.json');

	auth.nicknames = {
		discord: {},
		twitch: {},
		steam: {},
	};

	Object.keys(auth.authorized).forEach((key) => {
		const area = auth.authorized[key]._authType;
		let nick = '';

		if (area === 'twitch') {
			nick = auth.authorized[key].data[0].display_name;
		}

		if (area === 'steam') {
			auth.response?.players?.[0]?.personaname;
		}

		if (area === 'discord') {
			nick = auth.authorized[key].username;
		}

		if (nick) {
			auth.nicknames[area][nick] = key;
		}
	})

	fs.writeFileSync(__dirname + '/../../db/auth.json', JSON.stringify(auth, true, 2))
};

module.exports = {
	prepareSessions,
	addNicknameList,
};
