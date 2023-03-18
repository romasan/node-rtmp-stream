require('dotenv').config();
const fetch = require("node-fetch");
const WebSocket = require("ws");
let ws = null;

const { USER_AGENT, TOKEN_HOST, WS_SERVER, ORIGIN, WS_CHANNEL } = process.env;

let id = 1;

const wsSend = (data) => {
	ws.send(JSON.stringify({
		id: id++,
		...data,
	}));
};

const wsAuth = (token) => {
	wsSend({
		params: {
			name: 'js',
			token,
		}
	});
};

const reduceMessage = (data) => {
	let json = null;
	try {
		json = JSON.parse(
			data.toString()
		);
	} catch (e) {}
	if (json?.result?.channel === WS_CHANNEL) {
		const from = json.result?.data?.data?.data?.author?.nick;
		const message = json.result.data.data.data.data
			.filter((item) => item.type === 'text')
			.filter((item) => item.content)
			.map((item) => JSON.parse(item.content)[0])
			.join('\n');
			console.log(`${from}: "${message}"`);
	}
}

const connect = ({ token }) => {
	ws = new WebSocket(WS_SERVER, {
		headers: {
			origin: ORIGIN
		}
	});

	ws.on('error', console.error);

	ws.on('open', () => {
		wsAuth(token);
		wsSend({
			method: 1,
			params: {
				channel: WS_CHANNEL
			}
		});
	});

	ws.on('message', reduceMessage);
}

const init = () => {
	fetch(TOKEN_HOST, {
		headers: {
			'X-From-Id': USER_AGENT
		}
	})
	.then((response) => response.json())
	.then(connect);
}

init();
