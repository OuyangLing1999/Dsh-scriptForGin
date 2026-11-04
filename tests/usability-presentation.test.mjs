import test from 'node:test';
import assert from 'node:assert/strict';
import { groupCheckIssues } from '../workbench-analysis.js';

const issue = (patch = {}) => ({ code: 'CHECK', message: '请核对', ...patch });

test('groups by first-seen location and keeps issue order inside each location', () => {
  const first = issue({ scene: 3 });
  const global = issue({ message: '全文格式' });
  const segment = issue({ segment: 2 });
  const later = issue({ scene: 3, message: '另一问题' });
  const secondScene = issue({ scene: 1 });
  assert.deepEqual(groupCheckIssues([first, global, segment, later, secondScene]), [
    { key: 'scene:3', label: '第3场', issues: [first, later] },
    { key: 'global', label: '全文', issues: [global] },
    { key: 'segment:2', label: '第2段话轮', issues: [segment] },
    { key: 'scene:1', label: '第1场', issues: [secondScene] },
  ]);
});

test('deduplicates only equal code, message, role and excerpt at the same location', () => {
  const first = issue({ scene: 1, role: '主播', excerpt: '原句' });
  const duplicate = { ...first };
  const differentMessage = { ...first, message: '其他问题' };
  const differentExcerpt = { ...first, excerpt: '另一原句' };
  const differentRole = { ...first, role: '嘉宾' };
  const differentCode = { ...first, code: 'OTHER' };
  const differentScene = { ...first, scene: 2 };
  const sameNumberSegment = issue({ segment: 1, role: '主播', excerpt: '原句' });
  const result = groupCheckIssues([first, duplicate, differentMessage, differentExcerpt, differentRole, differentCode, differentScene, sameNumberSegment]);
  assert.deepEqual(result.map(group => group.key), ['scene:1', 'scene:2', 'segment:1']);
  assert.deepEqual(result[0].issues, [first, differentMessage, differentExcerpt, differentRole, differentCode]);
  assert.strictEqual(result[0].issues[0], first);
  assert.deepEqual(result[1].issues, [differentScene]);
  assert.deepEqual(result[2].issues, [sameNumberSegment]);
});

test('retains original issue objects without modifying frozen input', () => {
  const first = Object.freeze(issue({ segment: 1, severity: 'warning', count: 123 }));
  const second = Object.freeze(issue({ message: '未定位', excerpt: '' }));
  const input = Object.freeze([first, first, second]);
  const result = groupCheckIssues(input);
  assert.strictEqual(result[0].issues[0], first);
  assert.strictEqual(result[1].issues[0], second);
  assert.equal(input.length, 3);
  assert.equal(first.count, 123);
  result[0].issues.push(second);
  assert.equal(input.length, 3);
  assert.equal(Object.hasOwn(first, 'label'), false);
});

test('malformed roots and entries are ignored without throwing', () => {
  for (const input of [undefined, null, false, 0, '', {}, 'issues', new Set()]) {
    assert.deepEqual(groupCheckIssues(input), []);
  }
  const valid = issue({ message: '保持原文空格 ', code: null });
  const list = [null, undefined, false, 2, 'text', [], {}, { message: 1 }, { message: '' }, { message: '  \n' }, valid];
  assert.deepEqual(groupCheckIssues(list), [{ key: 'global', label: '全文', issues: [valid] }]);
  assert.equal(valid.message, '保持原文空格 ');
});

test('scene takes precedence and invalid positions use the next valid location or whole text', () => {
  const both = issue({ scene: 2, segment: 4 });
  const segment = issue({ scene: -1, segment: 4 });
  const invalid = issue({ scene: NaN, segment: '4', message: '位置无效' });
  const fraction = issue({ scene: 1.5, segment: 0, message: '不是场次编号' });
  assert.deepEqual(groupCheckIssues([both, segment, invalid, fraction]), [
    { key: 'scene:2', label: '第2场', issues: [both] },
    { key: 'segment:4', label: '第4段话轮', issues: [segment] },
    { key: 'global', label: '全文', issues: [invalid, fraction] },
  ]);
});

test('deduplication compares optional fields exactly without serializing them', () => {
  const circular = {}; circular.self = circular;
  const first = issue({ excerpt: circular });
  const same = { ...first };
  const nullExcerpt = issue({ excerpt: null });
  const absentExcerpt = issue();
  const result = groupCheckIssues([first, same, nullExcerpt, absentExcerpt]);
  assert.deepEqual(result[0].issues, [first, nullExcerpt, absentExcerpt]);
});
