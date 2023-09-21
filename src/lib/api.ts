import ee from '../lib/ee';

const { hostname, protocol } = document.location;
const APIhost = `${protocol}//${hostname === 'localhost' ? '' : 'api.'}${hostname.replace('www.', '')}:8080`;

export const addPix = async ({ x, y, color }) => {
	try {
		const resp = await fetch(`${APIhost}/pix`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ x, y, color }),
		});

		const text = await resp.text();

		ee.emit('ws:pix', text);
	} catch (e) {}
};

export const start = async () => {
		const resp = await fetch(`${APIhost}/start`, {
			credentials: 'include',
		});

		return await resp.text();
};

export const sendChatMessage = (message: string) => {
	return fetch(`${APIhost}/chat`, {
		method: 'PUT',
		credentials: 'include',
		body: message,
	});
};

export const getChatMessages = async () => {
	const resp = await fetch(`${APIhost}/messages`, {
		credentials: 'include',
	});

	return await resp.json();
};
