import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRoles, findMatches, buildExampleProject } from '../workbench-analysis.js';
import { validateProject } from '../workbench-core.js';

const han = value => (value.match(/\p{Script=Han}/gu) || []).length;

test('live roles count turns and Han characters, merge repeats, and sort by chars desc', () => {
  const text = [
    '【主播】', '你好，张姐。', '【李阿姨】', '谢谢大家。', '【主播】', '再次欢迎。',
  ].join('\n');
  const result = analyzeRoles(text, 'live');
  assert.equal(result.totalChars, 12);
  assert.equal(result.roles.length, 2);
  assert.deepEqual(result.roles.map(role => role.name), ['主播', '李阿姨']);
  assert.equal(result.roles[0].chars, 8);
  assert.equal(result.roles[0].turns, 2);
  assert.equal(result.roles[0].share, 8 / 12);
  assert.equal(result.roles[1].chars, 4);
  assert.equal(result.roles[1].turns, 1);
  assert.equal(result.roles[1].share, 4 / 12);
});

test('duan roles parse speaker prefixes and fall back to 未标注', () => {
  const text = [
    '台词：张姐：大家好，欢迎来到直播间。',
    '台词：李阿姨：谢谢张姐，我今天特别高兴。',
    '台词：今天天气不错。',
  ].join('\n');
  const result = analyzeRoles(text, 'duan-ba');
  assert.equal(result.totalChars, 32);
  assert.deepEqual(result.roles.map(role => role.name), ['李阿姨', '张姐', '未标注']);
  assert.deepEqual(result.roles.map(role => role.chars), [14, 12, 6]);
  assert.deepEqual(result.roles.map(role => role.turns), [1, 1, 1]);
  assert.equal(result.roles.reduce((sum, role) => sum + role.share, 0).toFixed(10), '1.0000000000');
});

test('empty text and unknown mode markers return empty role stats', () => {
  assert.deepEqual(analyzeRoles('', 'live'), { roles: [], totalChars: 0 });
  assert.deepEqual(analyzeRoles('   \n', 'duan-adapt'), { roles: [], totalChars: 0 });
  assert.deepEqual(analyzeRoles('没有角色行', 'live'), { roles: [], totalChars: 0 });
});

test('findMatches returns every non-overlapping offset with case control', () => {
  const text = '春节回家，春节真好，春节。';
  assert.deepEqual(findMatches(text, '春节'), {
    matches: [{ start: 0, end: 2 }, { start: 5, end: 7 }, { start: 10, end: 12 }],
    count: 3,
  });
  const cased = 'Abc abc ABC';
  assert.equal(findMatches(cased, 'abc').count, 3);
  assert.deepEqual(findMatches(cased, 'abc', { caseSensitive: true }).matches, [{ start: 4, end: 7 }]);
  assert.deepEqual(findMatches(cased, 'abc', { caseSensitive: false }).matches.map(item => item.start), [0, 4, 8]);
});

test('findMatches returns empty for empty or non-string queries', () => {
  assert.deepEqual(findMatches('abc', ''), { matches: [], count: 0 });
  assert.deepEqual(findMatches('abc', null), { matches: [], count: 0 });
  assert.deepEqual(findMatches('abc', 123), { matches: [], count: 0 });
});

test('findMatches escapes regex metacharacters', () => {
  assert.deepEqual(findMatches('a+b a+b', 'a+b'), {
    matches: [{ start: 0, end: 3 }, { start: 4, end: 7 }],
    count: 2,
  });
});

test('buildExampleProject is a complete valid project with natural dialogue', () => {
  const project = buildExampleProject();
  const check = validateProject(project);
  assert.equal(check.ok, true, JSON.stringify(check.errors));

  assert.equal(project.schemaVersion, 1);
  assert.equal(project.mode, 'live');
  assert.equal(project.deliverable, 'script');
  assert.equal(project.currentVersionId, 'example-v1');
  assert.equal(project.pending, null);
  assert.equal(project.retry, null);
  assert.equal(project.selectedSampleIds.length, 1);
  assert.equal(project.selectedSampleIds[0], 'example-s1');

  const version = project.versions.find(item => item.id === project.currentVersionId);
  assert.ok(version, 'adopted version exists');
  assert.equal(version.artifactKind, 'script');
  assert.equal(version.phase, 'full');
  assert.equal(version.mode, 'live');

  const report = project.reports[0];
  assert.equal(report.sourceVersionId, version.id);

  // The dialogue must have two role sections, each with at least 200 Han characters.
  const markers = [...version.text.matchAll(/^【([^】\n]+)】\s*$/gm)];
  assert.equal(markers.length, 2);
  markers.forEach((marker, index) => {
    const body = version.text.slice(marker.index + marker[0].length, markers[index + 1]?.index ?? version.text.length);
    assert.ok(han(body) >= 200, `第${index + 1}段不足200汉字`);
    assert.ok(!/[（(]/.test(body), '段内不应出现动作或神态提示');
  });
  // Explicit handoff: the host asks the guest to speak, and the guest answers back to the host.
  assert.match(markers[0][0], /主播/);
  assert.match(version.text.split('【李阿姨】')[1], /张姐/);
});
