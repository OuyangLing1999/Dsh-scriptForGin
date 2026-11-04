import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { diffLines } from '../workbench-core.js';

const lines = count => Array.from({ length: count }, (_, i) => 'line' + i);
function checkReconstruction(before, after, result) {
  assert.deepEqual(result.blocks.filter(block => block.type !== 'add').map(block => block.text), before);
  assert.deepEqual(result.blocks.filter(block => block.type !== 'remove').map(block => block.text), after);
  assert.equal(result.added, result.blocks.filter(block => block.type === 'add').length);
  assert.equal(result.removed, result.blocks.filter(block => block.type === 'remove').length);
}

for (const position of [0, 750, 1500]) {
  test(`long script single insertion at ${position} is exact`, () => {
    const before = lines(1500), after = [...before];
    after.splice(position, 0, 'inserted');
    const result = diffLines(before.join('\n'), after.join('\n'));
    assert.equal(result.added, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.approximate, false);
    assert.equal(result.blocks.filter(block => block.type === 'same').length, 1500);
    checkReconstruction(before, after, result);
  });
}
for (const position of [0, 750, 1499]) {
  test(`long script single deletion at ${position} is exact`, () => {
    const before = lines(1500), after = [...before];
    after.splice(position, 1);
    const result = diffLines(before.join('\n'), after.join('\n'));
    assert.equal(result.added, 0);
    assert.equal(result.removed, 1);
    assert.equal(result.approximate, false);
    assert.equal(result.blocks.filter(block => block.type === 'same').length, 1499);
    checkReconstruction(before, after, result);
  });
}

test('large middle with distant sparse edits uses explicitly approximate alignment', () => {
  const before = lines(6000), after = [...before];
  after.splice(100, 0, 'inserted first');
  after.splice(3001, 1);
  after.splice(5900, 0, 'inserted last');
  const result = diffLines(before.join('\n'), after.join('\n'));
  assert.equal(result.approximate, true);
  assert.match(result.summary, /近似/);
  assert.equal(result.added, 2);
  assert.equal(result.removed, 1);
  checkReconstruction(before, after, result);
});

test('repeated lines, CRLF and exact small edits preserve both inputs', () => {
  const before = ['same', 'repeat', 'repeat', 'old', 'end'];
  const after = ['same', 'repeat', 'new', 'repeat', 'end'];
  const result = diffLines({ text: before.join('\r\n') }, { text: after.join('\n') });
  assert.equal(result.approximate, false);
  assert.equal(result.added, 1);
  assert.equal(result.removed, 1);
  checkReconstruction(before, after, result);
});

test('large unrelated scripts have bounded work and reconstruct without quadratic allocation', () => {
  const before = lines(20000), after = before.map(line => 'other-' + line);
  const started = performance.now();
  const result = diffLines(before.join('\n'), after.join('\n'));
  const elapsed = performance.now() - started;
  assert.equal(result.approximate, true);
  assert.equal(result.added, 20000);
  assert.equal(result.removed, 20000);
  checkReconstruction(before, after, result);
  assert.ok(elapsed < 10000, `20k-line comparison took ${elapsed.toFixed(1)}ms`);
});

test('identical and highly asymmetric inputs avoid a large LCS table', () => {
  const before = lines(20000), unchanged = diffLines(before.join('\n'), before.join('\n'));
  assert.equal(unchanged.changed, false);
  assert.equal(unchanged.approximate, false);
  checkReconstruction(before, before, unchanged);
  const after = ['different'];
  const result = diffLines(before.join('\n'), after.join('\n'));
  assert.equal(result.approximate, false);
  checkReconstruction(before, after, result);
});
