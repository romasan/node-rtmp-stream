import fs from 'fs';
import path from 'path';

const file = __dirname + '/../../db/values.json';

let values: any = {
	paused: false,
};

if (fs.existsSync(file)) {
	values = require(file);
} else {
	const dirname = path.dirname(file);

	fs.mkdirSync(dirname, { recursive: true });
	fs.writeFileSync(file, JSON.stringify(values, null, 2));
}

export const setValue = (key: string, data: any) => {
	values[key] = data;
	fs.writeFileSync(file, JSON.stringify(values, null, 2));
};

export const getValue = (key: string) => values[key];
