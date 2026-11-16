// Compare short delays with a separate band of delays of the same width.
const thresholds = {
    maxDistance: 2, // Chebyshev distance on the canvas
    maxDelayMs: 1500,
    controlDelayFromMs: 8500,
    controlDelayToMs: 10000,
    windowMs: 60000,
    minMatches: 20,
    minWindows: 3,
    minLift: 3,
};

function buildClusters(edges, accounts, paths) {
    const neighbors = new Map();
    for (const { uuids: [a, b] } of edges) {
        if (!neighbors.has(a)) neighbors.set(a, []);
        if (!neighbors.has(b)) neighbors.set(b, []);
        neighbors.get(a).push(b);
        neighbors.get(b).push(a);
    }

    const clusters = [];
    const membership = new Map();
    for (const uuid of neighbors.keys()) {
        if (membership.has(uuid)) continue;
        const uuids = [uuid];
        const cluster = { uuids, relatedPathIndexes: [] };
        membership.set(uuid, cluster);
        let degrees = 0;
        for (const member of uuids) {
            degrees += neighbors.get(member).length;
            for (const neighbor of neighbors.get(member)) {
                if (membership.has(neighbor)) continue;
                membership.set(neighbor, cluster);
                uuids.push(neighbor);
            }
        }
        uuids.sort();
        cluster.edgeCount = degrees / 2;
        cluster.density = degrees / (uuids.length * (uuids.length - 1));
        cluster.accounts = uuids.map(id => ({ uuid: id, nicknames: [...accounts.get(id).nicknames] }));
        clusters.push(cluster);
    }

    for (const [index, path] of paths.entries()) {
        const membersPerCluster = new Map();
        for (const { uuid } of path.accounts) {
            const cluster = membership.get(uuid);
            if (!cluster) continue;
            const count = (membersPerCluster.get(cluster) ?? 0) + 1;
            membersPerCluster.set(cluster, count);
            if (count === 2) cluster.relatedPathIndexes.push(index);
        }
    }

    for (const cluster of clusters) {
        cluster.evidence = cluster.relatedPathIndexes.length ? 'synchrony_and_shared_path' : 'synchrony';
    }
    return clusters.sort((a, b) => b.uuids.length - a.uuids.length || b.density - a.density);
}

function analyzeSynchronization(events, accounts, paths) {
    const cells = new Map();
    const pairs = new Map();
    const { maxDistance, maxDelayMs, controlDelayFromMs, controlDelayToMs, windowMs } = thresholds;
    const size = maxDistance + 1;
    const key = (x, y, color) => `${x};${y};${color}`;
    const cellKey = event => key(Math.floor(event.x / size), Math.floor(event.y / size), event.color);
    const sample = ({ line, timestamp, x, y, uuid }) => ({ line, timestamp, x, y, uuid });
    let oldest = 0;

    for (const [index, current] of events.entries()) {
        while (oldest < index && current.timestamp - events[oldest].timestamp > controlDelayToMs) {
            const expired = events[oldest++];
            const id = cellKey(expired);
            const cell = cells.get(id);
            cell.delete(expired);
            if (!cell.size) cells.delete(id);
        }

        const col = Math.floor(current.x / size);
        const row = Math.floor(current.y / size);
        for (let x = col - 1; x <= col + 1; x++) {
            for (let y = row - 1; y <= row + 1; y++) {
                const cell = cells.get(key(x, y, current.color));
                if (!cell) continue;
                for (const previous of cell) {
                    if (current.uuid === previous.uuid || Math.abs(current.x - previous.x) > maxDistance ||
                        Math.abs(current.y - previous.y) > maxDistance) continue;
                    const delay = current.timestamp - previous.timestamp;
                    if (delay > maxDelayMs && delay < controlDelayFromMs) continue;
                    const uuids = [previous.uuid, current.uuid].sort();
                    const pairKey = JSON.stringify(uuids);
                    let pair = pairs.get(pairKey);
                    if (!pair) {
                        pair = { uuids, matches: 0, controlMatches: 0, activeWindows: 0, examples: [], lastWindow: null };
                        pairs.set(pairKey, pair);
                    }
                    if (delay >= controlDelayFromMs) {
                        pair.controlMatches++;
                        continue;
                    }
                    pair.matches++;
                    const window = Math.floor(current.timestamp / windowMs);
                    if (window !== pair.lastWindow) {
                        pair.lastWindow = window;
                        pair.activeWindows++;
                        if (pair.examples.length < thresholds.minWindows) {
                            pair.examples.push({ delayMs: delay, color: current.color, pixels: [sample(previous), sample(current)] });
                        }
                    }
                }
            }
        }

        const id = cellKey(current);
        if (!cells.has(id)) cells.set(id, new Set());
        cells.get(id).add(current);
    }

    const edges = [];
    for (const { lastWindow, ...pair } of pairs.values()) {
        // Add one on both sides so that zero control matches gives a finite ratio.
        const lift = (pair.matches + 1) / (pair.controlMatches + 1);
        if (pair.matches >= thresholds.minMatches && pair.activeWindows >= thresholds.minWindows && lift >= thresholds.minLift) {
            edges.push({ ...pair, lift });
        }
    }
    edges.sort((a, b) => b.activeWindows - a.activeWindows || b.matches - a.matches ||
        a.uuids[0].localeCompare(b.uuids[0]) || a.uuids[1].localeCompare(b.uuids[1]));
    return { thresholds, edges, clusters: buildClusters(edges, accounts, paths) };
}

module.exports = analyzeSynchronization;
