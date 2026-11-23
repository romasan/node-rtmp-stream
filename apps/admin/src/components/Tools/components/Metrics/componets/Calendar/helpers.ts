export const padStartWeek = (year: number, month: number) =>
	(new Date(year, month - 1, 1).getDay() + 6) % 7;

export const getDaysInMonth = (year: number, month: number) =>
	new Date(year, month, 0).getDate();

export const getMonthsRange = ([fromYear, fromMonth]: number[], [toYear, toMonth]: number[]) => {
	const months: string[] = [];
	for (let index = fromYear * 12 + fromMonth - 1; index <= toYear * 12 + toMonth - 1; index++) {
		months.push(`${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`);
	}
	return months;
};

export const getMonthCalendar = (year: number, month: number): (number | null)[][] => {
	const cells: (number | null)[] = Array(padStartWeek(year, month)).fill(null);
	for (let date = 1; date <= getDaysInMonth(year, month); date++) cells.push(date);
	while (cells.length % 7) cells.push(null);
	return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
};

export const prepareHours = (list?: Record<string, number> | number[]): [string, number][] =>
	Array.from({ length: 24 }, (_, hour) => {
		const key = String(hour).padStart(2, '0');
		const values = list as Record<string, number> | undefined;
		return [key, Math.max(0, Number(values?.[key] ?? values?.[String(hour)]) || 0)];
	});

export const getChartPoints = (data: [string, number][], width: number, height: number) => {
	const max = Math.max(1, ...data.map(([, value]) => value));
	return data.map(([, value], index) =>
		`${index * width / Math.max(1, data.length - 1)},${height - value / max * height}`
	).join(' ');
};
