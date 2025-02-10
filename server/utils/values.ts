import fs from 'fs';

const values = require('../../db/values.json');

export const setValue = (key: string, data: any) => {
	values[key] = data;
	fs.writeFileSync(__dirname + '/../../db/values.json', JSON.stringify(values, null, 2));
};

export const getValue = (key: string) => values[key];
