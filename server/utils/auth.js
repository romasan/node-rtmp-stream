/**
 * управление авторизированными пользователми
 */

const fs = require('fs');
const { validateToken } = require('../helpers');

const {
	adminEmail,
	moderatorNicks,
} = require('../config.json');

const DBFileName = __dirname + '/../../db/auth.json';

const logoutLog = fs.createWriteStream(__dirname + '/../../db/logout.log', { flags : 'a' });

let users = {
	sessions: {},
	accounts: {},
	authorized: {},
	nicknames: {
		discord: {},
		twitch: {},
		steam: {},
	},
};

const getAllUsers = () => {
	// TODO use database
	if (fs.existsSync(DBFileName)) {
		users = require(DBFileName);
	}

	if (!users.sessions) {
		users.sessions = {};
	}

	if (!users.authorized) {
		users.authorized = {};
	}

	if (!users.accounts) {
		users.accounts = {};
	}
};

getAllUsers();

const saveUsers = () => {
	fs.writeFile(
		DBFileName,
		JSON.stringify(users),
		() => {},
	);
};

const authorizeUser = (token, data) => {
	if (!validateToken(token)) {
		return;
	}

	const user = _parseUserData(data);

	if (!user || !user.id || !user.name) {
		return;
	}

	const authId = `${user.area}:${user.id}`;
	
	users.authorized[authId] = data;
	users.sessions[token] = authId;
	users.accounts[authId] = [
		...(users.accounts[authId]?.filter((value) => value !== token) || []),
		token,
	];
	users.nicknames[user.area][user.name] = authId;

	saveUsers();
};

const checkUserAuthByToken = (token) => {
	return token in users.sessions;
};

const _moderators = (moderatorNicks || '').split(',');

// TODO roles
const checkIsAdmin = (token) => {
	const user = getUserByToken(token);

	// admin
	if (Boolean(user) && Boolean(adminEmail) && user?._authType === 'twitch' && user?.data?.[0]?.email === adminEmail) {
		return true;
	}

	// moderator
	if (Boolean(user) && _moderators.length && _moderators.includes(user?._authType === 'twitch' && user?.data?.[0]?.display_name)) {
		return true;
	}

	return false;
};

const getUserByToken = (token) => {
	const authId = users.sessions[token] || token;

	return users.authorized[authId];
};

const _parseUserData = (raw) => {
	if (raw?._authType === 'twitch') {
		return {
			id: raw?.data?.[0]?.id,
			name: raw?.data?.[0]?.display_name,
			avatar: raw?.data?.[0]?.profile_image_url,
			area: 'twitch',
		};
	}

	if (raw?._authType === 'steam') {
		return {
			id: raw?.response?.players?.[0]?.steamid,
			name: raw?.response?.players?.[0]?.personaname,
			avatar: raw?.response?.players?.[0]?.avatar,
			area: 'steam',
		};
	}

	if (raw?._authType === 'discord') {
		return {
			id: raw?.id,
			name: raw?.username,
			avatar: `https://cdn.discordapp.com/avatars/${raw?.id}/${raw?.avatar}.webp?size=64`,
			area: 'discord',
		};
	}

	return null;
};

const getUserData = (token) => {
	const user = getUserByToken(token);

	const data = _parseUserData(user);

	return data || {};
};

const removeUser = (token) => {
	const user = getUserByToken(token);

	// console.log('Error remove user authorization:', token);

	if (!user) {
		return;
	}

	const data = _parseUserData(user);

	logoutLog.write([
		Date.now(),
		token,
		user?._authType,
		data.name,
	].join(';') + '\n');

	const authId = users.sessions[token];

	delete users.sessions[token];

	if (authId) {
		const hasMoreSessions = Object.values(users.sessions).some((id) => id === authId);
	
		if (!hasMoreSessions) {
			delete users.authorized[authId];
		}

		users.accounts[authId] = users.accounts[authId]?.filter((value) => value !== token);

		if (!users.accounts[authId]?.length) {
			delete users.accounts[authId];
			delete users.nicknames[data.area][data.name];
		}
	}

	saveUsers();
};

const getAuthID = (token) => {
	return users.sessions[token];
};

const getAccoutntTokens = (token) => {
	const authId = getAuthID(token);

	return users.accounts[authId] || [token];
};

const getSessionsByNick = (nick) => {
	const authIDs = [
		users.nicknames.steam[nick],
		users.nicknames.discord[nick],
		users.nicknames.twitch[nick],
	].filter(Boolean);

	return authIDs.reduce((list, authId) => [
		...list,
		...users.accounts[authId],
	], []);
}

module.exports = {
	authorizeUser,
	checkUserAuthByToken,
	getUserByToken,
	getUserData,
	removeUser,
	checkIsAdmin,
	getAuthID,
	getAccoutntTokens,
	_parseUserData,
	getSessionsByNick,
};
