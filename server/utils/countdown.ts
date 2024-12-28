/**
 * управление задержкой для выставления пикселя
 */

import fs from 'fs';
import { inRange } from '../helpers';
import {
	checkUserAuthByToken,
	checkIsAdmin,
	getAuthID,
} from'./auth';

// TODO add personal countdown
const personalCD: Record<string, string> = {
	// session ID or auth ID?
	// "00000000-0000-0000-0000-000000000000": 10 (sec.)
};

const expirationsList: any = {
	authorized: [
		[0, null, 3],
	],
	guest: [
		[0, null, 30],
	],
};

let countdownRanges: any = {};

const DBFileName = __dirname + '/../../db/countdown.json';

const preloadCountdownRanges = () => {
	// TODO use database
	if (fs.existsSync(DBFileName)) {
		countdownRanges = require(DBFileName);
	}
};

preloadCountdownRanges();

export const resetCountdownTemp = (token: string) => {
	const _token = getAuthID(token) || token;

	delete expirationsList[_token];
};

export const getExpiration = (token: string) => {
	const _token = getAuthID(token) || token;

	return expirationsList[_token] || 0;
};

export const getCountdown = (token: string, onlineCount: number, isFirstTime?: boolean, reset?: boolean): number => {
	if (reset) {
		resetCountdownTemp(token);
	}

	const _token = getAuthID(token) || token;

	if (expirationsList[_token]) {
		if (expirationsList[_token] > Date.now()) {
			return Math.ceil((expirationsList[_token] - Date.now()) / 1000);
		} else {
			return 0;
		}
	}

	// const forceMin = Infinity;
	const isAdmin = checkIsAdmin(token);
	const isAuthorized = checkUserAuthByToken(token);

	if (isAdmin || isFirstTime) {
		return 0;
	}

	// if (forceMin) {
	// 	return forceMin;
	// }

	const value = personalCD[token]
		?? (isAuthorized ? countdownRanges.authorized : countdownRanges.guest)
			?.find((item: [number, number]) => inRange(onlineCount, item))?.[2]
		?? 5;

	expirationsList[_token] = Date.now() + (Number(value || 0) * 1000);

	// return Math.min(forceMin, value);
	return Number(value);
};

export const getCountdownRanges = () => {
	return countdownRanges;
};

export const updateCountdownRanges = (ranges: any) => {
	countdownRanges = ranges;

	saveCountdownRanges();
};

export const saveCountdownRanges = () => {
	fs.writeFileSync(DBFileName, JSON.stringify(countdownRanges));
};
