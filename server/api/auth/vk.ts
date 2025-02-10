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

const vk = (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/auth/vk')) {
		try {
			const { token } = parseCookies(req.headers.cookie || '');
			const query: any = url.parse(req.url, true).query;
			const { user }: any = VKID.Auth.publicInfo(query.token);

			console.log('==== authorize (vk)', user);

			authorizeUser(token, {
				...user,
				_authType: 'vk',
			});

			res.writeHead(302, { Location: host });
			res.end();
		} catch (error) {
			Log('Discord auth error:', error);

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('Ошибка, <a href="/auth/vk">попробуйте ещё раз</a>');
		}

		return true;
	}

	return false;
};

export default vk;
