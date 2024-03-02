const fs = require('fs');
const { _parseUserData } = require('../utils/auth');

const _fixSessionByNickName = () => {
	const sessions = require('../../db/auth.json');

	const tokens = Object.keys(session);

	const users = {};

	tokens.forEach((token) => {
		const item = sessions[token];
		const username = item?.data?.[0]?.display_name;

		if (username) {
			users[username] = [...(users[username] || []), token];
		}
	});

	fs.writeFileSync(__dirname + '/../../db/auth.json', JSON.stringify({
		sessions,
		users,
	}));
};

const checkSessions = () => {
	const sessions = require('../../db/auth.json');

	const users = {};
	let uniq = 0;
	let emptyCount = 0;

	Object.entries(sessions).forEach(([token, user]) => {
		const username = user?.data?.[0]?.display_name;

		if (username) {
			if (!users[username]) {
				uniq++;
			}
			users[username] = (users[username] || 0) + 1;
		} else {
			emptyCount++;
		}
	});

	Object.entries(users)
		.sort(([,a], [,b]) => a > b ? 1 : -1)
		.forEach(([username, count]) => {
			console.log(`"${username}": ${count}`);
		});

	const total = Object.keys(sessions).length;

	console.log(`total: ${total}`);
	console.log(`unique: ${uniq}`);
	console.log(`empty: ${emptyCount}`);
};

const clearEmpty = () => {
	const sessions = require('../../db/auth.json');
	const output = Object.entries(sessions)
		.filter(([key, value]) => {
			const username = Boolean(value?.data?.[0]?.display_name);

			return username && key !== 'undefined' && !value.error;
		})
		.reduce((list, [key, value]) => ({ ...list, [key]: value }), {});

	fs.writeFileSync(__dirname + '/../../db/auth.json', JSON.stringify(output));
};

const mergeSessions = () => {
	const sessions = require('../../db/auth.json');

	const _authorized = {};
	const _sessions = {};

	Object.entries(sessions).forEach(([token, value]) => {
		try {
			const user = _parseUserData(value);
	
			let authId = `${user.area}:${user.id}`;
	
			_sessions[token] = authId;
			_authorized[authId] = value;
		} catch (e) {
			console.log('Failed:', token, value)
		}
	});

	const output = {
		authorized: _authorized,
		sessions: _sessions,
	};

	fs.writeFileSync(__dirname + '/../../db/auth.json', JSON.stringify(output));
};

// const fixSessionByNickName = () => {
// 	clearEmpty();
// }

module.exports = {
	// fixSessionByNickName,
	checkSessions,
	clearEmpty,
	mergeSessions,
};
// total: 298
// unique: 244
// empty: 2