import fetch from 'node-fetch';
import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { authorizeUser } from '../../utils/auth';
import { Log } from '../../utils/log';
import { parseCookies } from '../../helpers';

const {
	discord: {
		protocol: hoopProtocol,
		host: hoopHost,
		port: hoopPort,
	}
} = require('../../../hoops/config.json');

const {
	server: {
		host,
		auth: {
			discord: { clientId, clientSecret, redirectUri },
		},
	},
} = require('../../config.json');

const discord = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/auth/discord')) {
		if (req.url.startsWith('/auth/discord/callback')) {
			try {
				const { token } = parseCookies(req.headers.cookie || '');
				const query: any = url.parse(req.url, true).query;
				const urlEncoded = new URLSearchParams();

				urlEncoded.append('client_id', clientId);
				urlEncoded.append('client_secret', clientSecret);
				urlEncoded.append('code', query.code);
				urlEncoded.append('grant_type', 'authorization_code');
				urlEncoded.append('redirect_uri', redirectUri);
				urlEncoded.append('scope', 'identify+email');

				const respToken = await fetch(`${hoopProtocol}://${hoopHost}:${hoopPort}/auth/discord/callback`, {
					method: 'POST',
					body: JSON.stringify({
						clientId,
						clientSecret,
						code: query.code,
						redirectUri,
					}),
				});

				const jsonToken = await respToken.json();

				const respUserInfo = await fetch(`${hoopProtocol}://${hoopHost}:${hoopPort}/auth/discord/api/users/@me?token_type=${jsonToken.token_type}&access_token=${jsonToken.access_token}`);

				const jsonUserInfo = await respUserInfo.json();

				if (!jsonUserInfo.id) {
					throw new Error('Error: failed load user info');
				}

				authorizeUser(token, {
					...jsonUserInfo,
					_authType: 'discord',
				});

				res.writeHead(302, { Location: host });
				res.end();
			} catch (error) {
				Log('Discord auth error:', error);

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/discord">попробуйте ещё раз</a>');
			}

		} else {
			const urlEncoded = new URLSearchParams();

			urlEncoded.append('client_id', clientId);
			urlEncoded.append('response_type', 'code');
			urlEncoded.append('redirect_uri', redirectUri);

			const url = `https://discord.com/oauth2/authorize?${urlEncoded}&scope=identify+email`;

			res.writeHead(302, { Location: url });
			res.end();
		}

		return true;
	}

	return false;
};

export default discord;
