import crypto from 'crypto';
import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { authorizeUser } from '../../utils/auth';
import { Log } from '../../utils/log';
import { parseCookies } from '../../helpers';

const {
	server: {
		host,
		auth: {
			telegram: { token }
		},
	},
} = require('../../config.json');

const checkTelegramAuth = (query: any) => {
	const secret = crypto.createHash('sha256')
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

function validateTelegramData(initDataStr) {
  const params = new URLSearchParams(initDataStr);

  return checkTelegramAuth(params);
//   const hash = params.get('hash');
//   params.delete('hash');

//   const dataCheckString = Array.from(params.entries())
//     .sort(([a], [b]) => a.localeCompare(b))
//     .map(([key, value]) => `${key}=${value}`)
//     .join('\n');

//   const secret = crypto.createHmac('sha256', 'WebAppData')
//     .update(botToken)
//     .digest();

//   const computedHash = crypto.createHmac('sha256', secret)
//     .update(dataCheckString)
//     .digest('hex');

//   return computedHash === hash;
}

const telegram = (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/auth/telegram/app')) {
		// TODO
	} else if (req.url?.startsWith('/auth/telegram')) {
		const query: any = url.parse(req.url, true).query;

		const success = checkTelegramAuth(query);

		if (success) {
			const { token } = parseCookies(req.headers.cookie || '');

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
