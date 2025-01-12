export const formatTime = (time: number, template?: string) => {
	const sec = Math.floor(time / 1000);
	const min = Math.floor(sec / 60);
	const hour = Math.floor(min / 60);
	const day = Math.floor(hour / 24);

	// "<d>d д., </d><h>h ч., </h><m>m мин., </m>s сек."" - 99 д., 99 ч., 99 мин., 99 сек. 
	// if (template) {
	// 	return template
	// 		.replace('DD', String(day).padStart(2, '0'))
	// 		.replace('D', day)
	// 		.replace('hh', String(hour).padStart(2, '0'))
	// 		.replace('h', hour)
	// 		.replace('mm', String(min).padStart(2, '0'))
	// 		.replace('m', min)
	// 		.replace('ss', String(sec).padStart(2, '0'))
	// 		.replace('s', sec);
	// }

	return `${day ? `${day} д. ` : ''}${hour ? `${String(hour % 24).padStart(2, '0')}:` : ''}${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
};
