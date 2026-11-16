# Веб-клиент Pixel Battle на Slint

`/slint/` открывает игру, включая игру внутри Telegram WebView при запуске с параметрами Telegram. `/slint/tg/` открывает Telegram-вариант, а `/slint/timelapse/` — проигрыватель архивов. Для публикации нужен HTTP-сервер, отдающий WASM как `application/wasm`.

## Локальный запуск

Понадобятся Node.js с установленными зависимостями проекта и Rust через rustup. Если в `PATH` нет `wasm-pack` или `wasm-bindgen` версии 0.2.130, установите CLI в каталог сборки проекта из корня репозитория.

```sh
cargo +1.93.0 install wasm-bindgen-cli --version 0.2.130 --locked --root client-rust/target/tools
```

Запустите сайт и API из корня репозитория.

```sh
npm run dev
```

Откройте `http://localhost:1234/`. Команда собирает `dist-release/` с теми же маршрутами, что и при публикации. Игра использует API на `http://localhost:8080`. В локальном `server/config.json` укажите `http://localhost:1234` в `server.origin`.

Для запуска только пробной сборки:

```sh
npm run build:slint
python3 -m http.server 1234 --bind 127.0.0.1 --directory dist
```

Откройте `http://localhost:1234/slint/`. Если нужны переходы к React-клиенту, предварительно соберите его командой `npm run build`.

Для проверки архивов из локального `db/archive/` упаковать их с помощью `bash scripts/packTimelapse.sh`, скопировать каталог `tmp/timelapse` в `dist` и открыть `http://localhost:1234/slint/timelapse/#staticHost=http://localhost:1234`.

```sh
(cd client-rust && cargo test --locked)
node --test client-rust/tests/timelapse.test.mjs
```

## Публикация

`npm run build:release` собирает чистый каталог `dist-release/`. На `/`, `/tg/` и `/timelapse/` работает Slint. React используется в админке `/qq/`. В комплект входят страницы входа, выхода и `404.html`, а также метаданные сайта. Для отдельного Telegram-хоста можно раздавать `dist-release/tg/` как корень сайта. При ошибке запуска кнопка «Повторить» перезагружает текущую страницу.

В GitHub Actions переменная репозитория `PIXELBATTLE_SLINT_DEFAULT=true` выбирает эту сборку для публикации. Если переменная выключена, workflow публикует `dist/` с текущим сайтом и тестовыми адресами Slint. Переключение зависит от критериев из [плана миграции](../SLINT_MIGRATION_PLAN.md).

### Переходная сборка

Для локальной репетиции переключения после сборки React и Slint запустить `npm run activate:slint`. Игра, Telegram-вариант и таймлапс откроются на `/`, `/tg/` и `/timelapse/`. Резервные страницы React доступны по тем же путям с префиксом `/react`.

После восстановления WebGL клиент заново загружает текущее поле. Если WebGL 2 недоступен при запуске или контекст не восстанавливается за пять секунд, загрузчик переходной сборки предлагает открыть React-версию. Атрибуция Slint размещена в [публичном README проекта](../README.md).

В резервной версии переходы из игры в таймлапс и обратно ведут по адресам `/react/` и `/react/timelapse/`. При переходе сохраняется фрагмент адреса, например `#staticHost=` для локального архива.
