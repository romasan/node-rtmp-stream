import fs from 'fs';
import { getPathByToken } from './getPathByToken';

export const getAllSessions = (uuid: string) => {
    const filePath = getPathByToken(uuid, false);
    let table: string[][] = [];

    try {
        const file = fs.readFileSync(filePath).toString();

        table = file
            .split('\n')
            .filter(Boolean)
            .map((line) => line.split(';'));
    } catch (ignore) {
        console.log(`Error read file: ${filePath}`);
    }

    return table;
};
