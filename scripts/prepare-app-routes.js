const fs = require('node:fs');
const path = require('node:path');
function createRoutes(directory) {
    for (const route of ['tg', 'timelapse']) {
        const target = path.join(directory, route);
        fs.mkdirSync(target, { recursive: true });
        fs.copyFileSync(path.join(directory, 'index.html'), path.join(target, 'index.html'));
    }
}
if (require.main === module) {
    if (!process.env.TRUNK_STAGING_DIR) throw new Error('TRUNK_STAGING_DIR is required');
    createRoutes(process.env.TRUNK_STAGING_DIR);
}
module.exports = { createRoutes };
