import { formatDate } from '../helpers/formatDate';

export const Log = (...attrs: any[]) => {
	const datetime = formatDate(Date.now(), 'YYYY-MM-DD, hh:mm:ss:');

	console.log(datetime, ...attrs);
};
