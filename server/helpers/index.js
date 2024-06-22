
const { validateToken } = require('./validateToken');
const { getPathByToken } = require('./getPathByToken');
const { getPostPayload } = require('./getPostPayload');
const { getIPAddress } = require('./getIPAddress');
const { parseCookies } = require('./parseCookies');
const { inRange } = require('./inRange');
const { getFileLinesCount } = require('./getFileLinesCount');
const { getSearch } = require('./getSearch');
const { isNumber } = require('./isNumber');
const { checkStillTime } = require('./checkStillTime');
const { addSessionForIP } = require('./addSessionForIP');

module.exports = {
	addSessionForIP,
	validateToken,
	getPathByToken,
	getPostPayload,
	getIPAddress,
	inRange,
	parseCookies,
	getFileLinesCount,
	getSearch,
	isNumber,
	checkStillTime,
};
