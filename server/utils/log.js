const { formatDate } = require('../helpers/formatDate');

const Log = (...attrs) => {
	const datetime = formatDate(Date.now(), 'YYYY-MM-DD, hh:mm:ss:');

	console.log(datetime, ...attrs);
};

module.exports = {
	Log,
};
