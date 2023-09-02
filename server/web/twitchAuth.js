const TwitchAuth = require('twitch-auth');
require('dotenv').config();

const {
	TWITCH_AUTH_CLIENT_ID,
	TWITCH_AUTH_CLIENT_SECRET,
	TWITCH_AUTH_REDIRECT_URI,
} = process.env;

const twitchAuth = new TwitchAuth({
	client_id: TWITCH_AUTH_CLIENT_ID,
	client_secret: TWITCH_AUTH_CLIENT_SECRET,
	redirect_uri: TWITCH_AUTH_REDIRECT_URI,
	scopes: ['user:read:email'],
});

const twitch = async (req, res) => {
	if (req.url.startsWith('/auth/twitch')) {
		if (req.url.startsWith('/auth/twitch/callback')) {
			const code = req.url.split('=')[1];
			const token = await twitchAuth.getAccessToken(code);
			const userInfo = await twitchAuth.getUserInfo(token);

			// save to auth
			console.log(token);// twitch token
			console.log(userInfo);

			res.writeHead(302, { Location: '/' });
			res.end();
			// close page
			// reload parent page
		} else {
			const url = twitchAuth.getAuthorizationUrl();
			res.writeHead(302, { Location: url });
			res.end();
		}

		return true;
	}

	return false;
};

module.exports = twitch;
