const DEFAULT_SPEED = 15000;
const pixelsFormat = new Intl.NumberFormat('ru');

function formatPixels(value) {
    return pixelsFormat.format(value).replace(/\s/g, ' ');
}

function formatDuration(pixels, speed) {
    const seconds = Math.floor(pixels / speed);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function createReplay(client, mobile = false) {
    const override = new URLSearchParams(location.hash.slice(1)).get('staticHost');
    const host = (override || 'https://static.pixelbattles.ru').replace(/\/$/, '');
    const base = `${host}/timelapse/`;
    let seasons;
    let season;
    let generation = 0;
    let abort;
    let loadedPart;
    let prefetchedPart;
    let cursor = 0;
    let total = 0;
    let frame = null;
    let lastTime;
    let fractional = 0;
    let playing = false;
    let suspended = false;
    let seeking = false;
    let loadFailed = false;
    let retryInitial;
    let speed = DEFAULT_SPEED;
    let showTime = false;

    const seasonPicker = mobile ? document.createElement('select') : undefined;
    if (seasonPicker) {
        seasonPicker.setAttribute('aria-label', 'Сезон');
        Object.assign(seasonPicker.style, { position: 'fixed', opacity: 0, fontSize: '16px' });
        seasonPicker.hidden = true;
        seasonPicker.addEventListener('change', () => { void select(seasonPicker.selectedIndex); });
        document.body.append(seasonPicker);
    }

    function updateDisplay() {
        const position = showTime
            ? `${formatDuration(cursor, speed)} / ${formatDuration(total, speed)}`
            : `${formatPixels(cursor)} / ${formatPixels(total)} pix`;
        client.replay_display(total ? cursor / total : 0, position, `${Number((speed / DEFAULT_SPEED).toFixed(2))}X`);
    }

    async function fetchArchive(path, signal) {
        const response = await fetch(new URL(path, base), { signal, cache: loadFailed ? 'reload' : 'default' });
        if (!response.ok) throw new Error(`Archive request failed: ${response.status}`);
        return response;
    }

    function stop() {
        playing = false;
        client.playing(false);
        cancelAnimationFrame(frame);
        frame = null;
        lastTime = undefined;
        fractional = 0;
    }

    function replaceRequest() {
        abort?.abort();
        prefetchedPart = undefined;
        abort = new AbortController();
        return ++generation;
    }

    async function fetchRecords(directory, part, signal) {
        const records = await fetchArchive(`${directory}/${part}.bin`, signal);
        const decompress = records.body.pipeThrough(new DecompressionStream('gzip'));
        return new Response(decompress).arrayBuffer();
    }

    function preloadNextPart() {
        const next = loadedPart.end + 1;
        if (next >= total || prefetchedPart?.after === loadedPart.part) return;
        const chunk = JSON.parse(client.replay_chunk(next) ?? 'null');
        if (!chunk) return;
        prefetchedPart = {
            after: loadedPart.part,
            part: chunk.part,
            data: fetchRecords(encodeURIComponent(season), chunk.part, abort.signal).catch(() => undefined),
        };
    }

    async function render(position) {
        // The cursor counts applied updates. A chunk PNG precedes its first update.
        const pixel = Math.max(0, position - 1);
        const chunk = JSON.parse(client.replay_chunk(pixel) ?? 'null');
        if (!chunk) throw new Error('Position outside archive');
        const current = generation;
        const { signal } = abort;
        const alreadyLoaded = Boolean(loadedPart);
        if (loadedPart?.part !== chunk.part || position < cursor) {
            const sequential = !seeking && loadedPart?.end + 1 === chunk.start
                && cursor === chunk.start && chunk.can_continue;
            const preload = prefetchedPart?.part === chunk.part ? await prefetchedPart.data : undefined;
            if (current !== generation) return false;
            const directory = encodeURIComponent(season);
            const records = preload ?? fetchRecords(directory, chunk.part, signal);
            if (sequential) {
                const pixels = await records;
                if (current !== generation) return false;
                if (!client.continue_replay(pixel, new Uint8Array(pixels))) {
                    throw new Error('Invalid archive part');
                }
            } else {
                const needsPrevious = chunk.previous_pixel !== null && loadedPart?.end !== chunk.previous_pixel;
                const [png, pixels, previous] = await Promise.all([
                    fetchArchive(`${directory}/${chunk.part}.png`, signal).then(image => image.arrayBuffer()),
                    records,
                    needsPrevious ? fetchRecords(directory, chunk.part - 1, signal) : undefined,
                ]);
                if (current !== generation) return false;
                const recenter = !loadedPart || loadedPart.section_start !== chunk.section_start
                    || (seeking && loadedPart.part !== chunk.part);
                if (!client.load_replay_chunk(
                    pixel, new Uint8Array(png), new Uint8Array(pixels), new Uint8Array(previous), recenter,
                )) {
                    throw new Error('Invalid archive part');
                }
            }
            loadedPart = chunk;
            prefetchedPart = undefined;
        }
        client.advance_replay(position === 0 ? 0 : chunk.offset + 1);
        cursor = position;
        updateDisplay();
        if (!alreadyLoaded || loadFailed) {
            loadFailed = false;
            client.replay_state(true, '', false);
        }
        return true;
    }

    function report(error, current, retry) {
        if (current !== generation || error.name === 'AbortError') return;
        stop();
        replaceRequest();
        seeking = false;
        loadFailed = true;
        retryInitial = retry;
        client.replay_state(Boolean(loadedPart), 'Не удалось загрузить архив', Boolean(retry));
        console.error(error);
    }

    async function select(index) {
        if (!seasons?.[index]) return;
        stop();
        const current = replaceRequest();
        retryInitial = undefined;
        seeking = false;
        if (seasonPicker) seasonPicker.selectedIndex = index;
        season = seasons[index].key;
        loadedPart = undefined;
        cursor = 0;
        total = 0;
        client.replay_selected(index);
        client.replay_state(false, 'Загрузка…', false);
        updateDisplay();
        try {
            const data = await (await fetchArchive(`${encodeURIComponent(season)}/index.json`, abort.signal)).json();
            if (current !== generation) return;
            if (!client.load_archive(JSON.stringify(data))) throw new Error('Invalid season index');
            // Archive metadata stores the index of the final update.
            total = data.total + 1;
            await render(0);
        } catch (error) {
            report(error, current, () => select(index));
        }
    }

    async function open() {
        retryInitial = undefined;
        const current = replaceRequest();
        client.replay_state(false, 'Загрузка…', false);
        try {
            const index = await (await fetchArchive('index.json', abort.signal)).json();
            if (current !== generation) return;
            seasons = [];
            let group = 0;
            for (const entry of index.seasons) {
                if (entry.delimiter) {
                    if (seasons.length) group = seasons.at(-1).group + 1;
                } else {
                    seasons.push({ key: entry.key, label: entry.label, group });
                }
            }
            if (seasonPicker) {
                seasonPicker.replaceChildren();
                let previousGroup = 0;
                for (const { label, group } of seasons) {
                    if (group !== previousGroup) seasonPicker.append(document.createElement('hr'));
                    seasonPicker.add(new Option(label));
                    previousGroup = group;
                }
            }
            client.set_seasons(JSON.stringify(seasons.map(({ label, group }) => [label, group])));
            updateDisplay();
            if (seasons.length) await select(seasons.length - 1);
            else client.replay_state(false, 'Нет доступных сезонов', false);
        } catch (error) {
            report(error, current, open);
        }
    }

    async function seek(fraction) {
        if (!loadedPart) return;
        stop();
        const current = replaceRequest();
        seeking = true;
        try {
            await render(Math.round(Math.max(0, Math.min(1, fraction)) * total));
        } catch (error) {
            report(error, current);
        } finally {
            if (current === generation) seeking = false;
        }
    }

    async function tick(time) {
        const current = generation;
        if (!playing || suspended) return;
        const elapsed = Math.min(100, time - (lastTime ?? time));
        lastTime = time;
        fractional += elapsed * speed / 1000;
        const pixels = Math.floor(fractional);
        fractional -= pixels;
        try {
            // Show the current part's final frame before applying the next snapshot.
            const boundary = Math.max(loadedPart.end + 1, cursor + 1);
            const next = Math.min(total, cursor + pixels, boundary);
            if (next > cursor && !await render(next)) return;
            if (!playing || current !== generation) return;
            if (cursor === total) stop();
            else {
                preloadNextPart();
                frame = requestAnimationFrame(tick);
            }
        } catch (error) {
            report(error, current);
        }
    }

    return {
        positionSeasonPicker(left, top, width, height, visible) {
            if (!seasonPicker) return;
            Object.assign(seasonPicker.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
            seasonPicker.hidden = !visible;
        },
        removeSeasonPicker() { seasonPicker?.remove(); },
        suspend() {
            if (suspended) return;
            suspended = true;
            if (playing) {
                cancelAnimationFrame(frame);
                frame = null;
                lastTime = undefined;
                replaceRequest();
            }
        },
        resume() {
            if (!suspended) return;
            suspended = false;
            if (playing) frame = requestAnimationFrame(tick);
        },
        open,
        select,
        seek,
        toggle() {
            if (retryInitial) {
                void retryInitial();
                return;
            }
            if (!loadedPart || seeking) return;
            if (playing) {
                stop();
                replaceRequest();
            }
            else if (cursor < total) {
                playing = true;
                client.playing(true);
                if (!suspended) frame = requestAnimationFrame(tick);
            }
        },
        togglePosition() {
            showTime = !showTime;
            updateDisplay();
        },
        speed(factor) {
            speed = Math.min(1_000_000, Math.max(1, Math.floor(speed * factor)));
            updateDisplay();
        },
    };
}
