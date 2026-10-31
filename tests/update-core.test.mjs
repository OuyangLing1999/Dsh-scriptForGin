import test from 'node:test';
import assert from 'node:assert/strict';
import { checkForUpdates, compareVersions, CURRENT_VERSION } from '../update-core.js';

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
