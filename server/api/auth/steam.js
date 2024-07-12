const fetch = require('node-fetch');

const { authorizeUser } = require('../../utils/auth');
const { Log } = require('../../utils/log');
const { parseCookies } = require('../../helpers');
const {
	server: {
		host,
		auth: {
			steam: { key, redirectUri },
		},
	},
} = require('../../config.json');

const steam = async (req, res) => {
	if (req.url.startsWith('/auth/steam')) {
		if (req.url.startsWith('/auth/steam/callback')) {
			try {
				const { token } = parseCookies(req.headers.cookie || '');
				const [, steamID] = req.url.match(/openid%2Fid%2F([^&]*)/);
				const urlEncoded = new URLSearchParams();

				urlEncoded.append('key', key);
				urlEncoded.append('steamids', steamID);

				const respUserInfo = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${urlEncoded}`);
				const jsonUserInfo = await respUserInfo.json();

				if (!jsonUserInfo.response.players[0]) {
					throw new Error('Error: failed GetPlayerSummaries');
				}

				authorizeUser(token, {
					...jsonUserInfo,
					_authType: 'steam',
				});

				res.writeHead(302, { Location: host });
				res.end();
			} catch (error) {
				Log('Steam auth error:', error);

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('Ошибка, <a href="/auth/steam">попробуйте ещё раз</a>');
			}

		} else {
			const urlEncoded = new URLSearchParams();

			urlEncoded.append('openid.mode', 'checkid_setup');
			urlEncoded.append('openid.ns', 'http://specs.openid.net/auth/2.0');
			urlEncoded.append('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');
			urlEncoded.append('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
			urlEncoded.append('openid.return_to', redirectUri);

			const url = `https://steamcommunity.com/openid/login?${urlEncoded}`;

			res.writeHead(302, { Location: url });
			res.end();
		}

		return true;
	}

	return false;
};

module.exports = steam;
