const { hostname, protocol } = document.location;
const isLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1');
export const APIhost = `${protocol}//${isLocalhost ? '' : 'api.'}${hostname.replace('www.', '')}${isLocalhost ? ':8080' : ''}`;

export const getQuery = (url: string, query: Record<string, string | number>) => url + '?' + Object.entries(query)
	.map(([key, value]) => [key, value].join('='))
	.join('&');

export const get = async (command: string, type = 'JSON') => {
	const resp = await fetch(`${APIhost}/admin/${command}`, {
		credentials: 'include',
	});

	if (type === 'JSON') {
		return await resp.json();
	}
	
	return await resp.text();
};

export const push = async (command: string, payload?: any, method = 'POST', type: string | boolean = 'JSON') => {
	const resp = await fetch(`${APIhost}/admin/${command}`, {
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

export const post = (command: string, payload?: any, type: string | boolean = 'JSON') => {
	return push(command, payload, 'POST', type);
};

export const put = (command: string, payload?: any, type: string | boolean = 'JSON') => {
	return push(command, payload, 'PUT', type);
};

export const patch = (command: string, payload?: any, type: string | boolean = 'JSON') => {
	return push(command, payload, 'PATCH', type);
};

export const drop = (command: string, payload?: any, type: string | boolean = 'JSON') => {
	return push(command, payload, 'DELETE', type);
};

export const saveToFile = (text: string, fileName: string, type = 'text/json') => {
	const blob = new Blob([text], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');

	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};
