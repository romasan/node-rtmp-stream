/**
 * управление сессиями
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { IncomingMessage } from 'http';
import { addSessionForIP, parseCookies } from '../helpers';

import {
	validateToken,
	getPathByToken,
} from '../helpers';

const sessions: Record<string, number> = {};
let failed: Record<string, boolean | number> = {};

const maxLength = 1000;
const gap = 100;

let index = 0;

const file = __dirname + '/../../db/list';

if (!fs.existsSync(file)) {
	const dirname = path.dirname(file);

	fs.mkdirSync(dirname, { recursive: true });
	fs.writeFileSync(file, '');
}

const rl = readline.createInterface({
	input: fs.createReadStream(file),
	crlfDelay: Infinity
});

rl.on('line', (uuid) => {
	sessions[uuid] = ++index;
});

const tokensFile = fs.createWriteStream(file, { flags : 'a' });
// const ipFile = fs.createWriteStream(__dirname + '/../../db/iplist', { flags : 'a' });

const trim = (obj: any) => {
	return Object.entries(obj)
		.sort(([, a], [, b]) => Number(a) > Number(b) ? 1 : -1)
		.slice(-maxLength)
		.reduce((list, [key, value]) => ({ ...list, [key]: value }), {});
};

// const trimSessions = () => {
// 	if (Object.keys(sessions).length > (maxLength + gap)) {
// 		sessions = trim(sessions);
// 	}
// };

const trimFailed = () => {
	if (Object.keys(failed).length > (maxLength + gap)) {
		failed = trim(failed);
	}
};

export const checkSession = (token: string, prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return false;
	}

	if (sessions[token]) {
		return true;
	}

	if (failed[token]) {
		return false;
	}

	const filePath = getPathByToken(token, false);

	if (fs.existsSync(filePath)) {
		// sessions[token] = Date.now();

		return true;
	} else {
		failed[token] = Date.now();
		trimFailed();

		return false;
	}
};

export const addSession = (token: string, ip: string) => {
	const filePath = getPathByToken(token, false);
	const dirname = path.dirname(filePath);

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}

	const fileContent = [Date.now(), ip].join(';') + '\n';

	if (fs.existsSync(filePath)) {
		fs.appendFileSync(filePath, fileContent);
	} else {
		tokensFile.write(token + '\n');
		// ipFile.write(ip + '\n');
		fs.writeFileSync(filePath, fileContent);
		sessions[token] = ++index;
	}

	addSessionForIP(ip, token);

	delete failed[token];
	// trimSessions();
};

export const getSessionUserName = (token: string) => {
	const guestIndex = sessions[token] || '';

	return `Гость${guestIndex}`;
};

export const getToken = (req: IncomingMessage) =>
	parseCookies(req.headers.cookie)?.token || req.headers['authorization']?.split(' ')[1] || '';
