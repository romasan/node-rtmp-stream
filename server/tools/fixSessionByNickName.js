const fs = require('fs');

const _fixSessionByNickName = () => {
	const sessions = require('../sessions/auth.json');

	const tokens = Object.keys(session);

	const users = {};

	tokens.forEach((token) => {
		const item = sessions[token];
		const username = item?.data?.[0]?.display_name;

		if (username) {
			users[username] = [...(users[username] || []), token];
		}
	});

	fs.writeFileSync(__dirname + '/../sessions/auth.json', JSON.stringify({
		sessions,
		users,
	}));
};

const checkSessions = () => {
	const sessions = require('../sessions/auth.json');

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
	const sessions = require('../sessions/auth.json');
	const output = Object.entries(sessions)
		.filter(([key, value]) => Boolean(value?.data?.[0]?.login))
		.reduce((list, [key, value]) => ({ ...list, [key]: value }), {});

	fs.writeFileSync(__dirname + '/../sessions/auth.json', JSON.stringify(output));
};

const removeDuplicates = () => {
	const sessions = require('../sessions/auth.json');

	const doubles = {};

	Object.entries(sessions).forEach(([key, value]) => {
		const name = value?.data?.[0]?.display_name;

		doubles[name] = [...(doubles[name] || []), key];
	});

	let _break = 0;

	const output = Object.entries(doubles).reduce((list, [name, keys]) => {
		let key = keys[0];

		if (keys.length > 1) {
			console.log(`${name}: ${keys.length}`);

			// fs.readFileSync();

			if (_break) {
				return;
			}

			_break++;

			for (const _key of keys) {
				// read login log
				// get last date for sort
			}
		}

		return {
			...list,
			[key]: sessions[key],
		};
	}, {})

	// fs.writeFileSync(__dirname + '/../sessions/auth.json', JSON.stringify(output));
}

// const fixSessionByNickName = () => {
// 	clearEmpty();
// }

module.exports = {
	// fixSessionByNickName,
	checkSessions,
	clearEmpty,
	removeDuplicates,
};
// total: 298
// unique: 244
// empty: 2