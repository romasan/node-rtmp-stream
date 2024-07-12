const { formatDate } = require('../helpers/formatDate');
const { Log } = require('./log');

const Log = (...attrs) => {
	const datetime = formatDate(Date.now(), 'YYYY-MM-DD, hh:mm:ss:');

	Log(datetime, ...attrs);
};

module.exports = {
	Log,
};
