import { IncomingMessage, ServerResponse } from 'http';
import { getPostPayload } from '../../helpers';
import {
	authorizeUser,
	Log,
	getToken,
} from '../../utils';

const {
	localAuth,
	server: {
		host,
	},
} = require('../../config.json');

/**
 * Локальный вход (только для разработки).
 * Включается флагом `localAuth: true` в config.json.
 * test/test — обычный пользователь, admin/admin — администратор.
 */
const local = async (req: IncomingMessage, res: ServerResponse) => {
	if (!localAuth || !req.url?.startsWith('/auth/local')) {
		return false;
	}

	if (req.method === 'POST') {
		const token = getToken(req);
		const body = (await getPostPayload(req)) as string;
		const params = new URLSearchParams(body);
		const login = params.get('login') || '';
		const password = params.get('password') || '';

		let user: any = null;

		if (login === 'test' && password === 'test') {
			user = {
				_authType: 'local',
				id: 'test',
				name: 'test',
				role: 'user',
			};
		} else if (login === 'admin' && password === 'admin') {
			user = {
				_authType: 'local',
				id: 'admin',
				name: 'admin',
				role: 'admin',
			};
		}

		if (user) {
			authorizeUser(token, user);

			res.writeHead(302, { Location: host });
			res.end();
		} else {
			Log('Local auth error: wrong credentials', login);

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end('Ошибка: неверный логин или пароль. <a href="/login/?local">Попробовать ещё раз</a>');
		}

		return true;
	}

	res.writeHead(302, { Location: '/login/?local' });
	res.end();

	return true;
};

export default local;
