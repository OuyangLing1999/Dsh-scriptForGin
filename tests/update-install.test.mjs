import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInstallTarget, verifyInstalledVersion } from '../update-install.js';
const asset = (version, suffix = 'tgz') => `https://github.com/OuyangLing1999/Dsh-scriptForGin/releases/download/v${version}/script.${suffix}`;
const bundle = { name: '@local/elderly-script', version: '2.7.0', installed: true, source: asset('2.7.0') };
const release = { available: true, latest: '2.8.0', assetUrl: asset('2.8.0') };
test('local and unknown sources always require manual installation', () => {
  for (const source of ['D:/plugins/script', 'file:D:/plugins/script', 'link:D:/plugins/script', './script', '@local/elderly-script@latest', '', undefined]) {
    const result = resolveInstallTarget({ ...bundle, source }, release);
    assert.equal(result.kind, 'manual'); assert.ok(result.reason);
    assert.equal('spec' in result, false);
  }
});
test('only supported official new release archives produce a new remote spec', () => {
  assert.deepEqual(resolveInstallTarget(bundle, release), { kind: 'remote', spec: release.assetUrl, expectedVersion: '2.8.0' });
  assert.equal(resolveInstallTarget(bundle, { ...release, assetUrl: asset('2.8.0', 'tar.gz') }).kind, 'remote');
  for (const assetUrl of [asset('2.8.0', 'zip'), asset('2.7.0'), asset('2.8.0').replace('github.com', 'github.com.evil.test'), asset('2.8.0').replace('OuyangLing1999', 'another'), asset('2.8.0') + '?download=1', asset('2.8.0').replace('https:', 'http:')]) {
    assert.equal(resolveInstallTarget(bundle, { ...release, assetUrl }).kind, 'manual', assetUrl);
  }
});
test('missing release and same/older versions never attempt reinstall', () => {
  for (const value of [null, {}, { ...release, available: false }, { ...release, latest: '2.7.0' }, { ...release, latest: '2.6.9' }]) assert.equal(resolveInstallTarget(bundle, value).kind, 'manual');
  assert.equal(resolveInstallTarget(null, release).kind, 'manual');
  assert.equal(resolveInstallTarget({ ...bundle, name: 'other' }, release).kind, 'manual');
});
test('verification trusts installed manifest version, never desired installTarget version', () => {
  assert.equal(verifyInstalledVersion({ ...bundle, version: '2.8.0' }, 'v2.8.0').ok, true);
  assert.equal(verifyInstalledVersion({ ...bundle, installTarget: { version: '2.8.0' } }, '2.8.0').ok, false);
  for (const value of [null, { ...bundle, version: undefined }, { ...bundle, name: 'other' }, { ...bundle, installed: false }, { ...bundle, installed: undefined }, { ...bundle, version: '2.8.0', error: { code: 'not-bundle' } }]) assert.equal(verifyInstalledVersion(value, '2.8.0').ok, false);
  assert.equal(verifyInstalledVersion({ ...bundle, version: '2.8.1' }, '2.8.0').ok, false);
});
