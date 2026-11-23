const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../../apps/admin/src/components/Tools/components/Metrics/componets/Calendar/helpers.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const calendar = { exports: {} };
new Function('exports', 'module', compiled)(calendar.exports, calendar);
const { getMonthCalendar, getMonthsRange, prepareHours } = calendar.exports;

test('calendar starts on Monday and places a Sunday month start in the last column', () => {
    assert.deepEqual(getMonthCalendar(2026, 11)[0], [null, null, null, null, null, null, 1]);
    assert.equal(getMonthCalendar(2026, 2).flat().filter(Boolean).length, 28);
    assert.equal(getMonthCalendar(2024, 2).flat().filter(Boolean).length, 29);
});
test('month range includes every month across a year boundary', () => {
    assert.deepEqual(getMonthsRange([2025, 11], [2026, 2]), ['2025-11', '2025-12', '2026-01', '2026-02']);
    assert.deepEqual(getMonthsRange([2026, 11], [2026, 11]), ['2026-11']);
});
test('hourly data includes exactly 24 ordered values, even for empty days', () => {
    assert.deepEqual(prepareHours(undefined), Array.from({ length: 24 }, (_, hour) => [String(hour).padStart(2, '0'), 0]));
    const hours = prepareHours({ '9': 12, '00': 3, '23': 4 });
    assert.deepEqual(hours[0], ['00', 3]);
    assert.deepEqual(hours[9], ['09', 12]);
    assert.deepEqual(hours[23], ['23', 4]);
    assert.equal(hours.length, 24);
});
test('chart coordinates stay finite for an empty or zero-only day and reach both edges', () => {
    const { getChartPoints } = calendar.exports;
    assert.equal(getChartPoints([], 460, 180), '');
    assert.equal(getChartPoints([['00', 0]], 460, 180), '0,180');
    const points = getChartPoints(prepareHours({ '12': 10, '23': 5 }), 460, 180);
    assert.ok(points.startsWith('0,180 '));
    assert.ok(points.endsWith('460,90'));
    assert.ok(!/NaN|Infinity/.test(getChartPoints(prepareHours(), 460, 180)));
});
