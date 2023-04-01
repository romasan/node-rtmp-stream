require('dotenv').config();
const ee = require('./ee');
const fetch = require("node-fetch");
const WebSocket = require("ws");
let ws = null;

const { USER_AGENT, API_HOST, USER_NAME, WS_HOST, ORIGIN } = process.env;

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

const reduceMessage = (data, channel) => {
	try {
		const json = JSON.parse(data.toString());

		if (json?.result?.channel === channel) {
			const from = json.result?.data?.data?.data?.author?.nick;
			const text = json.result.data.data.data.data
				.filter((item) => item.type === 'text')
				.filter((item) => item.content)
				.map((item) => JSON.parse(item.content)[0])
				.join('\n');
				ee.emit('message', {
					from,
					text,
				});
			}
	} catch (e) {
		console.log('Error: parse raw message', e);
	}
}

const connect = (token, channel) => {
	ws = new WebSocket(WS_HOST, {
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
				channel,
			}
		});
	});

	ws.on('message', (data) => reduceMessage(data, channel));
}

const init = () => {
	Promise.all([
		fetch(`${API_HOST}/v1/ws/connect`, {
			headers: {
				'X-From-Id': USER_AGENT
			}
		}),
		fetch(`${API_HOST}/v1/blog/${USER_NAME}/public_video_stream?from=layer`),
	]).then((resps) => {
		Promise.all(resps.map((resp) => resp.json())).then(([{ token }, { wsChatChannel }]) => {
			connect(token, wsChatChannel);
		})
	});
}

module.exports = {
	init,
}
