const { finishTimeStamp } = require('../config.json');

const checkStillTime = () => !finishTimeStamp || new Date(finishTimeStamp).getTime() > Date.now();

module.exports = {
	checkStillTime,
};
