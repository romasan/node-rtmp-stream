# PIXEL BATTLE (node-rtmp-stream)

Многопользовательский pixel-art проект («место»), в котором игроки совместно рисуют на общем полотне. Вдохновлён r/place. Игроки авторизуются через Twitch, Discord, Steam, Telegram или VK, ставят по одному пикселю с перезарядкой (кулдауном), общаются в чате, а админы управляют банами, статистикой, картами активности, паузой и расширением полотна.

Проект состоит из двух частей:

- **Клиент** (`src/`) — React-приложение (Parcel + TypeScript).
- **Сервер** (`server/`) — Node.js + TypeScript (ts-node, pm2), WebSocket-сервер, REST API, отрисовка полотна через `node-canvas`.

---

## Стек технологий

| Слой | Технологии |
|---|---|
| Клиент | React 18, TypeScript, SCSS Modules, Parcel 2, Chart.js / react-chartkick |
| Сервер | Node.js, TypeScript, ts-node, WebSocket (`ws`), `node-canvas`, sqlite3 |
| Авторизация | OAuth2: Twitch, Discord, Steam, Telegram, VK |
| БД | SQLite (`db/db.sqlite3`) — чат; JSON-файлы (`db/bans.json`, `db/values.json`) |
| Стриминг | ffmpeg + скрипт `scripts/stream.sh` |
| CI/CD | GitHub Actions → `npm audit` → сборка → react-snap → деплой на GitHub Pages (`gh-pages`) |
| Процессы | pm2 (`pixelbattle`) |

---

## Структура проекта

```
.
├── .github/workflows/deploy.yml   # CI/CD: сборка и деплой на GitHub Pages
├── .husky/pre-commit              # Git pre-commit hook (husky): проверка сборки и пререндера
├── assets/                        # Иконки, шрифты, картинки (svg, webp, ttf)
├── db/                            # Данные: db.sqlite3, bans.json, values.json, сессии
├── hoops/                         # Служебные конфиги/скрипты (Discord auth и пр.)
├── pages/                         # HTML-страницы (входные точки Parcel)
│   ├── index.html                 # Главная страница игры
│   ├── login/                     # OAuth-редиректы авторизации
│   ├── logout/                    # Выход из аккаунта
│   ├── qq/                        # Панель инструментов модератора (admin)
│   ├── tg/                        # Telegram Mini App версия
│   ├── timelapse/                 # Таймлапс полотна
│   └── twitch/                    # Twitch Extension (видео-оверлей)
├── scripts/                       # Скрипты сборки и стриминга
│   ├── addramdisk.sh              # RAM-диск для ускорения (Linux)
│   ├── postbuild.js               # Пост-обработка сборки
│   ├── packTimelapse.sh           # Упаковка таймлапса в tmp/timelapse
│   ├── postrender.js              # Пост-обработка react-snap/SSR
│   ├── saveep.sh                  # Сохранение пикселей (эпизод)
│   └── stream.sh                  # Запуск ffmpeg стрима полотна
├── server/                        # Серверная часть
│   ├── index.ts                   # Точка входа сервера
│   ├── config.json                # Конфигурация (хосты, ключи, время, картинки)
│   ├── api/                       # REST API + админка
│   ├── constants/                 # Цветовые схемы
│   ├── helpers/                   # Утилиты-хелперы
│   ├── types/                     # TypeScript-типы
│   └── utils/                     # Ядро: canvas, ws, auth, bans, stats и т.д.
├── tools/                         # Консольные инструменты анализа БД
├── src/                           # Клиент (React)
│   ├── index.tsx                  # Входная точка приложения
│   ├── App.tsx                    # Корневой компонент
│   ├── components/                # UI-компоненты (Canvas, Chat, Palette...)
│   ├── containers/                # Контейнеры (Admin, TgMiniApp, Timelapse)
│   ├── hooks/                     # Хуки (useApp, useWsStore, useDraggable...)
│   ├── helpers/                   # Клиентские утилиты
│   └── styles/                    # Глобальные стили (SCSS)
├── static/                        # Статика: robots.txt, sitemap.xml, favicon
└── package.json                   # Скрипты и зависимости
```

---

## Как это работает

### 1. Подключение клиента

1. Пользователь открывает главную страницу (`pages/index.html` → `src/index.tsx`).
2. Клиент вызывает `start()` (`server/api/start.ts`):
   - проверяет rate-limit по IP;
   - проверяет бан по IP/token;
   - создаёт новую сессию (UUID-token) и выдаёт **HttpOnly cookie** `token` на год, либо продлевает существующую сессию.
3. Устанавливается **WebSocket-соединение** (`src/lib/ws.ts`):
   - адрес: `api.<host>` во внешнем окружении, `localhost:8080` в dev;
   - протокол `wss` для HTTPS или хеша `#secured`;
   - при обрыве — переподключение каждые 10 секунд;
   - пинг каждые 10 секунд (`ws.send('2')`), сообщение `'3'` игнорируется.
4. События с сервера приходят вида `{ event, payload }` и эмитятся через `event-emitter` (`ws:<event>`).

### 2. Полотно (canvas)

- Сервер держит полотно в памяти (`server/utils/canvas.ts`) — `node-canvas`.
- Клиент загружает текущее состояние как PNG: `//<WSHost>/canvas.png` и рисует его на `<canvas>`.
- При каждом новом пикселе сервер шлёт событие `drawPix` по WebSocket, клиент мгновенно закрашивает пиксель (без перезагрузки страницы).
- Полотно периодически сохраняется на диск: `setInterval(saveCanvas, 60 * 1000)` (`server/index.ts`).
- Поддерживается **расширение полотна** (`server/utils/expands.ts`): сервер увеличивает размер и смещает/масштабирует старое содержимое; клиент синхронизирует канвас через событие `expand`.

### 3. Постановка пикселя

1. Игрок выбирает цвет в палитре (`Palette`), кликает по полотну.
2. `PUT /api/pix` (`server/api/pix.ts`) проверяет:
   - не завершилось ли время раунда (`finishTimeStamp`);
   - не на паузе ли сервер (`paused`);
   - авторизацию пользователя;
   - наличие WebSocket-соединения;
   - rate-limit по IP;
   - бан по нику;
   - корректность координат/цвета;
   - **кулдаун пикселя** (`getExpiration()` / `updateClientCountdown()`).
3. Если всё ок — `drawPix()` обновляет полотно, пишет в статистику и шлёт `drawPix` всем подключённым.
4. Ответы API: `ok`, `fail`, `skip`, `await`, `paused`, `timeout`.
5. Клиент показывает таймер до следующего пикселя прямо на канвасе.

### 4. Авторизация

- Доступные провайдеры: **Twitch, Discord, Steam, Telegram, VK** (`server/api/auth/`).
- Каждый провайдер — свой OAuth2-флоу: редирект на провайдера, callback, получение профиля.
- После успешного входа пользователь привязывается к `token` (сессии), получает ник и «area» (площадку/провайдера).
- Выход — `server/api/logout.ts` (удаляет куку и пользователя).
- Telegram Mini App (`src/containers/TgMiniApp`) использует встроенный `Telegram.WebApp` и отдельную авторизацию.

### 5. Чат

- `GET /api/messages` — история сообщений из SQLite (`server/utils/chat.ts`, таблица `chat`).
- `PUT /api/chat` — отправка сообщения с защитой:
  - бан/мут по нику → отклонение;
  - глобальный кулдаун (значение `cooldown` в `values.json`, по умолчанию 5 сек);
  - анти-спам (повтор одинакового текста) → «сообщение удалено из-за спама» от бота;
  - длина сообщения — до 100 символов.
- Новые сообщения рассылаются всем через WebSocket (`chatMessage`).

### 6. Статистика и карты активности

`server/utils/stats.ts` собирает по каждому пикселю: время, UUID, цвет, ник/area, IP, счётчик.

Карты активности (`server/utils/maps.ts`) рендерятся по текущему размеру полотна (`getExpand()`) с учётом сдвигов от расширения (`shiftX`/`shiftY`) и поэтому совпадают с видимым холстом.

Эндпоинты админки (`server/api/admin/`):

| Маршрут | Описание |
|---|---|
| `stats` | Общая статистика |
| `history` | История изменений во времени |
| `pixel` | Данные по конкретному пикселю |
| `heatmap.png` | Тепловая карта частоты пикселей |
| `newestmap.png` | Карта новизны пикселей |
| `newestmapByIndex.png` | Новизна по индексу |
| `usersmap.png` | Карта по UUID (один пользователь — одним цветом) |
| `lastPixels.png` | Последние N пикселей |
| `byIP.png` | Карта по IP-адресам |
| `byTime.png` | Карта пикселей за последний интервал времени |
| `user` | Информация о пользователе |
| `onlineList` | Список онлайн-пользователей |
| `ban` / `unban` / `getBans` | Управление банами |
| `chat` | Управление чатом |
| `countdown` | Управление кулдауном |
| `pause` | Пауза игры |
| `expand` | Расширение полотна |
| `fillSquare` | Заливка области |
| `streamSettings` | Настройки стрима |
| `updateFreezedFrame` | Обновление «застывшего» кадра |

### 7. Баны (`server/utils/bans.ts`)

Хранятся в `db/bans.json`, четыре типа:

- `token` — по UUID-токену;
- `ip` — по IP-адресу (поддержка нескольких IP через запятую/перенос строки);
- `nick` — по нику;
- `mute` — только мут чата (по нику).

Бан может быть **вечным** (`true`) или **временным** (timestamp). По истечении срока бан автоматически снимается.

### 8. Сессии и онлайн (`server/utils/sessions.ts`, `online.ts`)

- Сессии хранятся по токенам, привязываются к IP.
- Активность обновляется при действиях (`uptateActiveTime`).
- Онлайн-список (топ 100) кэшируется на 5 секунд, показывает ник и площадку (area).

### 9. Панель модератора (`/qq`)

Доступна только администраторам/модераторам (`checkIsAdmin`). Включает: баны, статистику, карты активности, чат, паузу, расширение полотна, заливку области, управление кулдауном и настройками стрима. UI — `src/containers/Admin`.

### 10. Таймлапс (`/timelapse`)

- Отдельная страница (`pages/timelapse/`, `src/containers/Timelapse`).
- Проигрывает историю изменений полотна («эпизоды»).
- Серверные утилиты генерации: `tools/prepareTimelapse.js`, `tools/drawEpisode.js`.
- Скрипт сохранения эпизода: `scripts/saveep.sh`.
- Скрипт упаковки: `scripts/packTimelapse.sh` — копирует данные сезонов из `db/archive/<сезон>/timelapse/*` в `tmp/timelapse/<сезон>/` (структура как на статике) и генерирует `tmp/timelapse/index.json` со списком сезонов (`{ key, label }`). Сезоны без подготовленных `.bin` пропускаются. Результат можно скопировать в `dist/` и проверить локально:

```
./scripts/packTimelapse.sh
rm -rf dist .parcel-cache && npm run build && cp -r tmp/timelapse ./dist/ && npx http-server dist
# http://localhost:8080/timelapse/#staticHost=http://localhost:8080
```

### 11. Стриминг (`scripts/stream.sh`)

1. `server/api/stream.ts` рендерит PNG-кадр полотна (`/stream.png`) поверх фоновой картинки (`bgImage`), ререндер каждую секунду.
2. `scripts/stream.sh` через `ffmpeg`:
   - берёт PNG-кадр как видео (`image2`, 30 fps);
   - накладывает аудиодорожку (`inputAudio`);
   - кодирует H.264/AAC;
   - публикует во RTMP (`rtmpHostKey`).
3. Скрипт автоматически перезапускает ffmpeg при обрыве.

### 12. Инструменты анализа (`tools/`)

Консольные утилиты для работы с данными:

- `prepareDatabase.js` — подготовка БД;
- `prepareSessions.js` — подготовка сессий;
- `recover.js` — восстановление;
- `restorePixels.js` — восстановление пикселей;
- `drawDiffMask.js` — маска различий;
- `drawEpisode.js` — отрисовка эпизода таймлапса; в качестве фона берутся только файлы-изображения (`.jpg`/`.jpeg`/`.png`/`.webp`) из указанной директории (подпапки игнорируются); выходная директория `frames/` создаётся автоматически; при включённом флаге `debugInfo` поверх каждого кадра в левом верхнем углу выводится отладочная информация (номер кадра, номер последнего отрендеренного пикселя, номер расширения, размер полотна, сдвиг расширения); рендер распараллелен по ядрам CPU: кадры делятся на равные чанки, каждый чанк рисует отдельный процесс (`child_process.fork`), их число задаётся 4-м аргументом команды или переменной окружения `DRAW_EPISODE_WORKERS` (по умолчанию — по числу ядер); результат побайтово совпадает с последовательным рендером;
- `prepareTimelapse.js` — подготовка таймлапса;
- `upscale.js` — апскейл полотна;
- `expand.js` — расширение полотна;
- `geoip.js` — геолокация по IP (maxmind);
- `checkLog.js`, `debugServer.js`, `debugStream.js`, `debugTwitch.js` — отладка;
- `calcSessionsWithOneIP.js`, `collectIPAdresses.js`, `filterByBlocked.js`, `filterByIP.js`, `filterByUUID.js`, `fixSessionByNickName.js` — фильтрация/анализ сессий.

Инструменты запускаются обычным `node` (`npm run tools <команда>`). Цветовые схемы подгружаются из исходника `server/constants/colorSchemes.ts` через общий хелпер `tools/loadColorSchemes.js`, который регистрирует `ts-node` (`transpileOnly`) — поэтому инструменты работают и на Node 18, и на Node 24+.

> `canvas` — нативный модуль: он собирается под ту версию Node, которой выполняется установка зависимостей. После смены версии Node (например, через `nvm`) нужно переустановить зависимости (`npm install`) или пересобрать модуль (`npm rebuild canvas`), иначе `require('canvas')` упадёт с ошибкой `NODE_MODULE_VERSION`.

---

## Конфигурация (`server/config.json`)

Основные секции:

| Ключ | Назначение |
|---|---|
| `server.host` | Хост сайта |
| `server.proxyIp` | Использовать `X-Forwarded-For` (за прокси) |
| `server.secure` | Secure-куки (HTTPS) |
| `finishTimeStamp` | Момент завершения раунда (после него ставка пикселей запрещена) |
| `stream.bgImage` | Фоновая картинка для стрима |
| `stream.streamFile` | Файл-кадр, отдаваемый ffmpeg |
| `stream.inputAudio` | Аудиодорожка для стрима |
| `stream.rtmpHostKey` | RTMP-адрес трансляции |
| OAuth-ключи | Клиентские ID/секреты Twitch, Discord, Steam, Telegram, VK |

---

## Основные скрипты (`package.json`)

| Команда | Описание |
|---|---|
| `npm run dev` | Параллельный запуск dev-сервера и клиента (`dev:server` + `dev:web` через `concurrently`) |
| `npm run dev:server` | Запуск сервера в dev-режиме (nodemon + ts-node) |
| `npm run dev:web` | Запуск Parcel для клиента (dev-сервер) |
| `npm run smoke:server` | Смоук-проверка запущенного сервера: гостевая сессия (`/start`), WebSocket (`init`, ping/pong) и история чата (`/messages`) |
| `npm run build` | Production-сборка клиента (Parcel) |
| `npm run build:server` | Компиляция сервера в `lib/` |
| `npm start` | Сборка сервера + запуск через pm2 (`pixelbattle`) |
| `npm stop` | Остановка pm2-процесса |
| `npm run render` | react-snap (SSR пререндер) + постобработка |
| `npm run build:twitch` | Сборка Twitch Extension (zip) |
| `npm run tools` | Запуск консольных инструментов (`tools`) |
| `npm run eslint` | Линтинг клиента |

### Pre-commit проверка (husky)

При `npm install` срабатывает скрипт `prepare` (`husky`), который включает Git-хуки из `.husky/`. Хук `pre-commit` перед каждым коммитом запускает `npm run build && npm run render` — если production-сборка клиента или react-snap пререндер завершаются ошибкой, коммит отклоняется. При необходимости пропустить проверку: `git commit --no-verify`.

---

## Зависимости и безопасность

Состояние аудита: `npm audit --omit=dev` — единственная находка moderate-уровня (`uuid <11.1.1`, GHSA-w5hq-g745-h8pq), `high`/`critical` в production-дереве нет; `npm audit` — только dev-only цепочка `react-snap` → `puppeteer@1.20` (в том числе `extract-zip`/`yauzl`), которая используется лишь при `npm run render`.

Находка по `uuid` неприменима: уязвимость затрагивает генераторы v3/v5/v6 при передаче внешнего буфера `buf`, а проект использует только `v4` (`server/api/start.ts`, `server/api/chat.ts`, `server/utils/chat.ts`, `src/hooks/useWindow/useWindow.tsx`, `src/components/Tools/components/Block/Block.tsx`, `tools/*`). Обновиться до исправленной версии (`uuid ≥ 11.1.1`) нельзя, пока пререндер работает на Chromium 78 — поэтому CI-проверка production-дерева использует порог `--audit-level=high`.

- Прямые зависимости обновлены до патченных версий: `ws ≥ 8.21.3` (DoS через сжатые фреймы), `form-data 4.0.6`.
- Транзитивные зависимости зафиксированы через `overrides` в `package.json`: `minimist ^1.2.8`, `cheerio ^1.0.0`, `nth-check ^2.1.1`, а также патченные `brace-expansion`, `minimatch`, `js-yaml`, `qs`, `tar`, `node-gyp`, `express`, `serve-static`.
- Удалены неиспользуемые зависимости: `parcel-bundler` (Parcel 1 тянул устаревшее уязвимое дерево), `res`, `src`, `parcel-plugin-static-files-copy` и PostCSS-плагины (`postcss`, `postcss-assets`, `postcss-modules`, `autoprefixer`) — Parcel 2 обрабатывает CSS-модули (`*.module.scss`) сам, а копирование статики делает `scripts/postbuild.js`.
- После обновления зависимостей работа серверной части проверяется смоуком `npm run smoke:server` (нужен запущенный сервер): он создаёт гостевую сессию, поднимает WebSocket-соединение, ждёт сообщение `init`, проверяет ping/pong и читает историю чата.
- `uuid` зафиксирован на `9.x`: начиная с `uuid@10` публикуемый код содержит синтаксис ES2021 (`??`, `?.`), который не парсит Chromium 78 внутри `react-snap` (puppeteer 1.20). Из-за этого приложение не загружается в браузере пререндера, а `npm run render` молча падает с кодом 1. При обновлении клиентских зависимостей это ограничение нужно проверять через `npm run render`.

---

## CI/CD

`.github/workflows/deploy.yml`:

1. Пуш в ветку `main`, а также запуск по расписанию (каждый понедельник 06:00 UTC) и вручную (`workflow_dispatch`).
2. Установка Node 18 + системных библиотек для `node-canvas`.
3. `npm install`, затем проверка уязвимостей: `npm audit --omit=dev --audit-level=high` (падение при high/critical в production-дереве) и `npm audit --audit-level=critical` (падение при critical-уязвимости, включая dev).
4. `npm run build`.
5. `npm run render` (react-snap) — пререндер страниц для SEO.
6. Деплой `dist/` в ветку `gh-pages` (GitHub Pages) — только для пушей в `main`.

Регулярный запуск по расписанию нужен, чтобы новые advisories не накапливались: если в зависимостях появляется critical-уязвимость, workflow становится красным ещё до следующего пуша.

---

## Запуск локально

```bash
# 1. Установка зависимостей
npm install

# 2. Сервер (WebSocket + API) на :8080
npm run dev:server

# 3. Клиентский dev-сервер Parcel (в другом терминале)
npm run dev:web
```

Клиент в dev подключается к WebSocket на `localhost:8080`.

---

## БД и хранение

| Файл | Назначение |
|---|---|
| `db/db.sqlite3` | SQLite: таблица `chat` (id, time, name, area, token, text) |
| `db/bans.json` | Баны: `{ token, ip, nick, mute }` |
| `db/values.json` | Серверные значения: `paused`, `cooldown` и др. |
| `db/` (прочие) | Сессии, статистика, пиксельные снапшоты |

Полотно в памяти (canvas) периодически сбрасывается на диск; загрузка при старте происходит из снапшота.
