const fs = require('fs');
const path = require('path');

/**
 * Проверяет версию Node перед запуском сервера: `canvas`/`sqlite3` собираются
 * под ABI текущего Node, поэтому на неподдерживаемой версии сервер падает
 * с `NODE_MODULE_VERSION` или `Could not locate the bindings file`.
 * Версия берётся из `.nvmrc`: поле `engines` в `package.json` не используется,
 * потому что Parcel учитывает его при выборе окружения и собирает клиент
 * как Node/ESM-таргет (внешние `import "react"` вместо бандла).
 */
const required = fs
	.readFileSync(path.join(__dirname, '..', '.nvmrc'), 'utf8')
	.trim();
const supportedMajor = Number(required.replace(/[^0-9].*/, ''));
const current = process.versions.node;

if (supportedMajor && Number(current.split('.')[0]) !== supportedMajor) {
	console.error(`[node] Неподдерживаемая версия Node.js: v${current}, требуется ${required} (см. .nvmrc).`);
	console.error('[node] node-canvas собирается под ABI конкретной версии Node, поэтому сервер падает с');
	console.error('[node] "NODE_MODULE_VERSION ... was compiled against a different Node.js version".');
	console.error('[node] Запустите: nvm use && npm rebuild canvas');

	process.exit(1);
}
