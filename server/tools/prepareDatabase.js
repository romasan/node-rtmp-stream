const fs = require('fs');
const readline = require('readline');
const { v4: uuid } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const BadWordsNext = require('bad-words-next');
const ru = require('bad-words-next/data/ru.json');

const badwords = new BadWordsNext({ data: ru });

const tables = {
	chat: {
		id: 'TEXT PRIMARY KEY',
		time: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
		name: 'TEXT',
		area: 'TEXT NOT NULL',
		token: 'TEXT NOT NULL',
		text: 'TEXT NOT NULL DEFAULT ""',
	}
};

const prepareDatabase = () => {
	const dbFile = __dirname + '/../../db/db.sqlite3';

	if (fs.existsSync(dbFile)) {
		fs.unlinkSync(dbFile);
	}

	const db = new sqlite3.Database(dbFile);

	db.exec(`
		${Object.entries(tables).map(([name, columns]) => `
			CREATE TABLE IF NOT EXISTS ${name} (
				${Object.entries(columns).map(([column, type]) => `${column} ${type}`).join(',')}
			)
		`).join(';')}
	`);

	const stmt = db.prepare('INSERT INTO chat (id, time, name, area, token, text) VALUES (?, ?, ?, ?, ?, ?)');

	const rl = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../../db/messages.log'),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		if (!line) {
			return;
		}

		const [
			time,
			name,
			area,
			token,
			id,
			...rest
		] = line.split(';');

		const text = badwords.filter(rest.join(';'));

		stmt.run(
			uuid(),
			Number(time), // new Date(Number(time)).toISOString().replace('T', ' ').split('.').shift(),
			name,
			area,
			token,
			text,
		);
	});

	rl.on('close', () => {
		stmt.finalize(() => {
			console.log('done');
		});
	});
};

module.exports = prepareDatabase;
