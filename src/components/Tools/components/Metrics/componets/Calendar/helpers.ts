const day = 1000 * 60 * 60 * 24;

export const padStartWeek = (year: number, month: number) => {
	const date = new Date(year, month - 1, 1);

	return date.getDay() - 1;
};

export const getDaysInMonth = (year: number, month: number) => {
	const date = new Date(year, month - 1, 1);
	let time, index;

	for (
		time = date.getTime() + day;
		new Date(time).getMonth() === month - 1;
		time += day
	) {
		index = new Date(time).getDate();
	}

	return index;
};

export const getMonthsRange = ([fromYear, fromMonth]: number[], [toYear, toMonth]: number[]) => {
	const list = [];
	let time = new Date(fromYear, fromMonth, 1).getTime();

	for (
		let year = fromYear, month = fromMonth;
		time < new Date(toYear, toMonth, 1).getTime();
		year = new Date(time).getFullYear(), month = new Date(time).getMonth() + 1, time += getDaysInMonth(year, month) * day
	) {
		list.push([year, month])
	}

	list.push([toYear, toMonth]);

	return list.map(([year, month]) => `${year}-${String(month).padStart(2, '0')}`);
};

export const getMonthCalendar = (year: number, month: number) => {
	const list = Array(padStartWeek(year, month))
		.fill(null)
		.concat(Array(getDaysInMonth(year, month)).fill(null).map((_, index) => index + 1));
	const weeks = Math.ceil(list.length / 7);

	if (weeks * 7 > list.length) {
		list.push(...Array(weeks * 7 - list.length).fill(null))
	}

	return list.reduce((matrix, item) => {
		const lastList = matrix[matrix.length - 1];

		if (lastList.length < 7) {
				return matrix.slice(0, -1).concat([[...lastList, item]]);
		}

		return matrix.concat([[item]]);
	}, [[]]);
};

export const prepareHours = (list: number[]): number[][] => {
	const emptyList = Array(24).fill(null)
		.map((_, index) => (String(index).padStart(2, '0')))
		.reduce((list, key) => ({ ...list, [key]: 0}), {});

	return Object.entries({ ...emptyList, ...list })
		.sort(([a], [b]) => Number(a) > Number(b) ? 1 : -1);
};
