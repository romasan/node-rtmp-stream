/**
 * управление авторизированными пользователми
 */

import fs from 'fs';
import { validateToken } from '../helpers';
import { IUsers, IParsedUser } from '../types';

const {
	adminEmail,
	moderatorNicks,
} = require('../config.json');

const DBFileName = __dirname + '/../../db/auth.json';

const logoutLog = fs.createWriteStream(__dirname + '/../../db/logout.log', { flags : 'a' });

let users: IUsers = {
	sessions: {},
	accounts: {},
	authorized: {},
	nicknames: {
		discord: {},
		twitch: {},
		steam: {},
		telegram: {},
		vk: {},
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

	if (!users.nicknames) {
		users.nicknames = {
			discord: {},
			twitch: {},
			steam: {},
			telegram: {},
			vk: {},
		};
	}

	if (!users.nicknames.discord) {
		users.nicknames.discord = {};
	}

	if (!users.nicknames.twitch) {
		users.nicknames.twitch = {};
	}

	if (!users.nicknames.steam) {
		users.nicknames.steam = {};
	}

	if (!users.nicknames.telegram) {
		users.nicknames.telegram = {};
	}

	if (!users.nicknames.vk) {
		users.nicknames.vk = {};
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

export const authorizeUser = (token: string, data: any) => {
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
		...(users.accounts[authId]?.filter((value: string) => value !== token) || []),
		token,
	];
	users.nicknames[user.area][user.name] = authId;

	saveUsers();
};

export const checkUserAuthByToken = (token: string) => {
	return token in users.sessions;
};

const _moderators = (moderatorNicks || '').split(',');

// TODO roles
export const checkIsAdmin = (token: string) => {
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

export const getUserByToken = (token: string) => {
	const authId = users.sessions[token] || token;

	return users.authorized[authId];
};

export const _parseUserData = (raw: any): IParsedUser | null => {
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

	if (raw?._authType === 'telegram') {
		return {
			id: raw?.id,
			name: raw?.username || raw?.first_name,
			avatar: raw?.photo_url,
			area: 'telegram',
		};
	}

	if (raw?._authType === 'vk') {
		return {
			id: raw?.user_id,
			name: `${raw?.first_name}${raw.last_name ? ' ' : ''}${raw?.last_name || ''}`,
			avatar: raw?.avatar,
			area: 'vk',
		};
	}

	return null;
};

export const getUserData = (token: string) => {
	const user = getUserByToken(token);

	const data = _parseUserData(user);

	return data || {};
};

export const removeUser = (token: string) => {
	const user = getUserByToken(token);

	// console.log('Error remove user authorization:', token);

	if (!user) {
		return;
	}

	const data: IParsedUser | null = _parseUserData(user);

	logoutLog.write([
		Date.now(),
		token,
		user?._authType,
		data?.name,
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
			if (data?.area) {
				delete users.nicknames[data.area][data.name];
			}
		}
	}

	saveUsers();
};

export const getAuthID = (token: string) => {
	return users.sessions[token];
};

export const getAccoutntTokens = (token: string) => {
	const authId = getAuthID(token);

	return users.accounts[authId] || [token];
};

export const getSessionsByNick = (nick: string): string[] => {
	const authIDs = [
		users.nicknames.steam[nick],
		users.nicknames.discord[nick],
		users.nicknames.twitch[nick],
	].filter(Boolean);

	return authIDs.reduce((list, authId) => [
		...list,
		...users.accounts[authId],
	] as any, []);
};
