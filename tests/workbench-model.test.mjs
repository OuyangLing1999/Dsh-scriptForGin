import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createProject } from '../workbench-core.js';
import { artifactKind, normalizeProject, forkProject, resolveVersion, revisionPhase, archiveResult, buildTaskText } from '../workbench-model.js';

const meta = id => ({ id, createdAt: '2026-11-03T12:00:00.000Z' });
const project = patches => createProject({ id: 'p', mode: 'live', title: '母子', ...patches });
const pending = (phase, patches) => ({ taskId: 'task-' + phase, phase, mode: 'live', ...patches });
function frozen(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(frozen); Object.freeze(value); }
  return value;
}

test('artifact kind recognizes legacy phases and preserves explicit content kind', () => {
  for (const phase of ['idea', 'idea-opt']) assert.equal(artifactKind({ phase }), 'idea');
  for (const phase of ['outline', 'outline-opt']) assert.equal(artifactKind({ phase }), 'outline');
  for (const phase of ['manual', 'polish', 'revision', 'full']) assert.equal(artifactKind({ phase }), 'script');
  assert.equal(artifactKind({ phase: 'audit' }), 'report');
  assert.equal(artifactKind({ phase: 'manual', artifactKind: 'outline' }), 'outline');
});

test('migration separates audit/character JSON reports and retains a valid adopted manuscript', () => {
  const original = frozen(project({ currentVersionId: 'i', versions: [
    { id: 'i', phase: 'idea-opt', text: '思路' }, { id: 'o', phase: 'outline-opt', text: '大纲' },
    { id: 'a', phase: 'audit', text: '审稿' }, { id: 'c', phase: 'audit', text: '{"characters":[]}' },
  ] }));
  const migrated = normalizeProject(original);
  assert.deepEqual(migrated.versions.map(v => v.artifactKind), ['idea', 'outline']);
  assert.deepEqual(migrated.reports.map(v => v.id), ['a', 'c']);
  assert.equal(migrated.currentVersionId, 'i');
  assert.equal(original.versions.length, 4);
  assert.deepEqual(normalizeProject(migrated), migrated);
  assert.equal(normalizeProject({ ...original, currentVersionId: 'a' }).currentVersionId, 'o');
});

test('migration follows source chains for legacy editing while cyclic/absent sources default to script', () => {
  const result = normalizeProject(project({ versions: [
    { id: 'i', phase: 'idea', text: '思路' },
    { id: 'm', phase: 'manual', sourceVersionId: 'i', text: '编辑' },
    { id: 'p', phase: 'polish', sourceVersionId: 'm', text: '润色' },
    { id: 'x', phase: 'revision', sourceVersionId: 'y', text: 'x' },
    { id: 'y', phase: 'manual', sourceVersionId: 'x', text: 'y' },
  ] }));
  assert.deepEqual(result.versions.map(v => v.artifactKind), ['idea', 'idea', 'idea', 'script', 'script']);
});

test('fork requires an explicit id and preserves or replaces title without carrying old requests', () => {
  const original = frozen(project({ sessionId: 'old-session', pending: { taskId: 'running', request: { receipts: ['pending-receipt'] } },
    retry: { phase: 'revision', request: { sessionId: 'old-session', receipts: ['retry-receipt'], sourceVersion: { id: 'v' } } },
    currentVersionId: 'i', draft: '原稿', notes: '补充要求',
    versions: [{ id: 'i', phase: 'idea-opt', text: '思路' }, { id: 'o', phase: 'outline-opt', text: '大纲' },
      { id: 'r', phase: 'audit', text: '{"characters":[]}' }],
    reports: [{ id: 'report', text: '报告', artifactKind: 'report' }],
    characters: [{ id: 'c', name: '母亲', details: { voice: '直白' } }],
    samples: [{ id: 's', text: '样稿', tags: ['亲情'] }], selectedSampleIds: ['s'],
  }));
  for (const options of [undefined, {}, { id: '' }, { id: '   ' }, { id: 1 }]) assert.throws(() => forkProject(original, options), /显式 id/);
  const result = forkProject(original, { id: 'copy', title: '副本' });
  assert.equal(result.id, 'copy');
  assert.equal(result.title, '副本');
  assert.equal(result.sessionId, '');
  assert.equal(result.pending, null);
  assert.equal(result.retry, null);
  assert.equal(result.currentVersionId, 'i');
  assert.deepEqual(result.versions.map(item => item.artifactKind), ['idea', 'outline']);
  assert.deepEqual(result.reports.map(item => item.id), ['report', 'r']);
  assert.equal(result.draft, original.draft);
  assert.equal(result.notes, original.notes);
  assert.equal(forkProject(original, { id: 'another' }).title, original.title);
  result.characters[0].details.voice = '改动';
  result.samples[0].tags.push('新标签');
  result.versions[0].text = '新思路';
  result.reports[0].text = '新报告';
  assert.equal(original.characters[0].details.voice, '直白');
  assert.deepEqual(original.samples[0].tags, ['亲情']);
  assert.equal(original.versions[0].text, '思路');
  assert.equal(original.reports[0].text, '报告');
  assert.equal(original.retry.request.sessionId, 'old-session');
  assert.deepEqual(original.retry.request.receipts, ['retry-receipt']);
});

test('resolve version prioritizes selection then adopted manuscript then latest manuscript', () => {
  const value = project({ currentVersionId: 'a', versions: [
    { id: 'a', phase: 'full', text: '采用稿' }, { id: 'b', phase: 'revision', text: '新稿' },
    { id: 'r', phase: 'audit', text: '报告' },
  ] });
  assert.equal(resolveVersion(value, 'b').id, 'b');
  assert.equal(resolveVersion(value, 'r').id, 'a');
  assert.equal(resolveVersion({ ...value, currentVersionId: 'gone' }).id, 'b');
  assert.equal(resolveVersion(project()), null);
});

test('resolve version preserves identity without serializing project and never selects a report', () => {
  const manuscript = frozen({ id: 'v', phase: 'full', artifactKind: 'script', text: '原稿' });
  const report = frozen({ id: 'r', phase: 'audit', artifactKind: 'report', text: '报告' });
  const explicitReport = frozen({ id: 'r2', phase: 'manual', artifactKind: 'report', text: '报告2' });
  const value = { versions: [manuscript, report, explicitReport], currentVersionId: 'r',
    toJSON() { throw new Error('must not serialize project'); },
    get pending() { throw new Error('must not read unrelated state'); } };
  assert.equal(resolveVersion(value, 'v'), manuscript);
  assert.equal(resolveVersion(value, 'r'), manuscript);
  assert.equal(resolveVersion(value, 'r2'), manuscript);
  assert.equal(resolveVersion({ versions: [report, explicitReport] }), null);
});

test('archive new manuscript keeps adopted manuscript, source and kind across repeated optimization', () => {
  let value = archiveResult(frozen(project()), pending('idea'), { text: '思路1' }, meta('i1'));
  assert.equal(value.currentVersionId, 'i1');
  for (let index = 2; index <= 3; index++) {
    const source = value.versions.at(-1);
    assert.equal(revisionPhase(source), 'idea-opt');
    value = archiveResult(value, pending(revisionPhase(source), { taskId: 'opt-' + index, sourceVersion: source }), '思路' + index, meta('i' + index));
    assert.equal(value.versions.at(-1).artifactKind, 'idea');
    assert.equal(value.versions.at(-1).sourceVersionId, source.id);
  }
  assert.equal(value.currentVersionId, 'i1');
  const source = { id: 'old-outline', phase: 'outline-opt', text: '大纲', mode: 'duan-adapt' };
  value = archiveResult(value, pending('polish', { mode: 'duan-adapt', sourceVersion: source }), '润色大纲', meta('p'));
  assert.equal(value.versions.at(-1).artifactKind, 'outline');
  assert.equal(revisionPhase(value.versions.at(-1)), 'outline-opt');
});

test('outline optimization remains outline and full expansion creates script without changing adoption', () => {
  let value = archiveResult(project(), pending('outline'), '大纲', meta('o1'));
  for (let index = 2; index <= 3; index++) {
    const source = value.versions.at(-1);
    value = archiveResult(value, pending(revisionPhase(source), { taskId: 'outline-' + index, sourceVersion: source }), '优化大纲', meta('o' + index));
    assert.equal(value.versions.at(-1).artifactKind, 'outline');
    assert.equal(revisionPhase(value.versions.at(-1)), 'outline-opt');
  }
  value = archiveResult(value, pending('full', { sourceVersion: value.versions.at(-1) }), '完整稿', meta('script'));
  assert.equal(value.versions.at(-1).artifactKind, 'script');
  assert.equal(value.versions.at(-1).sourceVersionId, 'o3');
  assert.equal(value.currentVersionId, 'o1');
});

test('audit, extraction and persona archive independently and deduplicate completed tasks', () => {
  const base = frozen(project({ currentVersionId: 'v', versions: [{ id: 'v', text: '原稿', phase: 'full' }] }));
  const task = pending('audit', { sourceVersionId: 'v' });
  let value = archiveResult(base, task, '审稿意见', meta('r'));
  assert.equal(value.versions.length, 1);
  assert.equal(value.currentVersionId, 'v');
  assert.equal(value.reports[0].sourceVersionId, 'v');
  assert.equal(revisionPhase(value.reports[0]), null);
  assert.deepEqual(archiveResult(value, task, '重复', meta('duplicate')), value);
  const extraction = pending('audit', { taskId: 'extract', instruction: '[DSH_EXTRACT_CHARACTERS]', sourceVersionId: 'v' });
  value = archiveResult(value, extraction, '```json\n{"characters":[{"name":"母亲","voice":"直白"}]}\n```', meta('characters'));
  assert.equal(value.characterDraft[0].name, '母亲');
  assert.equal(value.characterDraft[0].relationship, '');
  assert.equal(value.reports.at(-1).reportKind, 'characters');
  assert.equal(value.versions.length, 1);
  value = archiveResult(value, pending('persona'), '主播人设');
  assert.equal(value.personaDraft, '主播人设');
  assert.equal(value.currentVersionId, 'v');
  assert.equal(base.reports, undefined);
});

test('malformed extraction and failed tasks preserve manuscript and record recoverable outcomes', () => {
  const base = project({ versions: [{ id: 'v', phase: 'full', text: '原稿' }] });
  const result = archiveResult(base, pending('audit', { instruction: '[DSH_EXTRACT_CHARACTERS]' }), '不是JSON', meta('r'));
  assert.equal(result.characterDraft, null);
  assert.match(result.characterDraftError, /JSON/);
  assert.equal(result.reports[0].text, '不是JSON');
  const failed = archiveResult(base, pending('revision', { sourceVersionId: 'v' }), { text: '', error: '模型失败' });
  assert.equal(failed.retry.sourceVersionId, 'v');
  assert.equal(failed.retry.reason, '模型失败');
  assert.equal(failed.pending, null);
  assert.equal(failed.versions.length, 1);
});

const finalRequest = (mode, phase, patches = {}) => buildTaskText({ project: project({ mode, topic: '回家', notes: '别改金额', brief: { lockedFacts: '金额三千' } }), phase,
  taskId: 'test-task', draft: 'SOURCE', liveRules: 'LIVE_SKILL_SENTINEL', shortRules: 'SHORT_SKILL_SENTINEL', humanizeRules: 'HUMANIZE_SENTINEL', ...patches });

test('final requests isolate complete skills by phase across all four modes', () => {
  for (const mode of ['live', 'live-opt', 'duan-ba', 'duan-adapt']) {
    for (const phase of ['idea', 'idea-opt', 'outline', 'outline-opt', 'persona', 'audit', 'polish', 'full', 'revision']) {
      const result = finalRequest(mode, phase);
      assert.match(result, /\[DSH_SCRIPT_TASK:test-task\]/);
      assert.match(result, /SOURCE/);
      assert.match(result, /金额三千/);
      if (['full', 'revision'].includes(phase)) {
        assert.ok(result.includes(mode.startsWith('live') ? 'LIVE_SKILL_SENTINEL' : 'SHORT_SKILL_SENTINEL'));
        assert.ok(!result.includes(mode.startsWith('live') ? 'SHORT_SKILL_SENTINEL' : 'LIVE_SKILL_SENTINEL'));
      } else assert.doesNotMatch(result, /LIVE_SKILL_SENTINEL|SHORT_SKILL_SENTINEL|至少200个汉字|11字段/);
      assert.equal(result.includes('HUMANIZE_SENTINEL'), phase === 'polish');
    }
  }
});

test('live structure stages avoid twist requirements while short video retains professional structure', () => {
  for (const phase of ['idea', 'idea-opt', 'outline', 'outline-opt']) {
    const live = finalRequest('live', phase);
    assert.match(live, /情绪/);
    assert.doesNotMatch(live, /第几段反转|可用转折|结尾钩子|证据或反转/);
    const short = finalRequest('duan-adapt', phase);
    assert.match(short, /转折|反转|钩子/);
    assert.doesNotMatch(short, /主播\/一麦\/二麦|谁先开口/);
  }
  assert.match(finalRequest('duan-adapt', 'full'), /11字段|八段/);
  assert.match(finalRequest('duan-adapt', 'full'), /空间|证据|±15%/);
});

test('auxiliary phases omit full optimization strength even in live-opt deep mode', () => {
  for (const phase of ['idea-opt', 'outline-opt', 'audit', 'persona', 'polish']) {
    const result = finalRequest('live-opt', phase, { project: project({ mode: 'live-opt', intensity: 'deep' }) });
    assert.doesNotMatch(result, /优化强度|允许重构节奏和场景/);
  }
});

test('polish final request explicitly retains source idea or outline structure', () => {
  const idea = finalRequest('live', 'polish', { artifactKind: 'idea' });
  const outline = finalRequest('duan-adapt', 'polish', { artifactKind: 'outline' });
  assert.match(idea, /来源内容类型：思路/);
  assert.match(idea, /不扩成大纲或完整剧本/);
  assert.match(outline, /来源内容类型：大纲/);
  assert.match(outline, /不扩写完整台词或完整剧本/);
  for (const result of [idea, outline]) assert.doesNotMatch(result, /LIVE_SKILL_SENTINEL|SHORT_SKILL_SENTINEL|至少200个汉字|11字段/);
});

test('extraction final request contains JSON contract without contradictory audit/full rules', () => {
  const result = finalRequest('live', 'audit', { instruction: '[DSH_EXTRACT_CHARACTERS] 提取人物' });
  assert.match(result, /只提取当前稿中的人物卡/);
  assert.match(result, /"characters"/);
  assert.doesNotMatch(result, /本阶段只审校|LIVE_SKILL_SENTINEL|SHORT_SKILL_SENTINEL/);
  assert.match(finalRequest('live', 'audit'), /本阶段只审校/);
  assert.throws(() => finalRequest('live', 'full', { taskId: 'bad]\nmarker' }), /任务标记/);
});

test('real embedded full skill is absent from auxiliary final requests', async () => {
  const liveRules = await readFile(new URL('../skills/elderly-livestream-script/SKILL.md', import.meta.url), 'utf8');
  assert.match(finalRequest('live', 'full', { liveRules }), /每段正式角色台词不少于 200 个汉字/);
  for (const phase of ['idea', 'outline', 'audit', 'persona', 'polish']) {
    assert.doesNotMatch(finalRequest('live', phase, { liveRules }), /每段正式角色台词不少于 200 个汉字|# 老年观众直播间剧本创作规范/);
  }
});
