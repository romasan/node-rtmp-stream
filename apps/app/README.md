# Веб-клиент Pixel Battle на Slint

Rust/WASM-клиент использует Slint с FemtoVG и браузерный мост в `web/bridge.js`. Маршруты: игра `/`, Telegram `/tg/`, таймлапс `/timelapse/`.

Установите зависимости из корня репозитория (`npm ci`), Rust из `rust-toolchain.toml`, WASM target и Trunk 0.22.1. Затем:

```sh
cd apps/app
trunk serve            # http://localhost:1420/
trunk build --release  # dist/
```

При общем запуске `npm run dev` используйте единый адрес `http://localhost:1234/`: переходы в админку и на страницы входа проходят через dev-прокси. Отдельный `trunk serve` доступен на порту 1420; для страниц админки и входа должен также работать `npm run dev:admin`. HTTP и WebSocket направляются на `127.0.0.1:8080`. Палитра создаётся перед сборкой из общих настроек и цветовых схем. В production корневая команда `npm run build` собирает также админку и сервер и компонует сайт в `dist-release/`; `dist-release/tg/` подходит для раздачи с отдельного Telegram-хоста. Для WASM сервер должен отдавать `application/wasm`.

Проверки из корня:

```sh
npm run check
npm test
```

Для локальных архивов подготовьте данные через `scripts/packTimelapse.sh`; параметр `#staticHost=` выбирает адрес статики таймлапса.
