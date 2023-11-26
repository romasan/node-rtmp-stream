const fetch = require("node-fetch");
const url = require('url');
require('dotenv').config();

const  { addNewUser } = require('../auth');

const { parseCookies } = require('./helpers');

const {
	TWITCH_AUTH_CLIENT_ID,
	TWITCH_AUTH_CLIENT_SECRET,
	TWITCH_AUTH_REDIRECT_URI,
	WS_SERVER_ORIGIN,
} = process.env;

const twitch = async (req, res) => {
	if (req.url.startsWith('/auth/twitch')) {
		if (req.url.startsWith('/auth/twitch/callback')) {
			console.log('==== #0');
			try {
				console.log('==== #2');
				const { token } = parseCookies(req.headers.cookie || '');
				const query = url.parse(req.url, true).query;

				const urlEncoded = new URLSearchParams();
				urlEncoded.append('client_id', TWITCH_AUTH_CLIENT_ID);
				urlEncoded.append('client_secret', TWITCH_AUTH_CLIENT_SECRET);
				urlEncoded.append('code', query.code);
				urlEncoded.append('grant_type', 'authorization_code');
				urlEncoded.append('redirect_uri', TWITCH_AUTH_REDIRECT_URI);

				console.log('==== #3');

				const respToken = await fetch(`https://id.twitch.tv/oauth2/token?${urlEncoded}`, {
					method: 'POST',
				});

				console.log('==== #4');

				const jsonToken = await respToken.json();

				console.log('==== #5');

				const respUserInfo = await fetch('https://api.twitch.tv/helix/users', {
					headers: {
						'Client-ID': TWITCH_AUTH_CLIENT_ID,
						'Authorization': `Bearer ${jsonToken.access_token}`,
					}
				});

				console.log('==== #6');

				const jsonUserInfo = await respUserInfo.json();

				console.log('==== #7');

				if (jsonUserInfo.error) {
					throw new Error(jsonUserInfo.error);
				}

				console.log('==== #8');

				addNewUser(token, {
					...jsonUserInfo,
					_authType: 'twitch',
				});

				console.log('==== #9');

				res.writeHead(302, { Location: WS_SERVER_ORIGIN });
				res.end();
			} catch (error) {
				console.log('Twitch auth error:', error);

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/twitch">попробуйте ещё раз</a>');
			}

		} else {
			console.log('==== #10');
			const urlEncoded = new URLSearchParams();
			urlEncoded.append('response_type', 'code');
			urlEncoded.append('grant_type', 'authorization_code');
			urlEncoded.append('client_id', TWITCH_AUTH_CLIENT_ID);
			urlEncoded.append('redirect_uri', TWITCH_AUTH_REDIRECT_URI);
			urlEncoded.append('scope', 'user:read:email');

			const url = `https://id.twitch.tv/oauth2/authorize?${urlEncoded}`;

			res.writeHead(302, { Location: url });
			res.end();
		}

		console.log('==== #11');

		return true;
	}

	console.log('==== #12');

	return false;
};

module.exports = twitch;
