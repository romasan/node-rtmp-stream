const url = require('url');
const { getPostPayload } = require('../../helpers');
const {
	addSystemMessage,
	getMessages,
	updateMessage,
	deleteMessage,
	deleteMessagesByNick,
} = require('../../utils/chat');

const chat = async (req, res) => {
	if (req.method === 'POST') {
		const { text } = await getPostPayload(req, 'json');

		addSystemMessage(text);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	if (req.method === 'PATCH') {
		const { id, text } = await getPostPayload(req, 'json');

		updateMessage(id, text);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	if (req.method === 'DELETE') {
		const { id, nick } = await getPostPayload(req, 'json');

		if (nick) {
			deleteMessagesByNick(nick);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');

			return;
		}

		deleteMessage(id);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	const query = url.parse(req.url, true).query;
	const messages = await getMessages(query.count);

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(messages));

};

module.exports = {
	chat,
};
