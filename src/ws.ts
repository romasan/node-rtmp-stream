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

	if (event && payload) {
		ee.emit(`ws:${event}`, payload);
	}
}

export const sendMessage = (event: string, payload: any) => {
	if (ws) {
		ws.send(JSON.stringify({ event, payload }));
	}
};

const ping = () => {
	if (ws) {
		ws.send('2');
	}
}

let timer = -1;

const { hostname, protocol, hash } = document.location;
export const WSHost = `${hostname === 'localhost' ? '' : 'api.'}${hostname.replace('www.', '')}:8080`;
const WSProtocol = (protocol === 'https:' || hash === '#secured') ? 'wss' : 'ws';

export const connect = () => {
	ws = new WebSocket(`${WSProtocol}://${WSHost}`);

	ws.onerror = console.error;

	ws.onopen = () => {
		// => auth uuid | null
		// <= ok | uuid

		clearInterval(timer);
		timer = setInterval(ping, 1000);
	};

	ws.onmessage = reduceMessage;

	ws.onclose = () => {
		clearInterval(timer);
		setTimeout(connect, 10 * 1000);
	}
}