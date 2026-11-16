const fs = require('node:fs/promises');

const numbers = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const percentages = new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 1 });
const dates = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'medium',
});
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = value => String(value ?? '—').replace(/[&<>"']/g, char => entities[char]);
const number = value => Number.isFinite(value) ? numbers.format(value) : '—';
const percent = value => Number.isFinite(value) ? percentages.format(value) : '—';
const date = value => Number.isFinite(value) && Math.abs(value) <= 8.64e15 ? dates.format(value) : '—';
const coords = point => point ? `(${escape(point.x)}, ${escape(point.y)})` : '—';
const fmtPoint = point => point ? `${coords(point)} · ${date(point.timestamp)} · строка ${number(point.line)}` : '—';
const tags = {
    rapid: 'Быстрые интервалы',
    regular: 'Регулярный ритм',
    straight_run: 'Прямая линия',
    raster_scan: 'Проход по рядам',
};

function table(headers, rows, empty = 'По этому признаку совпадений нет.') {
    if (!rows.length) return `<p class="muted">${empty}</p>`;
    return `<div class="scroll"><table><thead><tr>${headers.map(header => `<th scope="col">${header}</th>`).join('')}</tr></thead>
<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function render(report) {
    if (!report?.summary || !Array.isArray(report.accounts) || !Array.isArray(report.sharedIps)) {
        throw new Error('Ожидается JSON-отчёт analyzePixels.js с полями summary, accounts и sharedIps.');
    }
    const { summary, accounts, sharedIps, coordinatedPaths = [], synchronization } = report;
    const { edges = [], clusters = [] } = synchronization ?? {};
    const names = new Map();
    for (const account of [...accounts, ...clusters.flatMap(cluster => cluster.accounts), ...coordinatedPaths.flatMap(path => path.accounts)]) {
        const list = names.get(account.uuid) ?? new Set();
        for (const nick of account.nicknames ?? []) list.add(nick);
        names.set(account.uuid, list);
    }
    const player = uuid => {
        const code = `<code>${escape(uuid)}</code>`;
        const nicks = [...(names.get(uuid) ?? [])];
        return nicks.length ? `${nicks.map(escape).join(', ')}<br>${code}` : code;
    };

    const groupsHtml = clusters.map((cluster, index) => {
        const members = new Set(cluster.uuids);
        const links = cluster.relatedPathIndexes
            .filter(i => Number.isInteger(i) && i >= 0 && i < coordinatedPaths.length)
            .map(i => `<a href="#path-${i}">Линия ${number(i + 1)}</a>`);
        const rows = edges.filter(edge => edge.uuids.every(uuid => members.has(uuid))).map(edge => [
            edge.uuids.map(player).join('<br>'),
            number(edge.matches), number(edge.controlMatches), number(edge.lift), number(edge.activeWindows),
            edge.examples.length ? `<details class="inline"><summary>Строки лога</summary><ul>${edge.examples.map(example =>
                `<li>${escape(example.color)} · ${number(example.delayMs)} мс<br>${example.pixels.map(fmtPoint).join('<br>')}</li>`,
            ).join('')}</ul></details>` : '—',
        ]);
        return `<details class="card"><summary><strong>Группа ${number(index + 1)}</strong> · аккаунтов: ${number(cluster.uuids.length)} · связей: ${number(cluster.edgeCount)} · плотность: ${percent(cluster.density)}</summary>
<p>${links.length ? `Совместные линии: ${links.join(', ')}` : 'Повторяющаяся синхронность'}</p>
${table(['Пара аккаунтов', 'Быстрые совпадения', 'Контрольные совпадения', 'Отношение', 'Минутные окна', 'Примеры'], rows)}</details>`;
    }).join('');

    const pathsHtml = coordinatedPaths.map((path, index) => `<details class="card" id="path-${index}"><summary><strong>Линия ${number(index + 1)}</strong> · ${coords(path.start)} → ${coords(path.end)} · пикселей: ${number(path.pixels)} · смен аккаунта: ${number(path.accountSwitches)}</summary>
<p>${escape(path.color)} · ${date(path.start?.timestamp)} — ${date(path.end?.timestamp)} · ${path.accounts.map(account => `${[...(names.get(account.uuid) ?? [])].map(escape).join(', ') || escape(account.uuid)} (${number(account.pixels)})`).join(', ')}</p>
${table(['Строка', 'Время', 'Координаты', 'Аккаунт'], (path.placements ?? []).map(point =>
        [number(point.line), date(point.timestamp), coords(point), player(point.uuid)]),
    )}</details>`).join('');

    const accountRows = accounts.map(account => {
        const spatial = account.spatial ?? {};
        const episodes = [['Линия', spatial.straightRun], ['Ряды', spatial.rasterScan]]
            .filter(([, episode]) => episode)
            .map(([label, episode]) => `<li>${label} · ${number(episode.pixels)} пикселей<br>${fmtPoint(episode.start)} → ${fmtPoint(episode.end)}</li>`);
        return [
            player(account.uuid),
            number(account.pixels),
            account.signals.map(signal => escape(Object.hasOwn(tags, signal) ? tags[signal] : signal)).join('<br>'),
            account.rapid ? `${number(account.rapid.count)}<br><small>мин. ${number(account.rapid.minIntervalMs)} мс</small>` : '—',
            account.regularity?.medianIntervalMs != null
                ? `${number(account.regularity.medianIntervalMs)} мс<br><small>${percent(account.regularity.matchingRatio)} в пределах допуска</small>` : '—',
            episodes.length ? `<details class="inline"><summary>Начало и конец</summary><ul>${episodes.join('')}</ul></details>` : '—',
        ];
    });
    const byLabel = [...clusters].map((cluster, index) => [
        `Группа ${number(index + 1)}`, cluster.density,
    ]);
    const densityChart = byLabel.length ? `<details class="card"><summary>Сравнить плотность связей</summary>
<p class="muted">Доля связанных пар аккаунтов от всех возможных внутри группы.</p>
<div class="density">${byLabel.map(([label, density]) => `<span>${label}</span><meter min="0" max="1" value="${Number.isFinite(density) ? density : 0}" aria-label="${label}"></meter><span>${percent(density)}</span>`).join('')}</div></details>` : '';
    const metrics = [
        ['Записей обработано', summary.validLines], ['Аккаунтов в логе', summary.accounts],
        ['Аккаунтов с признаками', accounts.length], ['Групп синхронности', synchronization ? clusters.length : null],
        ['Совместных линий', report.coordinatedPaths ? coordinatedPaths.length : null],
    ];

    return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Отчёт об активности на холсте</title>
<style>
:root{color-scheme:light dark;--bg:#edf2f7;--surface:#fff;--ink:#17263c;--muted:#52647a;--border:#d4dfea;--accent:#1557ad}
@media(prefers-color-scheme:dark){:root{--bg:#111a29;--surface:#19263a;--ink:#edf3fb;--muted:#b6c7dc;--border:#3a4d64;--accent:#a6caff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:1rem/1.55 system-ui,sans-serif}
main{max-width:1160px;margin:auto;padding:clamp(1rem,4vw,3rem)}h1{font-size:clamp(2rem,5vw,3rem);line-height:1.12;margin:0 0 1rem}
h2{line-height:1.2;margin:0 0 .8rem}section{margin-block:2.3rem}p{margin:.6rem 0}.muted,small{color:var(--muted)}
a{color:var(--accent)}nav{display:flex;flex-wrap:wrap;gap:.6rem 1.2rem;margin:1.5rem 0}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:.75rem;margin:1.25rem 0}
.metrics div,.card{border:1px solid var(--border);background:var(--surface);border-radius:.75rem;padding:1rem}
.metrics dt{color:var(--muted)}.metrics dd{margin:0;font-size:1.7rem;font-weight:700}
.card{margin:.6rem 0}summary{cursor:pointer}summary::marker{color:var(--accent)}summary:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.scroll{overflow:auto;border:1px solid var(--border);border-radius:.55rem;margin-block:.65rem}
table{width:100%;border-collapse:collapse;background:var(--surface);text-align:left;font-variant-numeric:tabular-nums}
td,th{padding:.65rem .75rem;vertical-align:top;border-bottom:1px solid var(--border)}
th{font-size:.88rem}tbody tr:last-child td{border-bottom:0}code{color:var(--muted);overflow-wrap:anywhere}
.inline ul{min-width:12rem;padding-left:1.25rem}.density{display:grid;grid-template-columns:auto minmax(4rem,1fr) auto;gap:.4rem .8rem;align-items:center}
meter{width:100%;height:1rem;accent-color:var(--accent)}
</style>
</head>
<body><main>
<header><h1>Отчёт об активности на холсте</h1>
<p>Признаки для ручной проверки. Команда, которая рисует по общему шаблону, тоже может действовать синхронно.</p>
<dl class="metrics">${metrics.map(([label, value]) => `<div><dt>${label}</dt><dd>${number(value)}</dd></div>`).join('')}</dl>
<p class="muted">Пропущено строк: ${number(summary.invalidLines)} · вне хронологического порядка: ${number(summary.outOfOrderLines)} · время в отчёте московское (МСК).</p></header>
<nav aria-label="Разделы отчёта"><a href="#groups">Группы</a><a href="#paths">Совместные линии</a><a href="#accounts">Аккаунты</a><a href="#ips">Общие IP</a></nav>
<section id="groups"><h2>Группы синхронности</h2>
<p class="muted">Связи по повторяющимся близким по месту и времени пикселям. Группа может содержать пары без прямой связи.</p>
${densityChart}${groupsHtml || `<p>${synchronization ? 'Граф не выделил группы.' : 'Во входном JSON нет результатов анализа синхронности.'}</p>`}</section>
<section id="paths"><h2>Совместные линии</h2><p class="muted">Эпизоды, в которых несколько аккаунтов по очереди продолжали одну линию.</p>
${pathsHtml || `<p>${report.coordinatedPaths ? 'Совместных линий не найдено.' : 'Во входном JSON нет результатов поиска линий.'}</p>`}</section>
<section id="accounts"><h2>Аккаунты с индивидуальными признаками</h2>
${table(['Аккаунт', 'Пиксели', 'Признаки', 'Быстрые интервалы', 'Медианный интервал', 'Эпизоды'], accountRows)}</section>
<section id="ips"><h2>Общие IP</h2><p class="muted">Один адрес может принадлежать общей сети или прокси.</p>
<details class="card"><summary>Адресов в отчёте: ${number(sharedIps.length)}</summary>
${table(['Адрес', 'Число аккаунтов', 'Аккаунты'], sharedIps.map(item =>
        [`<code>${escape(item.ip)}</code>`, number(item.accountCount), item.uuids.map(player).join('<br>')],
    ))}</details></section>
</main></body></html>
`;
}

async function main([file]) {
    if (file === '--help' || file === '-h') {
        console.log('Использование: node tools/renderPixelReport.js <отчёт.json> > отчёт.html');
        return;
    }
    if (!file) throw new Error('Передайте путь к JSON-отчёту. Используйте --help для примера.');
    const report = JSON.parse(await fs.readFile(file, 'utf8'));
    process.stdout.write(render(report));
}

if (require.main === module) {
    main(process.argv.slice(2)).catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = render;
