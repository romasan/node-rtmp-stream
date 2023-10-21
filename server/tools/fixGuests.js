// TODO
// store all sessions with name loke GuestXXX

const fs = require('fs');
const readline = require('readline');

const {
	readJSON,
} = require('./helpers');

const readPixels = () => new Promise((resolve) => {
	const pixelsUUIDs = {};

	const rlPixels = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../pixels.log'),
		crlfDelay: Infinity
	});

	rlPixels.on('line', (line) => {
		const [,,,,, uuid] = line.split(';');
		if (uuid) {
			pixelsUUIDs[uuid] = 1;
		}
	});

	rlPixels.on('close', () => {
		resolve(pixelsUUIDs);
	});
});

const fixGuests = async (stats, logoutlog, auth) => {
	// stats = await readJSON(stats);
	// auth = await readJSON(auth);
	// const pixels = fs.readFileSync(__dirname + '/../pixels.log');
	// const logout = fs.readFileSync(__dirname + '/../logout.log');
	// const sessions = fs.readFileSync(__dirname + '/../sessions/list');
	// get all from pixels.log
	// rewrite nicknames by logout
	// rewrite nicknames by authorized

	const pixelsUUIDs = await readPixels();
	// const sessionsUUIDs = {};
	let sessionsCount = 0;

	const rlSessions = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../sessions/list'),
		crlfDelay: Infinity
	});

	rlSessions.on('line', (uuid) => {
		if (pixelsUUIDs[uuid]) {
			pixelsUUIDs[uuid] = 2;
		}
		sessionsCount++;
	});

	rlSessions.on('close', () => {
		const count = Object.keys(pixelsUUIDs).length;
		const pixUUIDInSessionsCount = Object.entries(pixelsUUIDs).filter(([key, value]) => value === 2).length;
		console.log(`count: ${count}/${pixUUIDInSessionsCount}/${sessionsCount}`);
	});
};

module.exports = fixGuests;
