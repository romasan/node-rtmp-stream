/**
 * работа с базой данных
 */

import sqlite3 from 'sqlite3';
import { Log } from './log';

const dbFile = __dirname + '/../../db/db.sqlite3';
const sqlite3db = sqlite3.verbose();

export const db = new sqlite3db.Database(dbFile);

const tables: any = {
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
				${Object.entries(columns as any).map(([column, type]) => `${column} ${type}`).join(',')}
			)
		`).join(';')}
	`);
};

prepareDatabase();

export const insert = (table: string, values: any) => {
	const valid = tables[table] && Object.keys(values).every((key) => key in tables[table]);

	if (!valid) {
		Log(`Error: insert to table "${table}"`, values);

		return;
	}

	db.run(`INSERT INTO ${table} (${Object.keys(values).join(', ')}) VALUES (${Object.keys(values).fill('?').join(', ')})`, ...Object.values(values));
};

export const asyncQuery = (query: string, ...values: string[]) => new Promise((resolve, reject) => {
	db.all(query, ...values, (err: any, rows: any[]) => {
		if (err) {
			reject(err);

			return;
		}

		resolve(rows)
	});
});
