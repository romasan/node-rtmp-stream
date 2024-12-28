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

export const formatDate = (date: number, template?: string) => {
	const currentYear = new Date().getFullYear();
	const _date = new Date(Number(date));

	const [sec, min, hour, day, month, year] = ['getSeconds', 'getMinutes', 'getHours', 'getDate', 'getMonth', 'getFullYear']
		.map((key) => _date[key]());

	if (template) {
		return template
			.replace('Y?',currentYear === year ? '' : year)
			.replace(/[Y]+/, year)
			.replace('MMMM', MONTHS[month])
			.replace('MM', String(month + 1).padStart(2, '0'))
			.replace('M', month + 1)
			.replace('DD', String(day).padStart(2, '0'))
			.replace('D', day)
			.replace('hh', String(hour).padStart(2, '0'))
			.replace('h', hour)
			.replace('mm', String(min).padStart(2, '0'))
			.replace('m', min)
			.replace('ss', String(sec).padStart(2, '0'))
			.replace('s', sec);
	}

	return `${day} ${MONTHS[month]}${currentYear === year ? '' : ` ${year}`} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
