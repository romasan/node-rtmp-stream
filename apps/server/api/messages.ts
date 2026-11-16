import { IncomingMessage, ServerResponse } from 'http';
import { getMessages } from '../utils/chat';

export const messages = async (req: IncomingMessage, res: ServerResponse) => {
	const messages = await getMessages() as any[];

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(messages.map((message) => ({
		time: message.time,
		text: message.text,
		name: message.name,
		area: message.area,
	}))));
};
