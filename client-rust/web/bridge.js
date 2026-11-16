const canvas = document.querySelector('#canvas');
const hostname = location.hostname;
const local = hostname === 'localhost' || hostname === '127.0.0.1';
const api = local ? `${location.protocol}//${hostname}:8080` : `${location.protocol}//api.${hostname.replace(/^(www|tg)\./, '')}`;
const wsUrl = api.replace(/^https?:/, location.hash === '#secured' || location.protocol === 'https:' ? 'wss:' : 'ws:');
const heartbeatTimeout = 30000;
let client;
let socket;
let lastSocketActivity = 0;
let sessionRequest;
let snapshotRequest;
let statsRequest;
let reconnectTimer;
let connectTimer;
let heartbeat;
let contextTimer;
let halted = false;
let placing = false;
let authenticating = false;
let telegramSdk;
let palette = {};
let initialized = false;
let replay;

const route = document.documentElement.dataset.client;
const preview = /(?:^|\/)slint(?:\/|$)/.test(location.pathname);
const timelapsePath = preview ? '/slint/timelapse/' : '/timelapse/';

export function navigate(path) {
    if (path === 'timelapse/') {
        path = timelapsePath + location.hash;
    }
    if (path === 'game') {
        path = preview ? '/slint/' : '/';
    }
    if (path.startsWith("https://")) window.open(path, "_blank", "noopener,noreferrer");
    else location.assign(path);
}

export function open_finish_link(url) {
    const target = new URL(url);
    if (target.protocol !== 'https:' && target.protocol !== 'http:') return;
    const site = target.origin === location.origin
        || /^(www\.)?pixelbattles\.ru$/.test(target.hostname);
    if (site && /^\/timelapse\/?$/.test(target.pathname)) {
        location.assign(timelapsePath + target.search + (target.hash || location.hash));
    } else {
        location.assign(target.href);
    }
}

export function open_chat_link(url) {
    const target = new URL(url);
    if (target.protocol !== 'https:') return;
    if (target.hostname === 'pixelbattles.ru') location.assign(target.href);
    else navigate(target.href);
}

export function select_season(index) { void replay?.select(index); }
export function replay_seek(position) { void replay?.seek(position); }
export function replay_toggle() { replay?.toggle(); }
export function replay_speed(factor) { replay?.speed(factor); }
export function replay_toggle_position() { replay?.togglePosition(); }
export function position_native_season_picker(left, top, width, height, visible) {
    replay?.positionSeasonPicker(left, top, width, height, visible);
}

export function set_field_cursor(cursor) {
    if (cursor) canvas.dataset.fieldCursor = cursor;
    else delete canvas.dataset.fieldCursor;
}

function fail(error) {
    console.error(error);
    if (halted) return;
    halted = true;
    clearTimeout(reconnectTimer);
    clearTimeout(connectTimer);
    clearTimeout(contextTimer);
    clearInterval(heartbeat);
    sessionRequest?.abort();
    snapshotRequest?.abort();
    cancel_stats();
    cancel_pixel_inspection();
    replay?.removeSeasonPicker();
    socket?.close();
    canvas.hidden = true;
    document.querySelector('#fallback').hidden = false;
}

async function request(path, options) {
    const response = await fetch(api + path, { credentials: 'include', ...options });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response;
}

function storedColors() {
    try {
        const saved = JSON.parse(localStorage.getItem('palette'));
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
            return Object.fromEntries(Object.entries(saved).filter(([, color]) =>
                typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)));
        }
    } catch {
        // Storage can be unavailable in a WebView.
    }
    return palette.truecolor ?? {};
}

let sessionPalette;

export function updatePalette() {
    const scheme = client.scheme();
    const colors = scheme === 'truecolor' ? sessionPalette ??= storedColors() : palette[scheme] ?? {};
    const initialColor = scheme === 'truecolor' ? Object.values(palette.truecolor ?? {}).at(-1) ?? '' : '';
    client.set_palette(JSON.stringify(Object.entries(colors)), initialColor);
}

function persistColors(colors) {
    sessionPalette = colors;
    try {
        localStorage.setItem('palette', JSON.stringify(colors));
    } catch {
        // Storage can be unavailable in a WebView.
    }
    updatePalette();
}

export function save_color(slot, color) {
    const colors = sessionPalette ?? storedColors();
    if (Object.values(colors).some(value => value.toLowerCase() === color)) return;
    persistColors({ ...colors, [slot || color]: color });
}

export function delete_color(slot) {
    const colors = { ...(sessionPalette ?? storedColors()) };
    delete colors[slot];
    persistColors(colors);
}

export function session_initialized() {
    initialized = true;
    clearTimeout(connectTimer);
}

export async function snapshot() {
    if (halted) return;
    snapshotRequest?.abort();
    const controller = new AbortController();
    snapshotRequest = controller;
    const retry = () => {
        if (snapshotRequest === controller && !controller.signal.aborted) {
            client.snapshot_failed();
            reconnect();
        }
    };
    const timeout = setTimeout(retry, 15000);
    updatePalette();
    try {
        const response = await request('/canvas.png', { cache: 'no-store', signal: controller.signal });
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (controller.signal.aborted || client.load_snapshot(bytes)) return;
        // A resized PNG can arrive before its WebSocket expansion event,
        // which will replace this request once the new geometry is known.
        clearTimeout(timeout);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retry();
    } catch {
        retry();
    } finally {
        clearTimeout(timeout);
        if (snapshotRequest === controller) snapshotRequest = undefined;
    }
}

let pixelInspection;

export function cancel_pixel_inspection() {
    if (!pixelInspection) return;
    clearTimeout(pixelInspection.timer);
    pixelInspection.controller.abort();
    pixelInspection = undefined;
}

function pixelAge(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const pair = number => String(number).padStart(2, '0');
    return `${days ? days + ' д. ' : ''}${hours ? pair(hours % 24) + ':' : ''}${pair(minutes % 60)}:${pair(seconds % 60)} назад`;
}

export function inspect_pixel(x, y, finished) {
    cancel_pixel_inspection();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
        try {
            const query = new URLSearchParams({ x, y });
            const response = await request(`/pix?${query}`, { signal: controller.signal });
            const pixel = await response.json();
            if (controller.signal.aborted || pixel.x !== x || pixel.y !== y || !Number.isFinite(pixel.time)) return;
            if (pixel.time < 0) {
                const label = finished ? 'Про этот пиксель все забыли' : 'Пустой пиксель, закрась его';
                client.pixel_details(x, y, finished, label, '', '', '');
                return;
            }
            const area = ['twitch', 'discord', 'steam', 'telegram', 'vk'].includes(pixel.area) ? pixel.area : '';
            const time = finished ? pixelDate(pixel.time) : pixelAge(pixel.time);
            client.pixel_details(x, y, finished, pixel.name ?? '', area, time, pixel.color ?? '');
        } catch {
            // Keep the field interactive if inspection is unavailable.
        }
    }, 1000);
    pixelInspection = { controller, timer };
}

export async function place_pixel(x, y, color) {
    if (placing || !initialized || contextTimer !== undefined) return;
    placing = true;
    const scheme = client.scheme();
    const rgb = palette[scheme]?.[color] ?? color;
    const connection = socket;
    try {
        const response = await request('/pix', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y, color }),
        });
        const answer = await response.text();
        if (answer === 'ok' && connection === socket && scheme === client.scheme()) {
            client.pixel_placed(x, y, rgb);
        }
        const status = {
            fail: 'Не удалось поставить пиксель',
            skip: 'Пиксель пропущен',
            await: 'Дождитесь окончания таймера',
            paused: 'Игра на паузе',
            timeout: 'Игра завершена',
        }[answer];
        if (status) client.status(status);
    } catch {
        client.status('Пиксель не отправлен');
    } finally {
        placing = false;
    }
}

export async function history() {
    try {
        const response = await request('/messages');
        client.merge_history(JSON.stringify(await response.json()));
    } catch {
        client.status('Не удалось загрузить чат');
    }
}

const dayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' });
const yearFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' });
const pixelTimeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const chatEntities = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'" };

function displayDay(date) {
    const day = date.getFullYear() === new Date().getFullYear() ? dayFormat : yearFormat;
    return day.format(date).replace(/\s*г\.$/, '');
}

function pixelDate(time) {
    const date = new Date(time);
    return `${displayDay(date)} ${pixelTimeFormat.format(date)}`;
}

export function chat_display(time, text) {
    const date = new Date(time);
    return JSON.stringify({
        day: displayDay(date),
        time: timeFormat.format(date),
        text: text.replace(/&(lt|gt|amp|quot|#39);/g, entity => chatEntities[entity]),
    });
}

export function cancel_stats() {
    statsRequest?.abort();
    statsRequest = undefined;
}

export async function stats() {
    cancel_stats();
    const controller = new AbortController();
    statsRequest = controller;
    client.stats_status('Загрузка…');
    try {
        const { total, leaderboard, onlineCount, onlineList } =
            await (await request('/stats', { signal: controller.signal })).json();
        if (controller.signal.aborted) return;
        const number = value => Number(value).toLocaleString('ru');
        const data = {
            total: number(total),
            onlineCount: Number(onlineCount) || 0,
            leaderboard: (leaderboard ?? []).map(({ place, name, platform, count }) =>
                ({ place: String(place), name, area: platform ?? '', count: number(count) })),
            onlineList: (onlineList ?? []).map(({ name, area }) => ({ name, area: area ?? '' })),
        };
        if (!client.load_stats(JSON.stringify(data))) throw new Error('Invalid stats data');
    } catch {
        if (!controller.signal.aborted) client.stats_status('Не удалось загрузить статистику');
    } finally {
        if (statsRequest === controller) statsRequest = undefined;
    }
}

let messageSubmission;

export function forget_message_submission() {
    messageSubmission = undefined;
}

export async function post_message(text) {
    const submission = Symbol();
    messageSubmission = submission;
    let error = 'Сообщение не отправлено';
    try {
        const response = await request('/chat', { method: 'PUT', body: text });
        if (await response.text() === 'ok') error = '';
    } catch {
        // Keep the submitted draft, including after a server-side cooldown.
    }
    if (messageSubmission === submission) {
        forget_message_submission();
        client.chat_result(text, error);
    }
}

export async function telegram_auth() {
    if (!telegramSdk || authenticating) return;
    authenticating = true;
    try {
        const telegram = await telegramSdk;
        if (!telegram?.initData || halted) {
            authenticating = false;
            return;
        }
        const response = await request('/auth/telegram/app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: telegram.initData,
        });
        if (await response.text() === 'success') {
            location.reload();
            return;
        }
        throw new Error('Telegram authorization failed');
    } catch {
        client.status('Не удалось войти через Telegram');
        authenticating = false;
    }
}

function reconnect() {
    if (halted) return;
    clearInterval(heartbeat);
    clearTimeout(reconnectTimer);
    clearTimeout(connectTimer);
    sessionRequest?.abort();
    snapshotRequest?.abort();
    const previousSocket = socket;
    socket = null;
    previousSocket?.close();
    initialized = false;
    cancel_pixel_inspection();
    client.disconnected();
    reconnectTimer = setTimeout(connect, 10000);
}

export function reconnect_now() {
    if (halted) return;
    reconnect();
    clearTimeout(reconnectTimer);
    void connect();
}

function resumeConnection() {
    if (halted || sessionRequest || socket?.readyState === WebSocket.CONNECTING) return;
    if (socket?.readyState === WebSocket.OPEN && Date.now() - lastSocketActivity < heartbeatTimeout) return;
    reconnect_now();
}

function beginSessionRequest() {
    const controller = new AbortController();
    sessionRequest = controller;
    const status = request('/start', { signal: controller.signal })
        .then(response => response.text())
        .catch(() => undefined);
    return { controller, status };
}

async function connect(attempt) {
    if (halted) return;
    const { controller, status: pendingStatus } = attempt ?? beginSessionRequest();
    connectTimer = setTimeout(reconnect, 15000);
    try {
        const status = await pendingStatus;
        if (halted || controller.signal.aborted) return;
        if (status !== 'ok' && status !== 'qq') throw new Error('Session unavailable');
        client.moderator(status === 'qq');
        const connection = new WebSocket(wsUrl);
        socket = connection;
        connection.binaryType = 'arraybuffer';
        connection.onopen = () => {
            if (socket !== connection) return;
            lastSocketActivity = Date.now();
            heartbeat = setInterval(() => {
                if (connection.readyState !== WebSocket.OPEN || Date.now() - lastSocketActivity >= heartbeatTimeout) reconnect();
                else connection.send('2');
            }, 10000);
        };
        connection.onmessage = ({ data }) => {
            if (socket !== connection) return;
            lastSocketActivity = Date.now();
            const wasInitialized = initialized;
            if (typeof data === 'string') client.text(data);
            else client.binary(new Uint8Array(data));
            if (!wasInitialized && initialized) void history();
        };
        connection.onclose = () => {
            if (socket === connection) reconnect();
        };
    } catch {
        if (!controller.signal.aborted) reconnect();
    } finally {
        if (sessionRequest === controller) sessionRequest = undefined;
    }
}

function gestures() {
    const points = new Map();
    let moved = false;
    let canDrag = false;
    let origin;
    let hold;

    function position(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * client.viewport_width() / rect.width,
            y: (event.clientY - rect.top) * client.viewport_height() / rect.height,
        };
    }

    function midpoint(a, b) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    // Raise the window before Winit dispatches the press to its controls.
    canvas.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary) return;
        const point = position(event);
        client.activate_window_at(point.x, point.y);
    }, { capture: true });

    canvas.addEventListener('pointerdown', event => {
        if (event.button !== 0 || points.size === 2) return;
        const point = position(event);
        const onField = client.field_area(point.x, point.y);
        const touch = event.pointerType === 'touch';
        const canHold = !hold && !points.size && touch && event.isPrimary;
        hold = undefined;
        // A second finger cancels a tap even if it lands on a control.
        if (points.size) moved = true;
        else if (touch && !event.isPrimary) return;
        if (!onField) {
            if (canHold) {
                hold = { id: event.pointerId, point, started: performance.now() };
            }
            return;
        }
        if (!points.size) {
            origin = point;
            moved = false;
            canDrag = client.board_contains(point.x, point.y);
            if (!canDrag && !touch) return;
        } else {
            canDrag = true;
        }
        canvas.setPointerCapture(event.pointerId);
        points.set(event.pointerId, point);
    });

    canvas.addEventListener('pointermove', event => {
        const point = position(event);
        if (event.pointerType !== 'touch') client.point_at(point.x, point.y, true);
        if (hold?.id === event.pointerId && distance(hold.point, point) >= 4) hold = undefined;
        const previous = points.get(event.pointerId);
        if (!previous) return;
        if (!canDrag) {
            points.set(event.pointerId, point);
            return;
        }
        if (!moved && distance(origin, point) < 4) return;
        points.set(event.pointerId, point);
        if (points.size === 1) {
            client.move_field(previous.x, previous.y, point.x - previous.x, point.y - previous.y, 1);
        } else {
            const other = [...points].find(([id]) => id !== event.pointerId)[1];
            const from = midpoint(previous, other);
            const to = midpoint(point, other);
            const scale = Math.max(1, distance(point, other)) / Math.max(1, distance(previous, other));
            client.move_field(from.x, from.y, to.x - from.x, to.y - from.y, scale);
        }
        moved = true;
    });

    canvas.addEventListener('pointerleave', () => client.point_at(0, 0, false));

    canvas.addEventListener('pointerup', event => {
        if (hold?.id === event.pointerId) {
            const { point, started } = hold;
            hold = undefined;
            if (performance.now() - started >= 300 && distance(point, position(event)) < 4) {
                client.palette_hold(point.x, point.y);
            }
            return;
        }
        if (!points.delete(event.pointerId) || !canDrag || moved || points.size) return;
        const point = position(event);
        if (!client.field_area(point.x, point.y)) return;
        const touch = event.pointerType === 'touch';
        if (!touch) client.point_at(point.x, point.y, true);
        client.canvas_click(point.x, point.y, touch);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
        canvas.addEventListener(type, ({ pointerId }) => {
            if (hold?.id === pointerId) hold = undefined;
            if (points.delete(pointerId)) moved = true;
        });
    }

    canvas.addEventListener('wheel', event => {
        const point = position(event);
        const delta = event.deltaX || event.deltaY;
        const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? client.viewport_width() : 1;
        if (delta && client.scroll_palette(point.x, point.y, delta * unit)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        if (!event.deltaY) return;
        if (!client.field_area(point.x, point.y)) return;
        event.preventDefault();
        client.point_at(point.x, point.y, event.pointerType !== 'touch');
        client.wheel_zoom(point.x, point.y, event.deltaY > 0 ? 1 / 1.1 : 1.1);
    }, { capture: true, passive: false });
}

export async function boot(init, Client, paletteResponse, telegramStartup) {
    try {
        // FemtoVG needs WebGL 2; check before Winit takes ownership of the canvas.
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) throw new Error('WebGL 2 is unavailable');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        const initialSession = beginSessionRequest();
        const configRequest = paletteResponse.then(response => {
            if (!response?.ok) throw new Error('Palette unavailable');
            return response.json();
        });
        const isReplay = route === 'timelapse';
        const replayModule = isReplay ? import('./timelapse.js') : undefined;
        const [config, , replayControls] = await Promise.all([configRequest, init(), replayModule]);
        palette = config.colorSchemes;
        const isTelegram = telegramStartup.enabled;
        client = new Client(isTelegram, isReplay, local);
        const mobile = isTelegram
            || window.matchMedia('(pointer: coarse)').matches;
        client.set_layout(mobile, `Пиксель батл ${config.year} ${config.episode}`);
        if (isTelegram) {
            telegramSdk = telegramStartup.sdk;
            void telegramSdk.then(telegram => {
                if (!telegram || halted) return;
                telegram.expand();
                telegram.setBackgroundColor('#d9d7ff');
                telegram.setHeaderColor('#d9d7ff');
                telegram.ready();
            }).catch(error => console.error(error));
        }
        const resize = () => {
            const width = window.visualViewport?.width ?? window.innerWidth;
            const height = window.visualViewport?.height ?? window.innerHeight;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            client.resize(width, height, window.devicePixelRatio);
        };
        window.visualViewport?.addEventListener('resize', resize);
        window.addEventListener("resize", resize);
        resize();
        gestures();
        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            if (halted) return;
            replay?.suspend();
            clearTimeout(contextTimer);
            contextTimer = setTimeout(() => fail(new Error('WebGL context could not be restored')), 5000);
        });
        canvas.addEventListener('webglcontextrestored', () => {
            if (halted || contextTimer === undefined) return;
            clearTimeout(contextTimer);
            contextTimer = undefined;
            if (isReplay) replay.resume();
            else reconnect_now();
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) resumeConnection();
        });
        window.addEventListener('online', resumeConnection);
        if (isReplay) {
            replay = replayControls.createReplay(client, mobile);
            canvas.focus({ preventScroll: true });
            window.addEventListener('keyup', event => {
                if (event.code === 'Space' && !event.repeat && event.target === canvas && client.replay_key()) {
                    event.preventDefault();
                }
            });
            void replay.open();
        } else {
            const sequence = 'life';
            let matched = 0;
            window.addEventListener('keyup', event => {
                if ((event.target !== canvas && event.target !== document.body)
                    || event.ctrlKey || event.metaKey || event.altKey) {
                    matched = 0;
                    return;
                }
                matched = event.key === sequence[matched] ? matched + 1 : 0;
                if (matched === sequence.length) {
                    matched = 0;
                    client.start_life();
                }
            });
        }
        void connect(initialSession);
    } catch (error) {
        fail(error);
    }
}
