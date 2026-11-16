/**
 * Загружает наборы цветов из `apps/server/constants/colorSchemes.ts`.
 *
 * Инструменты в `tools/` — обычные CommonJS-скрипты (запускаются через
 * `node ./tools/index.js`), поэтому для чтения `.ts`-файла регистрируем
 * `ts-node` в режиме transpileOnly. Это работает и на Node 18, и на Node 24+
 * (где `require('.ts')` доступен только как экспериментальный нативный
 * type-stripping).
 */

require('./register-typescript');

module.exports = require('../apps/server/constants/colorSchemes.ts');
