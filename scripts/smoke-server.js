/**
 * Смоук-проверка запущенного сервера: сессия -> WS-хендшейк -> init -> ping/pong -> история чата.
 *
 * Запуск (сервер должен быть уже запущен):
 *   npm run smoke:server
 *   SMOKE_PORT=8099 npm run smoke:server
 *
 * Проверяет работу WebSocket-слоя (`ws`) и чата (`/messages`) без изменения данных —
 * создаётся обычная гостевая сессия и читается история сообщений.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, '..');
const WebSocket = require(path.join(root, 'node_modules/ws'));
const wsVersion = require(path.join(root, 'node_modules/ws/package.json')).version;

const getConfigPort = () => {
	try {
		return require(path.join(root, 'server/config.json')).server.port;
	} catch (error) {
		return undefined;
	}
};

const HOST = process.env.SMOKE_HOST || 'localhost';
const PORT = Number(process.env.SMOKE_PORT || getConfigPort() || 8080);

const results = [];

const check = (name, ok, extra = '') => {
	results.push(ok);

	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};

const request = (method, urlPath, cookie, body) => new Promise((resolve, reject) => {
	const headers = {};

	if (cookie) {
		headers.Cookie = cookie;
	}

	if (body) {
		headers['Content-Type'] = 'application/json';
		headers['Content-Length'] = Buffer.byteLength(body);
	}

	const req = http.request({ host: HOST, port: PORT, path: urlPath, method, headers }, (res) => {
		let data = '';

		res.setEncoding('utf8');
		res.on('data', (chunk) => { data += chunk; });
		res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
	});

	req.on('error', reject);

	if (body) {
		req.write(body);
	}

	req.end();
});

const waitFor = (ws, predicate, name, timeout = 10000) => new Promise((resolve, reject) => {
	const timer = setTimeout(() => {
		ws.off('message', onMessage);
		reject(new Error(`timeout while waiting: ${name}`));
	}, timeout);

	const onMessage = (raw) => {
		const data = raw.toString();

		if (predicate(data)) {
			clearTimeout(timer);
			ws.off('message', onMessage);
			resolve(data);
		}
	};

	ws.on('message', onMessage);
});

const main = async () => {
	console.log(`smoke: ${HOST}:${PORT}, ws ${wsVersion}`);

	// 1. Сессия: PUT /start без cookie -> сервер генерирует uuid-токен гостя
	const start = await request('PUT', '/start');

	check('PUT /start отвечает', start.status === 200, `status=${start.status} body=${start.body}`);

	const setCookie = [].concat(start.headers['set-cookie'] || []).join('; ');
	const token = (setCookie.match(/token=([^;]+)/) || [])[1];

	check('сервер выдал session-токен', Boolean(token), token ? `token=${token.slice(0, 8)}…` : 'нет Set-Cookie');

	if (!token) {
		return;
	}

	const cookie = `token=${token}`;

	// 2. WS-хендшейк с валидной сессией -> сервер отправляет init
	const ws = new WebSocket(`ws://${HOST}:${PORT}`, { headers: { Cookie: cookie } });

	const initRaw = await waitFor(ws, (data) => data.includes('"init"'), 'ws init');

	let init = null;

	try {
		init = JSON.parse(initRaw);
	} catch (error) {
		check('ws init — валидный JSON', false, error.message);
	}

	if (init) {
		check('ws init получен', init.event === 'init' && typeof init.payload === 'object', `keys=${Object.keys(init.payload || {}).length}`);
		check('init payload содержит canvas и countdown', Boolean(init.payload?.canvas) && 'countdown' in init.payload);
	}

	// 3. ping/pong из server/utils/ws.ts: '2' -> '3'
	const pong = waitFor(ws, (data) => data.trim() === '3', 'ws ping/pong');

	ws.send('2');

	check('ws ping/pong (2 -> 3)', (await pong).trim() === '3');

	// 4. Чат: GET /messages отдаёт историю сообщений
	const messages = await request('GET', '/messages', cookie);

	check('GET /messages отвечает', messages.status === 200, `status=${messages.status}`);

	try {
		const list = JSON.parse(messages.body);

		check('история чата — массив', Array.isArray(list), `сообщений: ${list.length}`);
	} catch (error) {
		check('история чата — валидный JSON', false, error.message);
	}

	ws.close();
};

main()
	.then(() => {
		const failed = results.filter((ok) => !ok).length;

		console.log(`\nИтого: ${results.length - failed}/${results.length} проверок пройдено`);
		process.exit(failed ? 1 : 0);
	})
	.catch((error) => {
		console.error(`\nSMOKE ERROR: ${error.message}`);
		console.error('Проверь, что сервер запущен (npm run dev:server) и порт доступен.');
		process.exit(1);
	});
