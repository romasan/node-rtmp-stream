import ee from './ee';

let ws: WebSocket | null = null;

const reduceMessage = ({ data }: MessageEvent) => {
	if (data === '3') {
		return;
	}

	let json = null;
	try {
		json = JSON.parse(
			data.toString()
		);
	} catch (e) {/* */}

	const { event, payload } = json;

	if (event && payload) {
		ee.emit(`ws:${event}`, payload);
	}
};

const ping = () => {
	if (ws) {
		ws.send('2');
	}
};

let timer: number = -1;

const { hostname, protocol, hash } = document.location;
const isLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1');
export const WSHost = `${isLocalhost ? '' : 'api.'}${isLocalhost ? 'localhost' : hostname.replace('www.', '')}`;
const WSProtocol = (protocol === 'https:' || hash === '#secured') ? 'wss' : 'ws';

export const connect = (status?: string) => {
	ws = new WebSocket(`${WSProtocol}://${WSHost}`);

	ws.onerror = console.error;

	ws.onopen = () => {
		clearInterval(timer);
		timer = Number(setInterval(ping, 10_000));

		ee.emit('ws:connect', status || true);
	};

	ws.onmessage = reduceMessage;

	ws.onclose = () => {
		clearInterval(timer);
		setTimeout(connect, 10_000);

		ee.emit('ws:connect', false);
	};
};
