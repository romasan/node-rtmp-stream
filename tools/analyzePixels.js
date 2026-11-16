/**
 * Анализ журнала пикселей: node tools/analyzePixels.js [путь-к-логу] > report.json
 * Быстрые интервалы < 1000 мс; регулярность — доля интервалов не длиннее
 * 10 минут, отличающихся от медианы не более чем на 5% или 100 мс.
 * Пространственные признаки описывают серии одного игрока и совместные
 * линии одного цвета. В отчёте координаты и номера строк исходного лога.
 * Сигналы требуют ручной проверки; общий IP может принадлежать прокси или сети.
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const analyzeSynchronization = require('./pixelSynchronization');

const spatialThresholds = {
    maxGapMs: 10000,
    straightMinPixels: 20,
    rasterMinWidth: 8,
    rasterMinRows: 3,
    coordinatedMaxGapMs: 5000,
    coordinatedMinPixels: 20,
    coordinatedMinSwitchRatio: 0.5,
    coordinatedMinPixelsPerAccount: 3,
};

function point({ timestamp, x, y, line }) {
    return { timestamp, x, y, line };
}

function episode(first, last, pixels) {
    return { pixels, start: point(first), end: point(last) };
}

function findSpatial(events) {
    const { maxGapMs, straightMinPixels, rasterMinWidth, rasterMinRows } = spatialThresholds;
    let straightRun = null;
    let rasterScan = null;
    let start = 0;
    let dx = 0;
    let dy = 0;
    let rowStart = 0;
    let rowDirection = 0;
    let raster = null;

    function finishRow(end) {
        const left = events[rowStart];
        const right = events[end];
        const minX = Math.min(left.x, right.x);
        const maxX = Math.max(left.x, right.x);
        const width = end - rowStart + 1;
        if (width < rasterMinWidth) {
            raster = null;
            return;
        }
        const yStep = raster ? left.y - raster.endY : 0;
        if (raster && minX === raster.minX && maxX === raster.maxX &&
            Math.abs(yStep) === 1 && (!raster.yStep || raster.yStep === yStep) &&
            left.timestamp - raster.last.timestamp <= maxGapMs) {
            raster.rows++;
            raster.endY = left.y;
            raster.last = right;
            raster.yStep = yStep;
        } else {
            raster = { minX, maxX, startY: left.y, endY: left.y, rows: 1, first: left, last: right, yStep: 0 };
        }
        if (raster.rows >= rasterMinRows && raster.rows * width > (rasterScan?.pixels ?? 0)) {
            rasterScan = {
                ...episode(raster.first, raster.last, raster.rows * width),
                rows: raster.rows,
                bounds: { minX, maxX, minY: Math.min(raster.startY, left.y), maxY: Math.max(raster.startY, left.y) },
            };
        }
    }

    for (let i = 1; i <= events.length; i++) {
        const previous = events[i - 1];
        const current = events[i];
        const closeInTime = current && current.timestamp - previous.timestamp <= maxGapMs;
        const stepX = closeInTime ? current.x - previous.x : 0;
        const stepY = closeInTime ? current.y - previous.y : 0;
        const unitStep = Math.max(Math.abs(stepX), Math.abs(stepY)) === 1;
        if (!unitStep || stepX !== dx || stepY !== dy) {
            const length = i - start;
            if (length >= straightMinPixels && length > (straightRun?.pixels ?? 0)) {
                straightRun = { ...episode(events[start], previous, length), dx, dy };
            }
            start = unitStep ? i - 1 : i;
            dx = stepX;
            dy = stepY;
        }

        const horizontal = unitStep && stepY === 0;
        if (horizontal && (!rowDirection || rowDirection === stepX)) {
            rowDirection = stepX;
        } else {
            finishRow(i - 1);
            rowStart = i;
            rowDirection = 0;
        }
    }
    return { straightRun, rasterScan };
}

// For each direction, link a pixel to the latest same-color pixel one step behind it.
function findCoordinatedPaths(events, accounts) {
    const { coordinatedMaxGapMs, coordinatedMinPixels, coordinatedMinSwitchRatio, coordinatedMinPixelsPerAccount } = spatialThresholds;
    const paths = [];
    const key = (x, y, color) => `${x};${y};${color}`;
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dx, dy] of directions) {
        const latest = new Map();
        const parent = new Int32Array(events.length);
        const length = new Uint32Array(events.length);
        const switches = new Uint32Array(events.length);
        const continued = new Uint8Array(events.length);

        for (let i = 0; i < events.length; i++) {
            const { x, y, color, timestamp, uuid } = events[i];
            const previous = latest.get(key(x - dx, y - dy, color));
            if (previous !== undefined && timestamp - events[previous].timestamp <= coordinatedMaxGapMs) {
                parent[i] = previous + 1;
                length[i] = length[previous] + 1;
                switches[i] = switches[previous] + Number(uuid !== events[previous].uuid);
                continued[previous] = 1;
            } else {
                length[i] = 1;
            }
            latest.set(key(x, y, color), i);
        }

        for (let i = 0; i < events.length; i++) {
            if (continued[i] || length[i] < coordinatedMinPixels ||
                switches[i] < (length[i] - 1) * coordinatedMinSwitchRatio) continue;

            const counts = new Map();
            const placements = [];
            let first = i;
            for (let j = i; j >= 0; j = parent[j] - 1) {
                const event = events[j];
                const { uuid } = event;
                counts.set(uuid, (counts.get(uuid) ?? 0) + 1);
                placements.push({ ...point(event), uuid });
                first = j;
            }
            if ([...counts.values()].filter(count => count >= coordinatedMinPixelsPerAccount).length < 2) continue;

            paths.push({
                ...episode(events[first], events[i], length[i]),
                color: events[i].color,
                dx,
                dy,
                accountSwitches: switches[i],
                accounts: [...counts].map(([uuid, pixels]) => ({ uuid, pixels, nicknames: [...accounts.get(uuid).nicknames] }))
                    .sort((a, b) => b.pixels - a.pixels || a.uuid.localeCompare(b.uuid)),
                placements: placements.reverse(),
            });
        }
    }
    return paths.sort((a, b) => b.pixels - a.pixels || b.accountSwitches - a.accountSwitches);
}

async function analyze(file = path.join(__dirname, '../db/pixels.log')) {
    const accounts = new Map();
    const ips = new Map();
    const groupEvents = [];
    let lineNumber = 0;
    const summary = { validLines: 0, invalidLines: 0, outOfOrderLines: 0 };
    let lastTime = -Infinity;
    const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
    for await (const line of rl) {
        lineNumber++;
        const fields = line.split(';');
        const [time, service, x, y, color, uuid, ip, ...nick] = fields;
        if (fields.length < 8 || !/^\d+$/.test(time) || !Number.isSafeInteger(Number(time)) ||
            !/^-?\d+$/.test(x) || !/^-?\d+$/.test(y) || !Number.isSafeInteger(Number(x)) || !Number.isSafeInteger(Number(y)) || !/^#[0-9a-f]{6}$/i.test(color) || !service || !uuid) {
            summary.invalidLines++;
            continue;
        }
        const timestamp = Number(time);
        summary.validLines++;
        if (timestamp < lastTime) summary.outOfOrderLines++;
        lastTime = timestamp;
        let account = accounts.get(uuid);
        if (!account) {
            account = { uuid, pixels: 0, events: [], services: new Set(), nicknames: new Set(), ips: new Set() };
            accounts.set(uuid, account);
        }
        account.pixels++;
        const event = { timestamp, x: Number(x), y: Number(y), color: color.toLowerCase(), uuid, line: lineNumber };
        account.events.push(event);
        if (service !== 'local') groupEvents.push(event);
        account.services.add(service);
        if (nick.join(';')) account.nicknames.add(nick.join(';'));
        if (ip) {
            account.ips.add(ip);
            if (!ips.has(ip)) ips.set(ip, new Set());
            ips.get(ip).add(uuid);
        }
    }
    const results = [];
    for (const account of accounts.values()) {
        const { events } = account;
        if (summary.outOfOrderLines) events.sort((a, b) => a.timestamp - b.timestamp);
        const intervals = [];
        let rapid = 0;
        let minInterval = null;
        for (let i = 1; i < events.length; i++) {
            const delta = events[i].timestamp - events[i - 1].timestamp;
            if (delta < 1000) rapid++;
            if (minInterval === null || delta < minInterval) minInterval = delta;
            if (delta <= 600000) intervals.push(delta);
        }
        intervals.sort((a, b) => a - b);
        const median = intervals.length ? intervals[Math.floor((intervals.length - 1) / 2)] : null;
        const tolerance = median === null ? null : Math.max(100, median * 0.05);
        const matching = median === null ? 0 : intervals.filter(value => Math.abs(value - median) <= tolerance).length;
        const ratio = intervals.length ? matching / intervals.length : 0;
        const signals = [];
        if (rapid >= 5) signals.push('rapid');
        if (intervals.length >= 10 && ratio >= 0.8) signals.push('regular');
        const spatial = findSpatial(events);
        if (spatial.straightRun) signals.push('straight_run');
        if (spatial.rasterScan) signals.push('raster_scan');
        if (!signals.length) continue;
        results.push({ uuid: account.uuid, nicknames: [...account.nicknames], services: [...account.services], ips: [...account.ips], pixels: account.pixels,
            firstTimestamp: events[0].timestamp, lastTimestamp: events.at(-1).timestamp, signals, spatial,
            rapid: { count: rapid, minIntervalMs: minInterval },
            regularity: { intervals: intervals.length, medianIntervalMs: median, toleranceMs: tolerance, matchingIntervals: matching, matchingRatio: ratio } });
    }
    results.sort((a, b) => b.signals.length - a.signals.length || b.rapid.count - a.rapid.count || b.pixels - a.pixels || a.uuid.localeCompare(b.uuid));
    const sharedIps = [...ips].filter(([, ids]) => ids.size >= 2)
        .map(([ip, ids]) => ({ ip, accountCount: ids.size, uuids: [...ids].sort() }))
        .sort((a, b) => b.accountCount - a.accountCount || a.ip.localeCompare(b.ip));
    if (summary.outOfOrderLines) groupEvents.sort((a, b) => a.timestamp - b.timestamp);
    const coordinatedPaths = findCoordinatedPaths(groupEvents, accounts);
    const synchronization = analyzeSynchronization(groupEvents, accounts, coordinatedPaths);
    return { summary: { ...summary, accounts: accounts.size, flaggedAccounts: results.length, sharedIps: sharedIps.length,
        coordinatedPaths: coordinatedPaths.length, synchronizationEdges: synchronization.edges.length,
        synchronizationClusters: synchronization.clusters.length },
        thresholds: { rapidIntervalMsExclusive: 1000, rapidMinCount: 5, regularMaxIntervalMs: 600000, regularMinIntervals: 10, regularMinRatio: 0.8, regularTolerance: 'max(100 ms, 5% of median)', spatial: spatialThresholds },
        accounts: results, sharedIps, coordinatedPaths, synchronization };
}

if (require.main === module) {
    if (process.argv[2] === '--help' || process.argv[2] === '-h') {
        console.log('Usage: node tools/analyzePixels.js [log-file] > report.json\nDefault: db/pixels.log. Reports are heuristic and contain IP addresses.');
    } else {
        analyze(process.argv[2]).then(report => console.log(JSON.stringify(report, null, 2))).catch(error => {
            console.error(error.message);
            process.exitCode = 1;
        });
    }
}
module.exports = analyze;
