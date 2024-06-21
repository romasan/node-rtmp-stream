const sqlite3 = require('sqlite3').verbose();

const dbFile = __dirname + '/../../db/db.sqlite3';
const db = new sqlite3.Database(dbFile);

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
	db.exec(`
		${Object.entries(tables).map(([name, columns]) => `
			CREATE TABLE IF NOT EXISTS ${name} (
				${Object.entries(columns).map(([column, type]) => `${column} ${type}`).join(',')}
			)
		`).join(';')}
	`);
};

prepareDatabase();

const insert = (table, values) => {
	const valid = tables[table] && Object.keys(values).every((key) => key in tables[table]);

	if (!valid) {
		console.log(`Error: insert to table "${table}"`, values);

		return;
	}

	db.run(`INSERT INTO ${table} (${Object.keys(values).join(', ')}) VALUES (${Object.keys(values).fill('?').join(', ')})`, ...Object.values(values));
};

const asyncQuery = (query, ...values) => new Promise((resolve, reject) => {
	db.all(query, ...values, (err, rows) => {
		if (err) {
			reject(err);

			return;
		}

		resolve(rows)
	});
});

module.exports = {
	db,
	insert,
	asyncQuery,
};
