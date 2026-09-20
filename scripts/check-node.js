const fs = require('fs');
const path = require('path');

/**
 * Проверяет версию Node перед запуском сервера: проект зафиксирован на версии
 * из `.nvmrc` (та же версия используется в CI), чтобы окружение разработки
 * совпадало со сборкой и деплоем.
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
	console.error('[node] Проект зафиксирован на версии из .nvmrc — она же используется в CI (deploy.yml, security.yml),');
	console.error('[node] чтобы локальный запуск, сборка и деплой шли на одинаковом окружении.');
	console.error('[node] Запустите: nvm use');

	process.exit(1);
}
