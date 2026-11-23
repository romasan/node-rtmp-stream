import { APIhost } from '../../helpers';

export type BanType = 'token' | 'ip' | 'nick' | 'mute';
export type BanList = Record<BanType, Record<string, true | number>>;
export const BAN_TYPES: BanType[] = ['token', 'ip', 'nick', 'mute'];

const request = async (command: string, options?: RequestInit) => {
	let response: Response;
	try {
		response = await fetch(`${APIhost}/admin/${command}`, { ...options, credentials: 'include' });
	} catch {
		throw new Error('Нет связи с сервером. Попробуйте ещё раз.');
	}
	if (response.status === 401) throw new Error('Сессия истекла. Войдите снова.');
	if (response.status === 403) throw new Error('Недостаточно прав для управления банами.');
	if (!response.ok) throw new Error('Сервер не подтвердил запрос. Попробуйте ещё раз.');
	return response;
};

export const loadBans = async (): Promise<BanList> => {
	const response = await request('getBans');
	let data: Record<BanType, Record<string, boolean | number>>;
	try {
		data = await response.json();
	} catch {
		throw new Error('Не удалось прочитать список банов. Попробуйте обновить его.');
	}
	if (!data || !BAN_TYPES.every(type => {
		const list = data[type];
		return list && typeof list === 'object' && !Array.isArray(list) &&
			Object.values(list).every(value => typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)));
	})) {
		throw new Error('Сервер вернул некорректный список банов. Попробуйте обновить его.');
	}
	// Legacy files retain false entries; checkBan also treats these as inactive.
	return Object.fromEntries(BAN_TYPES.map(type => [
		type, Object.fromEntries(Object.entries(data[type]).filter(([, value]) => value !== false)),
	])) as BanList;
};

const updateBan = async (command: string, method: string, type: BanType, value: string): Promise<void> => {
	const response = await request(command, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type, value }),
	});
	if ((await response.text()).trim() !== 'ok') {
		throw new Error('Сервер не подтвердил действие. Попробуйте ещё раз.');
	}
};

export const addBan = (type: BanType, value: string) => updateBan('ban', 'PUT', type, value);
export const removeBan = (type: BanType, value: string) => updateBan('unban', 'PATCH', type, value);
