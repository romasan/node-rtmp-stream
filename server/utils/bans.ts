/**
 * управление банами
 */

import fs from 'fs';
import { dirname } from 'path';

const DBFileName = __dirname + '/../../db/bans.json';

let bans: any = {
	token: {},
	ip: {},
	nick: {},
	mute: {},
};

// TODO use database
const getAllBans = () => {
	if (!fs.existsSync(DBFileName)) {
		fs.mkdirSync(dirname(DBFileName), { recursive: true});
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

	if (!bans.mute) {
		bans.mute = {};
	}
};

getAllBans();

const saveBans = () => {
	fs.writeFileSync(
		DBFileName,
		JSON.stringify(bans),
		// () => {},
	);
};

export const checkBan = ({ token, nick, ip, mute }: {
	token?: string;
	nick?: string;
	ip?: string | string[];
	mute?: boolean;
}) => {
	if (mute && bans.mute[nick || '']) {
		return true;
	}

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

	if (ip) {
		const IPs = Array.isArray(ip) ? ip : ip.split(', ');

		return IPs.some((_ip) => bans.ip[_ip]);
		// if (typeof bans.ip[ip] === 'number' && Date.now() >= bans.ip[ip]) {
		// 	unban('ip', ip);

		// 	return false;
		// }

		// return true;
	}

	return false;
};

export const ban = (type: string, value: string, datetime: Date | number) => {
	if (type === 'ip') {
		const IPs = value.split(/\n|\,\ /g)
			.filter(Boolean)
			.map((item) => item.trim());

		IPs.forEach((_ip) => {
			bans.ip[_ip] = datetime ? Number(datetime) : true;
		});
	} else {
		bans[type][value] = datetime ? Number(datetime) : true;
	}
	saveBans();
};

export const unban = (type: string, value: string) => {
	delete bans[type][value];
	saveBans();
};

export const getBans = () => {
	return bans;
};
