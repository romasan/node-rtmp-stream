import * as VKID from '@vkid/sdk';
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

VKID.Config.init({
	app: 52936975,
	redirectUrl: 'https://api.pixelbattles.ru/auth/vk',
	responseMode: VKID.ConfigResponseMode.Callback,
	source: VKID.ConfigSource.LOWCODE,
	scope: '',
});

const vk = (req: IncomingMessage, res: ServerResponse) => {
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

			const { user }: any = VKID.Auth.publicInfo(query.token);

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
