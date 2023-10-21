// TODO
// store all sessions with name loke GuestXXX

const fs = require('fs');
const readline = require('readline');

const {
	readJSON,
} = require('./helpers');

const fixGuests = async (stats, logoutlog, auth) => {
	// stats = await readJSON(stats);
	// auth = await readJSON(auth);
	// const pixels = fs.readFileSync(__dirname + '/../pixels.log');
	// const logout = fs.readFileSync(__dirname + '/../logout.log');
	// const sessions = fs.readFileSync(__dirname + '/../sessions/list');
	// get all from pixels.log
	// rewrite nicknames by logout
	// rewrite nicknames by authorized

	const pixelsUUIDs = {};
	// const sessionsUUIDs = {};
	let sessionsCount = 0;

	const rlPixels = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../pixels.log'),
		crlfDelay: Infinity
	});

	const rlSessions = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../sessions/list'),
		crlfDelay: Infinity
	});

	rlPixels.on('line', (line) => {
		const [,,,,, uuid] = line.split(';');
		if (uuid) {
			pixelsUUIDs[uuid] = true;
		}
	});

	rlSessions.on('line', (line) => {
		sessionsCount++;
	});

	rlPixels.on('close', () => {
		const count = Object.keys(pixelsUUIDs).length;

		console.log(`pixels list unique uuids count: ${count}`);
	});

	rlSessions.on('close', () => {
		console.log(`sessions list unique uuids count: ${sessionsCount}`);
	});
};

module.exports = fixGuests;
