export interface OnlineConnection { uuid: string | null; name: string; active: boolean; lastActivity: number | null; }
export interface OnlineSession extends OnlineConnection { key: string; connections: number; }

export const groupSessions = (rows: OnlineConnection[]): OnlineSession[] => {
	const groups = new Map<string, OnlineSession>();
	rows.forEach((row, index) => {
		const key = row.uuid || `unknown-${index}`;
		const previous = groups.get(key);
		if (!previous) { groups.set(key, { ...row, key, connections: 1 }); return; }
		previous.connections++;
		previous.active = previous.active || row.active;
		if (row.lastActivity !== null && (previous.lastActivity === null || row.lastActivity > previous.lastActivity)) {
			previous.lastActivity = row.lastActivity;
			if (row.name) previous.name = row.name;
		}
		if (!previous.name && row.name) previous.name = row.name;
	});
	return Array.from(groups.values()).sort((a, b) => Number(b.active) - Number(a.active) || (b.lastActivity || 0) - (a.lastActivity || 0) || a.key.localeCompare(b.key));
};
export const filterSessions = (rows: OnlineSession[], query: string, activeOnly: boolean): OnlineSession[] => {
	const search = query.trim().toLocaleLowerCase();
	return rows.filter(row => (!activeOnly || row.active) && (!search || row.name.toLocaleLowerCase().includes(search) || row.uuid?.toLocaleLowerCase().includes(search)));
};
export const getCoverage = (empty: number | null, geometry: { width: number; height: number }) => {
	const capacity = geometry.width * geometry.height;
	if (!Number.isSafeInteger(capacity) || capacity <= 0 || empty === null || !Number.isSafeInteger(empty) || empty < 0 || empty > capacity) return null;
	return { capacity, free: empty, occupied: capacity - empty, percent: (capacity - empty) / capacity * 100 };
};
export const formatDuration = (value: number | null): string => {
	if (value === null || !Number.isFinite(value) || value < 0) return '—';
	const seconds = Math.floor(value / 1000);
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor(seconds / 3600) % 24;
	const minutes = Math.floor(seconds / 60) % 60;
	if (days) return `${days} д. ${hours} ч. ${minutes} мин.`;
	if (hours) return `${hours} ч. ${minutes} мин.`;
	if (minutes) return `${minutes} мин. ${seconds % 60} с`;
	return `${seconds} с`;
};
