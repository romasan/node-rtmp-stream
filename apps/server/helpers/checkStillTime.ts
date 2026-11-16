const { finishTimeStamp } = require('../config.json');

export const checkStillTime = () => !finishTimeStamp || new Date(finishTimeStamp).getTime() > Date.now();
