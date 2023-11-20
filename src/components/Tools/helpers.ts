const { hostname, protocol } = document.location;
const isLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1');
export const APIhost = `${protocol}//${isLocalhost ? '' : 'api.'}${isLocalhost ? 'localhost' : hostname.replace('www.', '')}:8080`;

export const get = async (command: string, type = 'JSON') => {
	const resp = await fetch(`${APIhost}/qq/${command}`, {
		credentials: 'include',
	});

	if (type === 'JSON') {
		return await resp.json();
	}
	
	return await resp.text();
};

export const push = async (command: string, payload?: any, method = 'POST', type = 'JSON') => {
	const resp = await fetch(`${APIhost}/qq/${command}`, {
		method,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: payload,
	});

	if (type === 'JSON') {
		return await resp.json();
	}

	return await resp.text();
};

export const post = (command: string, payload?: any, type = 'JSON') => {
	return push(command, payload, 'POST', type);
};

export const put = (command: string, payload?: any, type = 'JSON') => {
	return push(command, payload, 'PUT', type);
};

export const patch = (command: string, payload?: any, type = 'JSON') => {
	return push(command, payload, 'PATCH', type);
};