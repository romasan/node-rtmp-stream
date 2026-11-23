import { APIhost } from '../../helpers';
import { ChatMessage } from './model';

export const CHAT_LIMITS = [50, 100, 300];
const request = async (command: string, options?: RequestInit) => {
	let response: Response;
	try {
		response = await fetch(`${APIhost}/admin/${command}`, { ...options, credentials: 'include' });
	} catch {
		throw new Error('Нет связи с сервером. Попробуйте ещё раз.');
	}
	if (response.status === 401) throw new Error('Сессия истекла. Войдите снова.');
	if (response.status === 403) throw new Error('Недостаточно прав для модерации чата.');
	if (!response.ok) throw new Error('Сервер не подтвердил запрос. Попробуйте ещё раз.');
	return response;
};

export const loadMessages = async (count: number): Promise<ChatMessage[]> => {
	if (!CHAT_LIMITS.includes(count)) throw new Error('Выберите количество сообщений из списка.');
	const response = await request(`chat?count=${count}`);
	let data: any;
	try {
		data = await response.json();
	} catch {
		throw new Error('Не удалось прочитать сообщения. Попробуйте обновить ленту.');
	}
	if (!Array.isArray(data) || !data.every(row => row && typeof row.id === 'string' && row.id && typeof row.text === 'string')) {
		throw new Error('Сервер вернул некорректный список сообщений. Попробуйте обновить ленту.');
	}
	return data.map(row => {
		const parsedTime = typeof row.time === 'number' ? row.time
			: typeof row.time === 'string' && row.time.trim() ? (Number.isFinite(Number(row.time)) ? Number(row.time) : Date.parse(row.time)) : NaN;
		return {
			id: row.id,
			name: typeof row.name === 'string' ? row.name : '',
			area: typeof row.area === 'string' ? row.area : '',
			text: row.text,
			time: Number.isFinite(new Date(parsedTime).getTime()) ? parsedTime : null,
		};
	});
};

const write = async (command: string, method: string, payload: Record<string, string>) => {
	const response = await request(command, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
	if ((await response.text()).trim() !== 'ok') throw new Error('Сервер не подтвердил действие. Попробуйте ещё раз.');
};
export const editMessage = (id: string, text: string) => write('chat', 'PATCH', { id, text });
export const sendMessage = (text: string) => write('chat', 'POST', { text });
export const deleteMessage = (id: string) => write('chat', 'DELETE', { id });
export const deleteAuthorMessages = (nick: string) => write('chat', 'DELETE', { nick });
export const muteAuthor = (nick: string) => write('ban', 'PUT', { type: 'mute', value: nick });
