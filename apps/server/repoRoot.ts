import fs from 'fs';
import path from 'path';

export function findRepoRoot(start: string): string {
    let dir = path.resolve(start);
    for (;;) {
        if (fs.existsSync(path.join(dir, 'shared', 'ws-schema.json')) &&
            fs.existsSync(path.join(dir, 'package.json'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) throw new Error(`Cannot find project root from ${start}`);
        dir = parent;
    }
}

export const repoRoot = findRepoRoot(__dirname);
