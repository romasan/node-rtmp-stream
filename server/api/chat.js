const { parseCookies, getPostPayload } = require('../helpers');
const { getUserData } = require('../utils/auth');
const { checkBan } = require('../utils/bans');
const { addMessage } = require('../utils/chat');
const chat = async (req, res) => {
	if (req.method === 'PUT') {
		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req);

		const user = getUserData(token);

		if (checkBan({ nick: user?.name })) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed add message (banned user)', token);

			return;
		}

		if (typeof postPayload === 'string') {
			addMessage(token, postPayload);

			console.log('Chat new message:', postPayload);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');
		}
	} else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');
	}
};

module.exports = {
	chat,
};
