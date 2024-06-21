const { getMessages } = require('../utils/chat');

const messages = async (req, res) => {
	const messages = await getMessages();

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(messages.map((message) => ({
		time: message.time,
		text: message.text,
		name: message.name,
		area: message.area,
	}))));
};

module.exports = {
	messages,
};
