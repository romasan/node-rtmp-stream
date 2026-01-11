const http = require('http');
// const crypto = require('crypto');
const jwt = require('jsonwebtoken');
// const { v4: uuid } = require('uuid');

const {
	server: {
		auth: {
			twitchExtension: {
				jwtSecret,
				clientId,
				secret,
			}
		},
	},
} = require('../config.json');


const getPostPayload = (req, type = 'text') => {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk) => {
			body += chunk.toString();
		});

		req.on('end', () => {
			if (type === 'json') {
				let json = {};

				try {
					json = JSON.parse(body);
				} catch (ignore) {/* */ }

				resolve(json);

				return;
			}

			resolve(body);
		});

		req.on('error', () => {
			reject();
		});
	});
};

const getAppAccessToken = async () => {
	const params = new URLSearchParams();
	params.append('client_id', clientId);
	params.append('client_secret', secret);
	params.append('grant_type', 'client_credentials');

	const resp = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		body: params
	});
	const data = await resp.json();
	console.log('==== getAppAccessToken', {
		clientId,
		jwtSecret,
		data,
	});
	return data.access_token; // живёт 24 часа
};

const getUserInfo = async (userId) => {
  const token = await getAppAccessToken(); // или кэшируйте на 24ч
  const resp = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await resp.json();
  console.log('==== getUserInfo', data);
  return data.data[0]; // { id, login, display_name, profile_image_url, ... }
};

const twitchExtensionAuth = async (req, res) => {
	if (req.url === '/auth/twitch-extension' && req.method === 'POST') {
		try {
			const { token: cookieToken } = parseCookies(req.headers.cookie || '');
			const { token } = await getPostPayload(req, 'json');
			//   let body = '';
			//   req.on('data', chunk => body += chunk);
			//   req.on('end', async () => {
			//     const { token } = JSON.parse(body);

			console.log('==== token', token);
			console.log('==== cookieToken', cookieToken);
			console.log('==== jwtSecret', jwtSecret);
			console.log('==== clientId', clientId);
			console.log('==== secret', secret);

			if (!token) {
				res.writeHead(400);
				return res.end('Missing token');
			}

			// 🔐 Проверка JWT
			const secretBuffer = Buffer.from(jwtSecret, 'base64');
			const decoded = jwt.verify(token, secretBuffer, { algorithms: ['HS256'] });

			// Извлекаем данные
			const userId = decoded.user_id; // ID зрителя
			const channelId = decoded.channel_id; // ID канала, где запущено расширение
			const role = decoded.role; // "viewer", "broadcaster", "moderator"

			console.log('==== userId', userId);
			console.log('==== channelId', channelId);
			console.log('==== role', role);

			if (!userId) {
				res.writeHead(400);
				return res.end('Invalid token');
			}

			const userData = await getUserInfo(userId);

			console.log('==== user data:', userData);

			// Получаем данные пользователя через Helix API (опционально)
			// Но можно обойтись только userId, если у вас уже есть данные в БД

			// Генерируем внутренний токен сессии (аналогично вашему authorizeUser)
			const fakeToken = 'twitch-ext-' + userId; // или используйте настоящий сессионный токен

			console.log('==== fakeToken', fakeToken);
			// await authorizeUser(fakeToken, {
			//   id: userId,
			//   login: decoded.login || 'user_' + userId,
			//   display_name: decoded.display_name || 'User',
			//   profile_image_url: '', // можно получить через Helix, но требует access_token
			//   _authType: 'twitch-extension'
			// });

			// Устанавливаем куку сессии
			res.setHeader('Set-Cookie', `token=${fakeToken}; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({
				success: true,
				user: {
					id: userId,
					display_name: decoded.display_name || 'User',
					profile_image_url: '' // или запросите через Helix
				}
			}));
			//   });
		} catch (error) {
			console.error('Twitch Extension auth error:', error);
			res.writeHead(401);
			res.end(JSON.stringify({ success: false, error: 'Invalid token' }));
		}
		return true;
	}
	return false;
};

const callback = async (req, res) => {
	// const { token: prevToken } = parseCookies(req.headers.cookie || '');
	// const payload = await getPostPayload(req);

	console.log('==== origin:', req.headers['origin']);
	console.log('==== url:', req.url);

	res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	if (await twitchExtensionAuth(req, res)) {
		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('=)');
};

// npm run tools debugTwitch 7001
const debugTwitch = (port) => {
	webServer = http.createServer(callback);

	webServer.listen(port, 'localhost');
};

module.exports = {
	debugTwitch,
};
