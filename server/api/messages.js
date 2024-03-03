const { getMessages } = require('../utils/chat');

const messages = (req, res) => {
	const messages = getMessages();

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end(JSON.stringify(messages));
};

module.exports = {
	messages,
};
