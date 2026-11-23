import { APIhost } from '../../helpers';
import { CanvasSettings } from './model';

const request = async (command: string, options?: RequestInit) => {
	let response: Response;
	try {
		response = await fetch(`${APIhost}/admin/${command}`, { ...options, credentials: 'include' });
	} catch {
		throw new Error('Нет связи с сервером. Попробуйте ещё раз.');
	}
	if (response.status === 401) throw new Error('Сессия истекла. Войдите снова.');
	if (response.status === 403) throw new Error('Недостаточно прав для изменения полотна.');
	if (!response.ok) throw new Error('Сервер не подтвердил запрос. Попробуйте ещё раз.');
	return response;
};

const read = async (command: string): Promise<any> => {
	const response = await request(command);
	try {
		return await response.json();
	} catch {
		throw new Error('Не удалось прочитать настройки. Попробуйте обновить их.');
	}
};

const integer = (value: unknown) => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isSafeInteger(Number(value));

export const loadCanvas = async (): Promise<CanvasSettings> => {
	const data = await read('expand');
	if (!data || !['width', 'height', 'shiftX', 'shiftY'].every(key => integer(data[key])) ||
		Number(data.width) <= 0 || Number(data.height) <= 0 || typeof data.colorScheme !== 'string' || !data.colorScheme) {
		throw new Error('Не удалось прочитать настройки полотна. Попробуйте обновить их.');
	}
	return { width: Number(data.width), height: Number(data.height), shiftX: Number(data.shiftX), shiftY: Number(data.shiftY), colorScheme: data.colorScheme };
};

export const loadPaused = async (): Promise<boolean> => {
	const data = await read('pause');
	// An unset paused value is omitted from JSON by the existing server.
	if (!data || typeof data !== 'object' || Array.isArray(data) || (data.paused !== undefined && typeof data.paused !== 'boolean')) {
		throw new Error('Не удалось прочитать настройки паузы. Попробуйте обновить их.');
	}
	return data.paused === true;
};

const write = async (command: string, options: RequestInit) => {
	const response = await request(command, options);
	if ((await response.text()).trim() !== 'ok') throw new Error('Сервер не подтвердил изменение. Попробуйте ещё раз.');
};

export const saveCanvas = (settings: CanvasSettings) => write('expand', {
	method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
});
export const savePaused = (paused: boolean) => write('pause', { method: paused ? 'PUT' : 'DELETE' });
