import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { authorizeUser } from '../../utils/auth';
import { Log } from '../../utils/log';
import { parseCookies } from '../../helpers';

const {
	server: {
		host,
	},
} = require('../../config.json');

const vk = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/auth/vk')) {
		try {
			const { token } = parseCookies(req.headers.cookie || '');
			const query: any = url.parse(req.url, true).query;

			if (!query.token) {
				Log('VK auth error: empty token');

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/vk">попробуйте ещё раз</a>');

				return true;
			}

			const urlEncoded = new URLSearchParams();

			urlEncoded.append('id_token', query.token);

			const resp = await fetch('https://id.vk.com/oauth2/public_info?client_id=52936975', {
				method: 'POST',
				body: urlEncoded,
				// body: JSON.stringify({ id_token: query.token }),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			const { user } = await resp.json();

			console.log('==== authorize (vk)', {
				query,
				user,
			});

			if (!user) {
				Log('VK auth error: empty user data');

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/vk">попробуйте ещё раз</a>');

				return true;
			}

			authorizeUser(token, {
				...user,
				_authType: 'vk',
			});

			res.writeHead(302, { Location: host });
			res.end();
		} catch (error) {
			Log('VK auth error:', error);

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('Ошибка, <a href="/auth/vk">попробуйте ещё раз</a>');
		}

		return true;
	}

	return false;
};

export default vk;
