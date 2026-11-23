import { APIhost } from '../../helpers';
import { CanvasGeometry } from '../../../Canvas/marker';
import { OnlineConnection } from './model';

export interface LastPixel { x: number; y: number; color: string | null; uuid: string | null; name: string | null; ip: string | null; age: number | null; }
export interface OverviewStats {
	online: { unique: number | null; open: number | null; all: number | null; active: number | null; };
	perMin: number | null;
	perHour: number | null;
	total: number | null;
	empty: number | null;
	uptime: number | null;
	lastPixel: LastPixel | null;
}
const numeric = (value: unknown): number | null => {
	if (typeof value !== 'number' && !(typeof value === 'string' && value.trim())) return null;
	return Number.isFinite(Number(value)) ? Number(value) : null;
};
const counter = (value: unknown): number | null => {
	const result = numeric(value);
	return result !== null && result >= 0 ? result : null;
};
const text = (value: unknown) => typeof value === 'string' && value ? value : null;
const read = async (command: string, signal?: AbortSignal): Promise<any> => {
	let response: Response;
	try { response = await fetch(`${APIhost}/admin/${command}`, { credentials: 'include', signal }); }
	catch (error) {
		if (signal?.aborted) throw error;
		throw new Error('Нет связи с сервером. Попробуйте ещё раз.');
	}
	if (response.status === 401) throw new Error('Сессия истекла. Войдите снова.');
	if (response.status === 403) throw new Error('Недостаточно прав для просмотра обзора.');
	if (!response.ok) throw new Error('Сервер не подтвердил запрос. Попробуйте ещё раз.');
	try { return await response.json(); }
	catch { throw new Error('Не удалось прочитать ответ сервера. Попробуйте обновить данные.'); }
};
export const loadStats = async (signal?: AbortSignal): Promise<OverviewStats> => {
	const raw = await read('stats', signal);
	if (!raw || !raw.online || typeof raw.online !== 'object' || !['uniq', 'open', 'all', 'countByActivity'].some(key => key in raw.online)) throw new Error('Сервер вернул некорректную сводку.');
	const x = numeric(raw.coord?.x);
	const y = numeric(raw.coord?.y);
	return {
		online: { unique: counter(raw.online.uniq), open: counter(raw.online.open), all: counter(raw.online.all), active: counter(raw.online.countByActivity) },
		perMin: counter(raw.perMin), perHour: counter(raw.perHour), total: counter(raw.total), empty: counter(raw.empty), uptime: counter(raw.uptime),
		lastPixel: x !== null && y !== null && Number.isSafeInteger(x) && Number.isSafeInteger(y)
			? { x, y, color: text(raw.color), uuid: text(raw.lastUserUUID), name: text(raw.lastUserName), ip: text(raw.lastUserIP), age: counter(raw.lastActivity) } : null,
	};
};
export const loadGeometry = async (signal?: AbortSignal): Promise<CanvasGeometry> => {
	const raw = await read('expand', signal);
	const values = ['width', 'height', 'shiftX', 'shiftY'].map(key => numeric(raw?.[key]));
	if (values.some(value => value === null || !Number.isSafeInteger(value)) || Number(values[0]) <= 0 || Number(values[1]) <= 0) throw new Error('Не удалось прочитать размеры полотна.');
	return { width: values[0]!, height: values[1]!, shiftX: values[2]!, shiftY: values[3]! };
};
export const loadOnline = async (signal?: AbortSignal): Promise<OnlineConnection[]> => {
	const raw = await read('onlineList', signal);
	if (!Array.isArray(raw) || !raw.every(row => row && typeof row === 'object' && !Array.isArray(row))) throw new Error('Сервер вернул некорректный список сессий.');
	return raw.map(row => ({ uuid: text(row.uuid), name: text(row.name) || '', active: row.active === true, lastActivity: counter(row.lastActivity) }));
};
export const findSessions = async (nick: string, signal?: AbortSignal): Promise<string[]> => {
	const raw = await read(`user?nick=${encodeURIComponent(nick)}`, signal);
	if (!raw || !Array.isArray(raw.uuids) || !raw.uuids.every((uuid: unknown) => typeof uuid === 'string')) throw new Error('Не удалось прочитать найденные сессии.');
	return Array.from(new Set(raw.uuids.filter(Boolean))) as string[];
};
