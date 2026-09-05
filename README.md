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
| CI/CD | GitHub Actions → сборка → react-snap → деплой на GitHub Pages (`gh-pages`) |
| Процессы | pm2 (`pixelbattle`) |

---

## Структура проекта

```
.
├── .github/workflows/deploy.yml   # CI/CD: сборка и деплой на GitHub Pages
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
│   ├── postrender.js              # Пост-обработка react-snap/SSR
│   ├── saveep.sh                  # Сохранение пикселей (эпизод)
│   └── stream.sh                  # Запуск ffmpeg стрима полотна
├── server/                        # Серверная часть
│   ├── index.ts                   # Точка входа сервера
│   ├── config.json                # Конфигурация (хосты, ключи, время, картинки)
│   ├── api/                       # REST API + админка
│   ├── constants/                 # Цветовые схемы
│   ├── helpers/                   # Утилиты-хелперы
│   ├── tools/                     # Консольные инструменты анализа БД
│   ├── types/                     # TypeScript-типы
│   └── utils/                     # Ядро: canvas, ws, auth, bans, stats и т.д.
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
- Серверные утилиты генерации: `server/tools/prepareTimelapse.js`, `server/tools/drawEpisode.js`.
- Скрипт сохранения эпизода: `scripts/saveep.sh`.

### 11. Стриминг (`scripts/stream.sh`)

1. `server/api/stream.ts` рендерит PNG-кадр полотна (`/stream.png`) поверх фоновой картинки (`bgImage`), ререндер каждую секунду.
2. `scripts/stream.sh` через `ffmpeg`:
   - берёт PNG-кадр как видео (`image2`, 30 fps);
   - накладывает аудиодорожку (`inputAudio`);
   - кодирует H.264/AAC;
   - публикует во RTMP (`rtmpHostKey`).
3. Скрипт автоматически перезапускает ffmpeg при обрыве.

### 12. Инструменты анализа (`server/tools/`)

Консольные утилиты для работы с данными:

- `prepareDatabase.js` — подготовка БД;
- `prepareSessions.js` — подготовка сессий;
- `recover.js` — восстановление;
- `restorePixels.js` — восстановление пикселей;
- `drawDiffMask.js` — маска различий;
- `drawEpisode.js` — отрисовка эпизода таймлапса;
- `prepareTimelapse.js` — подготовка таймлапса;
- `upscale.js` — апскейл полотна;
- `expand.js` — расширение полотна;
- `geoip.js` — геолокация по IP (maxmind);
- `checkLog.js`, `debugServer.js`, `debugStream.js`, `debugTwitch.js` — отладка;
- `calcSessionsWithOneIP.js`, `collectIPAdresses.js`, `filterByBlocked.js`, `filterByIP.js`, `filterByUUID.js`, `fixSessionByNickName.js` — фильтрация/анализ сессий.

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
| `npm run build` | Production-сборка клиента (Parcel) |
| `npm run build:server` | Компиляция сервера в `lib/` |
| `npm start` | Сборка сервера + запуск через pm2 (`pixelbattle`) |
| `npm stop` | Остановка pm2-процесса |
| `npm run render` | react-snap (SSR пререндер) + постобработка |
| `npm run build:twitch` | Сборка Twitch Extension (zip) |
| `npm run tools` | Запуск консольных инструментов (`server/tools`) |
| `npm run eslint` | Линтинг клиента |

---

## CI/CD

`.github/workflows/deploy.yml`:

1. Пуш в ветку `main`.
2. Установка Node 18 + системных библиотек для `node-canvas`.
3. `npm install`, `npm run build`.
4. `npm run render` (react-snap) — пререндер страниц для SEO.
5. Деплой `dist/` в ветку `gh-pages` (GitHub Pages).

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
