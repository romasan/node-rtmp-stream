const fetch = require('node-fetch');
const url = require('url');

const { authorizeUser } = require('../../utils/auth');
const { parseCookies } = require('../../helpers');
const {
	server: {
		host,
		auth: {
			discord: { clientId, clientSecret, redirectUri },
		},
	},
} = require('../../config.json');

const discord = async (req, res) => {
	if (req.url.startsWith('/auth/discord')) {
		if (req.url.startsWith('/auth/discord/callback')) {
			try {
				const { token } = parseCookies(req.headers.cookie || '');
				const query = url.parse(req.url, true).query;
				const urlEncoded = new URLSearchParams();

				urlEncoded.append('client_id', clientId);
				urlEncoded.append('client_secret', clientSecret);
				urlEncoded.append('code', query.code);
				urlEncoded.append('grant_type', 'authorization_code');
				urlEncoded.append('redirect_uri', redirectUri);
				urlEncoded.append('scope', 'identify+email');

				const respToken = await fetch(`https://discord.com/api/oauth2/token?${urlEncoded}`, {
					method: 'POST',
					body: urlEncoded,
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				});
				const jsonToken = await respToken.json();
				const respUserInfo = await fetch('https://discord.com/api/users/@me', {
					headers: {
						'authorization': `${jsonToken.token_type} ${jsonToken.access_token}`,
					}
				});
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
				console.log('Discord auth error:', error);

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/discord">попробуйте ещё раз</a>');
			}

		} else {
			const urlEncoded = new URLSearchParams();

			urlEncoded.append('client_id', clientId);
			urlEncoded.append('response_type', 'code');
			urlEncoded.append('redirect_uri', redirectUri);

			const url = `https://discord.com/api/oauth2/authorize?${urlEncoded}&scope=identify+email`;

			res.writeHead(302, { Location: url });
			res.end();
		}

		return true;
	}

	return false;
};

module.exports = discord;
