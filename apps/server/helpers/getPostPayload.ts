import { IncomingMessage } from 'http';

export const getPostPayload = (req: IncomingMessage, type = 'text') => {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk: string) => {
			body += chunk.toString();
		});

		req.on('end', () => {
			if (type === 'json') {
				let json = {};

				try {
					json = JSON.parse(body);
				} catch (ignore) {/* */}

				resolve(json);

				return;
			}

			resolve(body);
		});

		req.on('error', () => {
			reject();
		});
	});
};
