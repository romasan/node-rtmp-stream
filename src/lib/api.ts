const { hostname, protocol } = document.location;
const APIhost = `${protocol}//${hostname === 'localhost' ? '' : 'api.'}${hostname.replace('www.', '')}:8080`;

export const addPix = ({ x, y, color }) => {
	fetch(`${APIhost}/pix`, {
		method: 'PUT',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ x, y, color }),
	});
};

export const start = async () => {
		const resp = await fetch(`${APIhost}/start`, {
			credentials: 'include',
		});

		return await resp.text();
};
