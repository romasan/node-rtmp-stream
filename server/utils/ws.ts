/**
 * веб / вебсокет сервер
 */

import WebSocket from 'ws';
import fs from 'fs';
import https from 'https';
import http, { IncomingMessage, ServerResponse } from 'http';
import { getCountdown } from './countdown';
import { parseCookies, getIPAddress } from '../helpers';
import { checkSession } from './sessions';
import {
	checkUserAuthByToken,
	getUserData,
	getAccoutntTokens,
} from './auth';
import { getExpand } from './expands';
import { getValue } from './values';

const {
	server: {
		port,
		secure,
		activityDuration,
		maxConnectionsWithOneIP,
		maxConnectionsDuration = 60_000,
	},
	finishTimeStamp,
	finishText,
} = require('../config.json');

let webServer = null;
let wss: WebSocket.Server | null = null;

export const send = (token: string, event: string, payload: any) => {
	wss?.clients.forEach((ws: WebSocket) => {
		if (ws.readyState === WebSocket.OPEN && (ws as any)._token === token) {
			ws.send(JSON.stringify({ event, payload }));
		}
	});
};

export const spam = (data: any) => {
	// if online > N use waveSpam
	const message = JSON.stringify(data);

	wss?.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
};

// const delay = (t = 100) => new Promise((resolve) => setTimeout(resolve, t));

// const waveSpam = async (data) => {
// 	const message = JSON.stringify(data);
// 	let count = 0;
//
// 	for (const ws of wss.clients) {
// 		if (ws.readyState === WebSocket.OPEN) {
// 			count++;
// 			if (count % 100 === 0) {
// 				await delay();
// 			}
// 			ws.send(message);
// 		}
// 	}
// };

export const updateClientCountdown = (token: string) => {
	const onlineCount = getOnlineCountUniqUUID();
	const countdown = getCountdown(token, onlineCount, false, true) * 1000;

	const tokens = getAccoutntTokens(token);

	tokens.forEach((_token) => {
		send(_token, 'countdown', countdown);
	});
};

export const getOnlineCountRaw = () => {
	let count = 0;
	let openedCount = 0;
	let countByActivity = 0;

	wss?.clients.forEach((ws) => {
		count++;

		if (ws.readyState === WebSocket.OPEN) {
			openedCount++;
		}

		if ((ws as any)._lastActivity && (Date.now() - (ws as any)._lastActivity) <= activityDuration) {
			countByActivity++;
		}
	});

	return [openedCount, count, countByActivity];
};

let updatedCacheTime = 0;
let cachedOnline = 0;

export const getOnlineCountUniqUUID = (): number => {
	if (Date.now() - updatedCacheTime < 5_000) {
		return cachedOnline;
	}

	updatedCacheTime = Date.now();

	const list: string[] = [];

	wss?.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN) {
			if (!list.includes((ws as any)._token)) {
				list.push((ws as any)._token);
			}
		}
	});

	cachedOnline = list.length;

	return cachedOnline;
};

export const getOnlineCountList = () => {
	const list: Array<{
		uuid: string;
		active: boolean;
		lastActivity: number;
	}> = [];

	wss?.clients.forEach((ws: WebSocket) => {
		if (ws.readyState === WebSocket.OPEN) {
			const uuid = (ws as any)._token;
			const lastActivity = (ws as any)._lastActivity;

			list.push({
				uuid,
				active: (Date.now() - lastActivity) <= Number(activityDuration),
				lastActivity,
			});
		}
	});

	return list;
};

export const uptateActiveTime = (token: string) => {
	wss?.clients.forEach((ws: WebSocket) => {
		if ((ws as any)._token === token) {
			(ws as any)._lastActivity = Date.now();
		}
	});
};

export const checkHasWSConnect = (token: string) => {
	let has = false;

	wss?.clients.forEach((ws: WebSocket) => {
		if ((ws as any)._token === token) {
			has = true;
		}
	});

	return has;
};

const ipConnections = new Map<string, Map<string, number>>(); // ip -> token -> timestamp
const cleanupInterval = 60_000; // 1 минута

// Запускаем периодическую очистку устаревших записей
setInterval(() => {
	const now = Date.now();
	for (const [ip, tokens] of ipConnections.entries()) {
		for (const [token, timestamp] of tokens.entries()) {
			if (now - timestamp > maxConnectionsDuration) {
				tokens.delete(token);
			}
		}
		// Удаляем IP если нет активных соединений
		if (tokens.size === 0) {
			ipConnections.delete(ip);
		}
	}
}, cleanupInterval);

export const checkIPRateLimit = (req: IncomingMessage) => {
	const ip = getIPAddress(req) || '';
	
	// Получаем данные для IP или создаем новые
	let ipTokens = ipConnections.get(ip);
	if (!ipTokens) {
		ipTokens = new Map<string, number>();
		ipConnections.set(ip, ipTokens);
	}

	// Подсчитываем количество активных соединений для этого IP
	let count = 0;
	const now = Date.now();
	for (const [token, timestamp] of ipTokens.entries()) {
		if (now - timestamp <= maxConnectionsDuration) {
			count++;
		} else {
			// Удаляем устаревшие соединения
			ipTokens.delete(token);
		}
	}

	return count <= maxConnectionsWithOneIP ? false : `${ip} (${count})`;
};

// Функция для добавления нового соединения
export const addIPConnection = (ip: string, token: string) => {
	let ipTokens = ipConnections.get(ip);
	if (!ipTokens) {
		ipTokens = new Map<string, number>();
		ipConnections.set(ip, ipTokens);
	}
	ipTokens.set(token, Date.now());
};

// Функция для удаления соединения
export const removeIPConnection = (ip: string, token: string) => {
	const ipTokens = ipConnections.get(ip);
	if (ipTokens) {
		ipTokens.delete(token);
		// Удаляем IP если нет активных соединений
		if (ipTokens.size === 0) {
			ipConnections.delete(ip);
		}
	}
};

const certFiles = {
	privateKey: '../ssl-cert/privkey.pem',
	certificate: '../ssl-cert/fullchain.pem',
};

export const initServer = (callback: (req: IncomingMessage, res: ServerResponse) => void) => {
	if (secure && fs.existsSync(certFiles.privateKey) && fs.existsSync(certFiles.certificate)) {
		const privateKey = fs.readFileSync(certFiles.privateKey, 'utf8');
		const certificate = fs.readFileSync(certFiles.certificate, 'utf8');
		const credentials = { key: privateKey, cert: certificate };

		webServer = https.createServer(credentials, callback);
	} else {
		webServer = http.createServer(callback);
	}

	webServer.on('error', error => {
		console.error('Server error:', error);
	});

	webServer.listen(port, 'localhost');

	wss = new WebSocket.Server({ server: webServer });

	wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
		const { token } = parseCookies(req.headers.cookie);

		if (!checkSession(token, true)) {
			ws.close();

			return;
		}

		const ip = getIPAddress(req);
		const onlineCount = getOnlineCountUniqUUID();
		const countdown = getCountdown(token, onlineCount) * 1000;
		const isAuthorized = checkUserAuthByToken(token);
		const user = getUserData(token);

		(ws as any)._ip = ip;
		(ws as any)._token = token;
		(ws as any)._lastActivity = Date.now();

		// Добавляем соединение в систему отслеживания IP
		if (ip) {
			addIPConnection(ip, token);
		}

		send(token, 'init', {
			...user,
			countdown,
			isAuthorized,
			canvas: getExpand(),
			finish: finishTimeStamp ? new Date(finishTimeStamp).getTime() - Date.now() : 'newer',
			finishText: finishText || 'TIMEOUT',
			needAuthorize: true,
			paused: getValue('paused'),
		});

		ws.on('close', () => {
			// Удаляем соединение при закрытии
			if (ip) {
				removeIPConnection(ip, token);
			}
		});

		ws.on('message', (buf: Buffer) => {
			const raw = buf.toString();

			if (raw === '2') {
				ws.send(3);

				return;
			}
		});
	});
};
