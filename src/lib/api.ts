import ee from '../lib/ee';

const { hostname, protocol } = document.location;
const isLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1');
export const APIhost = `${protocol}//${isLocalhost ? '' : 'api.'}${hostname.replace('www.', '').replace('tg.', '')}${isLocalhost ? ':8080' : ''}`;
export const staticHost = document.location.hash.indexOf('staticHost=') > 0
	? document.location.hash.split('staticHost=').pop()
	: 'https://static.pixelbattles.ru';

export enum EAuthType {
	cookie,
	header,
}

let authType = EAuthType.cookie;
let authToken = '';

export const setAuthType = (type: EAuthType) => authType = type;
export const setAuthToken = (token: string) => authToken = token;
	
const _fetch = (url: string, options?: any) => fetch(url, {
	...(options || {}),
	headers: {
		...(options?.headers || {}),
		...(authType === EAuthType.header ? {
			authorization: `Bearer ${authToken}`,
		} : {}),
	},
});

export const addPix = async ({ x, y, color }: { x: number; y: number; color: string; }) => {
	try {
		const resp = await _fetch(`${APIhost}/pix`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ x, y, color }),
		});

		const text = await resp.text();

		ee.emit('pix', text);
	} catch (e) {/* */}
};

export const start = async () => {
	const resp = await _fetch(`${APIhost}/start`, {
		credentials: 'include',
	});

	return await resp.text();
};

export const sendChatMessage = (message: string) => {
	return _fetch(`${APIhost}/chat`, {
		method: 'PUT',
		credentials: 'include',
		body: message,
	});
};

export const getChatMessages = async () => {
	const resp = await _fetch(`${APIhost}/messages`, {
		credentials: 'include',
	});

	return await resp.json();
};

export const getStats = async () => {
	const resp = await _fetch(`${APIhost}/stats`, {
		credentials: 'include',
	});

	return await resp.json();
};

export const getPixel = async (x: number, y: number) => {
	const search = new URLSearchParams({ x, y }).toString();
	const resp = await _fetch(`${APIhost}/pix?${search}`, {
		credentials: 'include',
	});

	return await resp.json();
};

export const sendCursor = async (x: number, y: number, color: string) => {
	await _fetch(`${APIhost}/cursor`, {
		method: 'PUT',
		credentials: 'include',
		body: JSON.stringify({ x, y, color }),
	});
};

export const fetchTimelapseSeasons = async () => {
	const resp = await _fetch(`${staticHost}/timelapse/index.json`);

	return await resp.json();
};

export const fetchTimelapse = async (name: string) => {
	const resp = await _fetch(`${staticHost}/timelapse/${name}/index.json`);

	return await resp.json();
};

export const fetchTimelapsePartBin = (name: string, index: number) => {
	return _fetch(`${staticHost}/timelapse/${name}/${index}.bin`);
};

export const authTgMiniApp = async () => {
	const tg = (window as any).Telegram.WebApp;

	const resp = await _fetch(`${APIhost}/auth/telegram/app`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		credentials: 'include',
		body: tg.initData
	})

	return await resp.text();
};