import fetch from 'node-fetch';
import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { authorizeUser } from '../../utils/auth';
import { Log } from '../../utils/log';
import { parseCookies } from '../../helpers';

const {
	server: {
		host,
		auth: {
			twitch: {
				clientId,
				clientSecret,
				redirectUri,
			},
			twitchExtension: {
				jwtSecret,
				extensionId,
				secret,
			}
		},
	},
} = require('../../config.json');

let accessTokenCache = {
	token: '',
	time: 0,
};

const SEC = 1000;
const MIN = SEC * 60;
const HOUR = MIN * 60;

const getAppAccessToken = async () => {
	if (
		accessTokenCache.token &&
		((Date.now() - accessTokenCache.time) >= (HOUR * 24))
	) {
		return accessTokenCache.token;
	}

	const params = new URLSearchParams();
	params.append('client_id', extensionId);
	params.append('client_secret', secret);
	params.append('grant_type', 'client_credentials');

	const resp = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		body: params
	});
	const data = await resp.json();

	accessTokenCache = {
		token: data.access_token,
		time: Date.now(),
	};

	return accessTokenCache.token;
};

const getUserInfo = async (userId: string) => {
	const token = await getAppAccessToken();
	const resp = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
		headers: {
			'Client-ID': extensionId,
			'Authorization': `Bearer ${token}`
		},
	});

	return await resp.json();
};

const twitch = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/auth/twitch/app')) {
		// TODO
	} else if (req.url?.startsWith('/auth/twitch')) {
		if (req.url.startsWith('/auth/twitch/callback')) {
			try {
				const { token } = parseCookies(req.headers.cookie || '');
				const query: any = url.parse(req.url, true).query;
				const urlEncoded = new URLSearchParams();

				urlEncoded.append('client_id', clientId);
				urlEncoded.append('client_secret', clientSecret);
				urlEncoded.append('code', query.code);
				urlEncoded.append('grant_type', 'authorization_code');
				urlEncoded.append('redirect_uri', redirectUri);

				const respToken = await fetch(`https://id.twitch.tv/oauth2/token?${urlEncoded}`, {
					method: 'POST',
				});
				const jsonToken = await respToken.json();
				const respUserInfo = await fetch('https://api.twitch.tv/helix/users', {
					headers: {
						'Client-ID': clientId,
						'Authorization': `Bearer ${jsonToken.access_token}`,
					}
				});
				const jsonUserInfo = await respUserInfo.json();

				if (jsonUserInfo.error) {
					throw new Error(jsonUserInfo.error);
				}

				authorizeUser(token, {
					...jsonUserInfo,
					_authType: 'twitch',
				});

				res.writeHead(302, { Location: host });
				res.end();
			} catch (error) {
				Log('Twitch auth error:', error);

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/twitch">попробуйте ещё раз</a>');
			}

		} else {
			const urlEncoded = new URLSearchParams();

			urlEncoded.append('response_type', 'code');
			urlEncoded.append('grant_type', 'authorization_code');
			urlEncoded.append('client_id', clientId);
			urlEncoded.append('redirect_uri', redirectUri);
			urlEncoded.append('scope', 'user:read:email');

			const url = `https://id.twitch.tv/oauth2/authorize?${urlEncoded}`;

			res.writeHead(302, { Location: url });
			res.end();
		}

		return true;
	}

	return false;
};

export default twitch;
