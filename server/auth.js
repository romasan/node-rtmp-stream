const fs = require('fs');
require('dotenv').config();

const { ADMIN_EMAIL } = process.env;

const DBFileName = './sessions/auth.json';

const logoutLog = fs.createWriteStream(__dirname + '/sessions/logout.log', { flags : 'a' });

let users = {};

const getAllUsers = () => {
	// TODO use database
	users = require(DBFileName);
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
	users[token] = data;
	saveUsers();
};

const checkUserAuthByToken = (token) => {
	return token in users;
};

const checkIsAdmin = (token) => {
	const user = getUserByToken(token);
	
	if (Boolean(user) && ADMIN_EMAIL && user?._authType === 'twitch' && user?.data?.[0]?.email === ADMIN_EMAIL) {
		return true;
	}

	return false;
};

const getUserByToken = (token) => {
	return users[token];
};

const getUserData = (token) => {
	const user = getUserByToken(token);

	if (user?._authType === 'twitch') {
		return {
			name: user?.data?.[0]?.display_name,
			avatar: user?.data?.[0]?.profile_image_url,
		};
	}

	return {};
}

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

	delete users[token];
	saveUsers();
}

module.exports = {
	addNewUser,
	checkUserAuthByToken,
	getUserByToken,
	getUserData,
	removeUser,
	checkIsAdmin,
};
