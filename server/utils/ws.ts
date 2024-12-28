/**
 * веб / вебсокет сервер
 */

import WebSocket from 'ws';
import fs from 'fs';
import https from 'https';
import http, { IncomingMessage, ServerResponse } from 'http';
import { getCountdown } from '../utils/countdown';
import { parseCookies, getIPAddress } from '../helpers';
import { checkSession } from './sessions';
import {
	checkUserAuthByToken,
	getUserData,
	getAccoutntTokens,
} from './auth';

const {
	colorShemes: { COLORS },
	server: {
		port,
		secure,
		activityDuration,
		maxConnectionsWithOneIP,
	},
	finishTimeStamp,
	finishText,
	guestCanPlay,
} = require('../config.json');

let webServer = null;
let wss: WebSocket.Server | null = null;

const send = (token: string, event: string, payload: any) => {
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
	const onlineCount = getOnlineCount();
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

export const getOnlineCount = (): number => {
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

export const checkIPRateLimit = (req: IncomingMessage) => {
	// TODO check without WS
	// and/or cache 1-5 sec?
	const ip = getIPAddress(req);
	let count = 0;

	wss?.clients.forEach((ws: WebSocket) => {
		if ((ws as any)._ip === ip) {
			count++;
		}
	});

	return count <= maxConnectionsWithOneIP ? false : `${ip} (${count})`;
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
		const onlineCount = getOnlineCount();
		const countdown = guestCanPlay ? getCountdown(token, onlineCount) * 1000 : -1;
		const isAuthorized = checkUserAuthByToken(token);
		const user = getUserData(token);

		(ws as any)._ip = ip;
		(ws as any)._token = token;
		(ws as any)._lastActivity = Date.now();

		send(token, 'init', {
			...user,
			countdown,
			isAuthorized,
			palette: COLORS,
			finish: finishTimeStamp ? new Date(finishTimeStamp).getTime() - Date.now() : 'newer',
			finishText: finishText || 'TIMEOUT',
			needAuthorize: !guestCanPlay,
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
