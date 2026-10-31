import test from 'node:test';
import assert from 'node:assert/strict';
import { checkForUpdates, compareVersions, CURRENT_VERSION, startAutoUpdateChecks, AUTO_UPDATE_INTERVAL_MS } from '../update-core.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('automatic check starts immediately, repeats, and cleans up', async () => {
  let tick, delay, cancelled;
  const results = [];
  let calls = 0;
  const stop = startAutoUpdateChecks({
    check: async () => ({ available: true, latest: String(++calls) }),
    onResult: (result) => results.push(result),
    schedule: (callback, ms) => { tick = callback; delay = ms; return 7; },
    cancel: (id) => { cancelled = id; },
  });
  await flush();
  assert.equal(results.length, 1);
  assert.equal(delay, AUTO_UPDATE_INTERVAL_MS);
  await tick();
  assert.equal(results.length, 2);
  stop();
  assert.equal(cancelled, 7);
  await tick();
  assert.equal(calls, 2);
});

test('pending automatic checks do not overlap or publish after disposal', async () => {
  let resolve, tick;
  let calls = 0, published = 0;
  const stop = startAutoUpdateChecks({
    check: () => { calls++; return new Promise((done) => { resolve = done; }); },
    onResult: () => published++,
    schedule: (callback) => { tick = callback; return 1; }, cancel: () => {},
  });
  await tick();
  assert.equal(calls, 1);
  stop();
  resolve({ available: true });
  await flush();
  assert.equal(published, 0);
});

test('failed automatic checks report errors and retry on the next interval', async () => {
  let tick, calls = 0;
  const errors = [], results = [];
  const stop = startAutoUpdateChecks({
    check: async () => { if (++calls === 1) throw new Error('offline'); return { available: false }; },
    onResult: (value) => results.push(value), onError: (error) => errors.push(error.message),
    schedule: (callback) => { tick = callback; return 1; }, cancel: () => {},
  });
  await flush();
  assert.deepEqual(errors, ['offline']);
  await tick();
  assert.deepEqual(results, [{ available: false }]);
  stop();
});

test('numeric semantic version comparison', () => {
  assert.equal(compareVersions('1.10.0', '1.9.9'), 1);
  assert.equal(compareVersions('v1.2.0', '1.2.0'), 0);
  assert.equal(compareVersions('1.1.9', '1.2.0'), -1);
  assert.throws(() => compareVersions('unknown', '1.2.0'));
});
test('new release produces an update and trusted release link', async () => {
  const result = await checkForUpdates(async (url, options) => {
    assert.match(url, /OuyangLing1999\/Dsh-scriptForGin\/releases\/latest$/);
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => ({ tag_name: 'v99.0.0', body: '更新说明', html_url: 'https://example.invalid' }) };
  });
  assert.equal(result.available, true);
  assert.match(result.url, /^https:\/\/github.com\/OuyangLing1999\/Dsh-scriptForGin\/releases\/tag\//);
});
test('same or older upstream is not advertised as an update', async () => {
  for (const version of [CURRENT_VERSION, '0.1.0']) {
    const result = await checkForUpdates(async () => ({ ok: true, json: async () => ({ tag_name: version }) }));
    assert.equal(result.available, false);
  }
});
test('HTTP failures and malformed releases remain errors', async () => {
  for (const status of [404, 403, 429, 500]) {
    await assert.rejects(checkForUpdates(async () => ({ ok: false, status })));
  }
  await assert.rejects(checkForUpdates(async () => ({ ok: true, json: async () => ({ tag_name: 'bad' }) })));
  await assert.rejects(checkForUpdates(async () => { throw new Error('network'); }), /network/);
});
