const MONTHS = [
	'января',
	'февраля',
	'марта',
	'апреля',
	'мая',
	'июня',
	'июля',
	'августа',
	'сентября',
	'октября',
	'ноября',
	'декабря',
];

export const formatDate = (date: number) => {
	const currentYear = new Date().getFullYear();
	const _date = new Date(Number(date));

	let [sec, min, hour, day, month, year] = ['getSeconds', 'getMinutes', 'getHours', 'getDate', 'getMonth', 'getFullYear']
		.map((key) => _date[key]());

	month = MONTHS[month];

	return `${day} ${month}${currentYear === year ? '' : ` ${year}`} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
