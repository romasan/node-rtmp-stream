const fs = require('fs');
require('dotenv').config();
const { validateToken } = require('./web/helpers');

const { ADMIN_EMAIL } = process.env;

const DBFileName = __dirname + '/../db/auth.json';

const logoutLog = fs.createWriteStream(__dirname + '/../db/logout.log', { flags : 'a' });

let users = {
	sessions: {},
	authorized: {},
};

const getAllUsers = () => {
	// TODO use database
	users = require(DBFileName);

	if (!users.sessions) {
		users.sessions = {};
	}

	if (!users.authorized) {
		users.authorized = {};
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

const addNewUser = (token, data) => {
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

	saveUsers();
};

const checkUserAuthByToken = (token) => {
	return token in users.sessions;
};

const checkIsAdmin = (token) => {
	const user = getUserByToken(token);

	if (Boolean(user) && ADMIN_EMAIL && user?._authType === 'twitch' && user?.data?.[0]?.email === ADMIN_EMAIL) {
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

	return null;
}

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

	let login = '';

	if (user?._authType === 'twitch') {
		login = user?.data?.[0]?.login;
	}

	logoutLog.write([
		Date.now(),
		token,
		user?._authType,
		login,
	].join(';') + '\n');

	const authId = users.sessions[token];

	delete users.sessions[token];

	if (authId) {
		const hasMoreSessions = Object.values(users.sessions).some((id) => id === authId);
	
		if (!hasMoreSessions) {
			delete users.authorized[authId];
		}
	}

	saveUsers();
};

const getAuthId = (token) => {
	return users.sessions[token];
}

module.exports = {
	addNewUser,
	checkUserAuthByToken,
	getUserByToken,
	getUserData,
	removeUser,
	checkIsAdmin,
	getAuthId,
	_parseUserData,
};
