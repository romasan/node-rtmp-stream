# PIXEL BATTLE (node-rtmp-stream)

Многопользовательский pixel-art проект («место»), в котором игроки совместно рисуют на общем полотне. Вдохновлён r/place. Игроки авторизуются через Twitch, Discord, Steam, Telegram или VK, ставят по одному пикселю с перезарядкой (кулдауном), общаются в чате, а админы управляют банами, статистикой, картами активности, паузой и расширением полотна.

Проект состоит из трёх приложений:

- `apps/app/` — пользовательский клиент Slint + Rust/WASM; сборка через Trunk.
- `apps/admin/` — панель модератора на React и TypeScript; сборка через Parcel.
- `apps/server/` — сервер Node.js и TypeScript: HTTP API, WebSocket и полотно.

[![Made with Slint](https://raw.githubusercontent.com/slint-ui/slint/v1.16.0/logo/MadeWithSlint-logo-whitebg.png)](https://slint.dev/)

---

## Стек технологий

| Слой | Технологии |
|---|---|
| Клиент | Rust, Slint, FemtoVG, WebAssembly, Trunk |
| Админка | React 18, TypeScript, SCSS Modules, Parcel 2 |
| Сервер | Node.js, TypeScript, ts-node, WebSocket (`ws`), `node-canvas`, sqlite3 |
| Авторизация | OAuth2: Twitch, Discord, Steam, Telegram, VK |
| БД | SQLite (`db/db.sqlite3`) — чат; JSON-файлы (`db/bans.json`, `db/values.json`) |
| Стриминг | ffmpeg + скрипт `scripts/stream.sh` |
| CI/CD | GitHub Actions → сборка и публикация на GitHub Pages (`gh-pages`) |
| Процессы | pm2 (`pixelbattle`) |

---

## Структура проекта

```text
apps/
  admin/              React-админка, HTML авторизации и 404
  app/                Rust/Slint, Trunk, UI и браузерный мост
  server/             TypeScript-сервер и пример конфигурации
assets/               Общие изображения и шрифт
shared/               Общие данные: constants.json (год и эпизод), ws-schema.json
tools/                Существующие Node.js-утилиты
scripts/              Сборка сайта, dev-прокси и эксплуатационные скрипты
vendor/slint-core/    Локальная копия `i-slint-core` с исправлением кликов по ссылке
db/                   Локальные данные сервера (не входят в Git)
Cargo.toml            Cargo workspace
package.json          npm workspaces и общие команды
```

---

## Как это работает

### 1. Подключение клиента

Slint запускается из `apps/app/index.html`, а браузерный мост `apps/app/web/bridge.js` загружает палитру, запрашивает сессию через `/start` и подключает WebSocket. В production API находится на `api.<host>`; в разработке Trunk и админка проксируют HTTP и WebSocket на порт 8080. Схема protobuf используется сервером и React-админкой, соответствующие Rust-типы описаны в `apps/app/src/protocol.rs`.

### 2. Полотно (canvas)

- Сервер держит полотно в памяти (`apps/server/utils/canvas.ts`) — `node-canvas`.
- Клиент загружает текущее состояние как PNG: `//<WSHost>/canvas.png` и рисует его на `<canvas>`.
- При каждом новом пикселе сервер шлёт событие `drawPix` по WebSocket, клиент мгновенно закрашивает пиксель (без перезагрузки страницы).
- Полотно периодически сохраняется на диск: `setInterval(saveCanvas, 60 * 1000)` (`apps/server/index.ts`).
- Поддерживается **расширение полотна** (`apps/server/utils/expands.ts`): сервер увеличивает размер и смещает/масштабирует старое содержимое; клиент синхронизирует канвас через событие `expand`.

### 3. Постановка пикселя

1. Игрок выбирает цвет в палитре (`Palette`), кликает по полотну.
2. `PUT /pix` (`apps/server/api/pix.ts`) проверяет:
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

- Доступные провайдеры: **Twitch, Discord, Steam, Telegram, VK** (`apps/server/api/auth/`).
- Каждый провайдер — свой OAuth2-флоу: редирект на провайдера, callback, получение профиля.
- После успешного входа пользователь привязывается к `token` (сессии), получает ник и «area» (площадку/провайдера).
- Выход — `apps/server/api/logout.ts` (удаляет куку и пользователя).
- Telegram Mini App (`apps/app/web/bridge.js`) использует встроенный `Telegram.WebApp` и отдельную авторизацию.

### 5. Чат

- `GET /messages` — история сообщений из SQLite (`apps/server/utils/chat.ts`, таблица `chat`).
- `PUT /chat` — отправка сообщения с защитой:
  - бан/мут по нику → отклонение;
  - глобальный кулдаун (значение `cooldown` в `values.json`, по умолчанию 5 сек);
  - анти-спам (повтор одинакового текста) → «сообщение удалено из-за спама» от бота;
  - длина сообщения — до 100 символов.
- Новые сообщения рассылаются всем через WebSocket (`chatMessage`).

### 6. Статистика и карты активности

`apps/server/utils/stats.ts` собирает по каждому пикселю: время, UUID, цвет, ник/area, IP, счётчик.

Карты активности (`apps/server/utils/maps.ts`) рендерятся по текущему размеру полотна (`getExpand()`) с учётом сдвигов от расширения (`shiftX`/`shiftY`) и поэтому совпадают с видимым холстом.

Эндпоинты админки (`apps/server/api/admin/`):

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

### 7. Баны (`apps/server/utils/bans.ts`)

Хранятся в `db/bans.json`, четыре типа:

- `token` — по UUID-токену;
- `ip` — по IP-адресу (поддержка нескольких IP через запятую/перенос строки);
- `nick` — по нику;
- `mute` — только мут чата (по нику).

Бан может быть **вечным** (`true`) или **временным** (timestamp). По истечении срока бан автоматически снимается.

### 8. Сессии и онлайн (`apps/server/utils/sessions.ts`, `online.ts`)

- Сессии хранятся по токенам, привязываются к IP.
- Активность обновляется при действиях (`uptateActiveTime`).
- Онлайн-список (топ 100) кэшируется на 5 секунд, показывает ник и площадку (area).

### 9. Панель модератора (`/qq`)

Доступна только администраторам/модераторам (`checkIsAdmin`). Включает: баны, статистику, карты активности, чат, паузу, расширение полотна, заливку области, управление кулдауном и настройками стрима. UI — `apps/admin/src/containers/Admin`.

Разделы админки используют общую тёмную тему `apps/admin/src/styles/gui.scss` (миксины `panel`, `controls`, `header`, `headerButton`). Логика каждого раздела разделена на `api.ts` (HTTP-запросы с понятными сообщениями об ошибках) и `model.ts` (чистые функции), которые покрыты тестами `scripts/tests/admin-*.test.cjs`. Из раздела статистики можно навести маркер на конкретный пиксель: `apps/admin/src/components/Canvas/marker.ts` пересчитывает координаты с учётом сдвигов расширения и подбирает свободное место, чтобы не перекрывать панели.

### 10. Таймлапс (`/timelapse`)

- Режим Slint-приложения на маршруте `/timelapse/`.
- Проигрывает историю изменений полотна («эпизоды»).
- Серверные утилиты генерации: `tools/prepareTimelapse.js`, `tools/drawEpisode.js`.
- Скрипт сохранения эпизода: `scripts/saveep.sh`.
- Скрипт упаковки: `scripts/packTimelapse.sh` — копирует данные сезонов из `db/archive/<сезон>/timelapse/*` в `tmp/timelapse/<сезон>/` (структура как на статике) и генерирует `tmp/timelapse/index.json` со списком сезонов (`{ key, label }`). Сезоны без подготовленных `.bin` пропускаются. Результат можно скопировать в `dist/` и проверить локально:

```
./scripts/packTimelapse.sh
npm run build
cp -r tmp/timelapse dist-release/
python3 -m http.server 9000 --directory dist-release
# http://localhost:9000/timelapse/#staticHost=http://localhost:9000
```

### 11. Стриминг (`scripts/stream.sh`)

1. `apps/server/api/stream.ts` рендерит PNG-кадр полотна (`/stream.png`) поверх фоновой картинки (`bgImage`), ререндер каждую секунду.
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
- `calcSessionsWithOneIP.js`, `collectIPAdresses.js`, `filterByBlocked.js`, `filterByIP.js`, `filterByUUID.js`, `fixSessionByNickName.js` — фильтрация/анализ сессий;
- `analyzePixels.js` — анализ журнала `db/pixels.log`: JSON-отчёт с признаками автоматизации по аккаунтам (`rapid`, `regular`, `straight_run`, `raster_scan`), общими IP, совместными линиями и графом синхронности; описание признаков и порогов — в `tools/analyzePixels.md`;
- `pixelSynchronization.js` — модуль графа синхронности, который использует `analyzePixels.js`;
- `renderPixelReport.js` — преобразует JSON-отчёт `analyzePixels.js` в автономный HTML-файл для просмотра в браузере.

Тесты утилит анализа журнала лежат в `scripts/tests/analyze-pixels.test.cjs` и запускаются вместе с `npm test`.

Инструменты запускаются обычным `node` (`npm run tools <команда>`). Цветовые схемы подгружаются из исходника `apps/server/constants/colorSchemes.ts` через общий хелпер `tools/loadColorSchemes.js`, который регистрирует `ts-node` (`transpileOnly`) — поэтому инструменты работают и на Node 18, и на Node 24+.

> `canvas` — нативный модуль: он собирается под ту версию Node, которой выполняется установка зависимостей. После смены версии Node (например, через `nvm`) нужно переустановить зависимости (`npm install`) или пересобрать модуль (`npm rebuild canvas`), иначе `require('canvas')` упадёт с ошибкой `NODE_MODULE_VERSION`.

---

## Конфигурация (`apps/server/config.json`)

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

## Разработка и сборка

Для проекта нужны Node.js 24.20.0, npm 11.19.0, Rust из `rust-toolchain.toml` и Trunk 0.22.1. На Linux для `canvas` также нужны Cairo, Pango, JPEG, GIF и librsvg; список пакетов приведён в CI. Trunk устанавливается отдельно, например `cargo install trunk --version 0.22.1 --locked`. Создайте локальный `apps/server/config.json` по `apps/server/config.example.json`, укажите существующее изображение в `stream.bgImage`, подготовьте рабочий каталог `db/` и локальный `hoops/config.json` для Discord-интеграции.

`hoops/config.json` должен содержать адрес вспомогательного Discord-сервиса, например `{"discord":{"protocol":"http","host":"localhost","port":3000}}`; для OAuth укажите фактический адрес.

```bash
npm ci
npm run dev           # сайт: http://localhost:1234/; Ctrl+C останавливает все
npm run dev:app       # Slint напрямую: http://localhost:1420/
npm run dev:admin     # админка: http://localhost:1234/qq/
npm run dev:server    # API и WebSocket на порту из конфигурации
npm run build         # приложения и собранный сайт в dist-release/
npm run check         # TypeScript, native Rust и wasm32
npm test              # JS- и Rust-тесты
```

Отдельные production-сборки: `npm run build:app`, `npm run build:admin`, `npm run build:server`. Тесты сервера, Slint и админки можно запускать отдельно: `npm run test:server`, `npm run test:app` и `node --test scripts/tests/*.test.cjs` (входят в `npm test`). TypeScript админки проверяется через `npm run check`. Для Slint также доступны `trunk serve` и `trunk build --release` из `apps/app/`. Единый адрес для игры, админки и страниц входа/выхода — `http://localhost:1234/`. Прокси направляет игру в Trunk на порту 1420, админку и страницы авторизации в Parcel на порту 1235, API и WebSocket — на `127.0.0.1:8080`. Для переходов после авторизации установите в локальном `apps/server/config.json` значения `server.host` и `server.origin` в `http://localhost:1234`. Для тестового локального входа включите `localAuth: true`; учётные записи для разработки указаны в `apps/server/api/auth/local.ts`.

`npm run tools <команда>` запускает существующие утилиты; `npm run build:twitch` упаковывает Twitch extension. `npm start` собирает сервер и запускает его через pm2. Хук pre-commit выполняет `npm run check` и `npm test`.

GitHub Actions устанавливает зависимости через `npm ci`, проверяет проект, собирает приложения и публикует `dist-release/` в `gh-pages`. Каталог `dist-release/tg/` можно раздавать как корень отдельного Telegram-хоста.

### Локальная копия Slint (`vendor/slint-core`)

Slint 1.16 не распознаёт клик по ссылке в чате, если ссылка перенесена на несколько строк. Поэтому `i-slint-core` подключён через `[patch.crates-io]` в корневом `Cargo.toml` из локальной копии `vendor/slint-core` (исправление — в `textlayout/sharedparley.rs`).

При обновлении Slint:

1. Обновите закреплённые версии Slint в `apps/app/Cargo.toml`.
2. Удалите секцию `[patch.crates-io]` и выполните `cargo test --test wrapped_chat_link` — тест проверяет клики по разным строкам одной ссылки.
3. Если тест проходит, ошибка в новой версии уже устранена — удалите `vendor/slint-core`.
4. Если нет — обновите локальную копию под новую версию, перенесите исправление, восстановите подмену и повторите тест.
5. После обновления проверьте `npm run test:app` и `npm run build:app`, обновите `Cargo.lock` и убедитесь, что подмена указывает на нужную версию.

---

## БД и хранение

| Файл | Назначение |
|---|---|
| `db/db.sqlite3` | SQLite: таблица `chat` (id, time, name, area, token, text) |
| `db/bans.json` | Баны: `{ token, ip, nick, mute }` |
| `db/values.json` | Серверные значения: `paused`, `cooldown` и др. |
| `db/` (прочие) | Сессии, статистика, пиксельные снапшоты |

Полотно в памяти (canvas) периодически сбрасывается на диск; загрузка при старте происходит из снапшота.
