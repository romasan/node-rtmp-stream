import crypto from 'crypto';
import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import {
	authorizeUser,
	Log,
	getToken,
} from '../../utils';
import { getPostPayload } from '../../helpers';

const {
	server: {
		host,
		auth: {
			telegram: { token }
		},
	},
} = require('../../config.json');

const checkTelegramAuth = (query: any, isWebApp = false) => {
	const secret: any = (isWebApp ? crypto.createHmac('sha256', 'WebAppData') : crypto.createHash('sha256'))
		.update(token)
		.digest();
	const checkString = Object.keys(query)
		.filter(key => key !== 'hash')
		.sort()
		.map(key => `${key}=${query[key]}`)
		.join('\n');
	const hash = crypto.createHmac('sha256', secret)
		.update(checkString)
		.digest('hex');

	return hash === query.hash;
};

const telegram = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/auth/telegram/app')) {
		const payload = await getPostPayload(req);
		const params = Object.fromEntries(new URLSearchParams(payload as string));
		let user = {};

		try {
			user = JSON.parse(params.user);
		} catch (error) {
			Log('Telegram mimiapp auth error: Failed parse user data');
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('Failed');

			return false;
		}

		const success = checkTelegramAuth(params, true);

		if (success) {
			const token = getToken(req);

			authorizeUser(token, {
				...user,
				_authType: 'telegram',
			});

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('success');

			return true;
		} else {
			Log('Telegram auth error: Invalid hash');
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('Failed');
		}
	} else if (req.url?.startsWith('/auth/telegram')) {
		const query: any = url.parse(req.url, true).query;

		const success = checkTelegramAuth(query);

		if (success) {
			const token = getToken(req);

			authorizeUser(token, {
				...query,
				_authType: 'telegram',
			});

			res.writeHead(302, { Location: host });
			res.end();
		} else {
			Log('Telegram auth error: Invalid hash');
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('Ошибка, <a href="/auth/telegram">попробуйте ещё раз</a>');
		}

		return true;
	}

	return false;
};

export default telegram;
