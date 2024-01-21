import ee from '../lib/ee';

const { hostname, protocol } = document.location;
const isLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1');
export const APIhost = `${protocol}//${isLocalhost ? '' : 'api.'}${isLocalhost ? 'localhost' : hostname.replace('www.', '')}:8080`;

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

		ee.emit('pix', text);
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

export const getStats = async () => {
	const resp = await fetch(`${APIhost}/stats`, {
		credentials: 'include',
	});

	return await resp.json();
};

export const getPixel = async (x: number, y: number) => {
	const search = new URLSearchParams({ x, y }).toString();
	const resp = await fetch(`${APIhost}/pix?${search}`, {
		credentials: 'include',
	});

	return await resp.json();
};

export const fetchTimelapse = async (name: string) => {
	const resp = await fetch(`${APIhost}/timelapse/${name}/index.json`, {
		credentials: 'include',
	});

	return await resp.json();
};

export const fetchTimelapsePartBin = (name: string, index: number) => {
	return fetch(`${APIhost}/timelapse/${name}/${index}.bin`, {
		credentials: 'include',
	});
};
