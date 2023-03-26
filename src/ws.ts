import ee from './ee';

let ws: any = null;

const reduceMessage = ({ data }: any) => {
	if (data === '3') {
		return;
	}

	let json = null;
	try {
		json = JSON.parse(
			data.toString()
		);
	} catch (e) {}

	console.log('==== message receive:', json);

	const { event, payload } = json;

	if (event === 'drawPix') {
		ee.emit('drawPix', payload);
	}

	// event => auth
	// w = window.open('https://vkplay.live/pixel_battle/only-chat', '', 'width=500,height=500')
	// event <= linked
	// w.close()
}

export const sendMessage = (data: any) => {
	if (ws) {
		ws.send(JSON.stringify(data))
	}
};

const ping = () => {
	if (ws) {
		ws.send('2');
	}
}

let timer = -1;

export const connect = () => {
	ws = new WebSocket('ws://localhost:8080');

	ws.onerror = console.error;

	ws.onopen = () => {
		console.log('==== ws open');

		// => auth uuid | null
		// <= ok | uuid

		clearInterval(timer);
		timer = setInterval(ping, 1000);
	};

	ws.onmessage = reduceMessage;

	ws.onclose = () => {
		console.log('==== ws close');
		clearInterval(timer);
		setTimeout(connect, 10 * 1000);
	}
}