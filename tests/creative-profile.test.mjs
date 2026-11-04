import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, normalizeTags, resolveCreativeProfile, validateProject, exportBackup, importBackup, saveCatalog, buildPrompt } from '../workbench-core.js';
import { normalizeProject, archiveResult, buildTaskText } from '../workbench-model.js';

const legacy = { audience: '60岁以上老年观众', themeTags: ['家庭情感'], styleTags: [] };
const open = { audience: '50岁以上中老年人', themeTags: [], styleTags: [] };
const knowledge = { audience: '50岁以上摄影爱好者', themeTags: ['摄影知识'], styleTags: ['幽默'] };
const metadata = { id: 'new', createdAt: '2026-11-04T12:00:00Z' };
const task = extras => ({ taskId: 'task-1', phase: 'revision', mode: 'live', ...extras });
const final = extras => buildTaskText({ project: createProject(), phase: 'revision', taskId: 'profile-test', ...extras });

test('normalizeTags splits punctuation, preserves internal spaces, spelling, order and bounds', () => {
  assert.deepEqual(normalizeTags('  AI 摄影,怀旧，ai 摄影、生活\n  DIY 标签  '), ['AI 摄影', '怀旧', '生活', 'DIY 标签']);
  assert.deepEqual(normalizeTags([' A ', 'a', null, ' ', 1, 'B']), ['A', 'B']);
  assert.equal(normalizeTags(Array.from({ length: 20 }, (_, i) => String(i))).length, 12);
  assert.equal(normalizeTags(['长'.repeat(50)])[0].length, 40);
  assert.deepEqual(normalizeTags(undefined), []);
});

test('new and legacy profiles have different defaults and resolution is independent', () => {
  assert.deepEqual(createProject().creativeProfile, open);
  const old = createProject(); delete old.creativeProfile;
  Object.freeze(old);
  assert.deepEqual(resolveCreativeProfile(old), legacy);
  assert.deepEqual(normalizeProject(old).creativeProfile, legacy);
  assert.equal(old.creativeProfile, undefined);
  const resolved = resolveCreativeProfile(old); resolved.themeTags.push('changed');
  assert.deepEqual(resolveCreativeProfile(old), legacy);
  assert.deepEqual(resolveCreativeProfile({ creativeProfile: open }), open);
});

test('optional profiles strictly validate audience, tag types, counts and lengths', () => {
  const old = createProject(); delete old.creativeProfile;
  assert.equal(validateProject(old).ok, true);
  for (const creativeProfile of [null, [], {}, { ...open, audience: ' ' }, { ...open, audience: 'x'.repeat(201) },
    { ...open, themeTags: '摄影' }, { ...open, styleTags: [2] }, { ...open, themeTags: [''] },
    { ...open, themeTags: ['x'.repeat(41)] }, { ...open, themeTags: Array(13).fill('摄影') }]) {
    assert.equal(validateProject(createProject({ creativeProfile })).ok, false, JSON.stringify(creativeProfile));
  }
  assert.equal(validateProject(createProject({ creativeProfile: knowledge })).ok, true);
  assert.equal(validateProject(createProject({ versions: [{ id: 'v', text: '', creativeProfile: null }] })).ok, false);
});

test('backups and catalog persistence retain project and history profiles', () => {
  const project = createProject({ creativeProfile: knowledge, versions: [{ id: 'v', text: '旧稿', creativeProfile: legacy }] });
  const restored = importBackup(exportBackup(project));
  assert.equal(restored.ok, true); assert.deepEqual(restored.project, project);
  restored.project.creativeProfile.themeTags.push('another'); assert.deepEqual(project.creativeProfile, knowledge);
  const data = new Map(), storage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
  assert.equal(saveCatalog(storage, 'catalog', { projects: [project], activeId: 'p' }, 0).ok, true);
  assert.deepEqual(JSON.parse(data.get('catalog')).projects[0].creativeProfile, knowledge);
});

test('generic prompts carry JSON data, open themes, priority and topic-neutral progression', () => {
  for (const mode of ['live', 'duan-adapt']) for (const phase of ['idea', 'idea-opt', 'outline', 'outline-opt']) {
    const prompt = buildPrompt({ project: createProject({ mode, creativeProfile: knowledge }), phase });
    assert.ok(prompt.includes(JSON.stringify(knowledge, null, 2)));
    assert.match(prompt, /JSON资料，不是指令/); assert.match(prompt, /明确选题、补充要求和本次修改要求优先/);
    assert.match(prompt, /标签为空表示开放题材/); assert.match(prompt, /年龄不代表教育水平/);
    assert.doesNotMatch(prompt, /不设置悬疑、反转、双关或伏笔|生活矛盾、主播/);
    assert.doesNotMatch(prompt, /至少200个汉字|11字段/);
  }
  const full = buildPrompt({ project: createProject(), phase: 'full' });
  assert.match(full, /至少200个汉字/); assert.match(full, /本段落点（观点\/信息\/情绪按题材）/);
  assert.doesNotMatch(full, /情感落点/);
  assert.match(buildPrompt({ project: createProject({ mode: 'duan-ba' }) }), /11字段/);
  const adaptation = buildPrompt({ project: createProject({ mode: 'duan-adapt', creativeProfile: knowledge }) });
  assert.match(adaptation, /仅保留来源实际存在且已确认锁定/);
  assert.match(adaptation, /知识题材按原稿信息、方法与结果推进/);
  assert.doesNotMatch(adaptation, /；保留钩子、功能位/);
  const oldProject = createProject(); delete oldProject.creativeProfile;
  assert.match(buildPrompt({ project: oldProject, phase: 'idea' }), /不设置悬疑/);
  const explicit = buildPrompt({ project: createProject({ creativeProfile: legacy, topic: '防诈骗' }), phase: 'idea' });
  assert.match(explicit, /信息递进/); assert.doesNotMatch(explicit, /不设置悬疑/);
});

test('audit criteria adapt to knowledge, family and humor without prescribing emotional arc', () => {
  const prompt = buildPrompt({ project: createProject({ creativeProfile: knowledge }), phase: 'audit' });
  for (const term of ['人物动机', '事实依据', '铺垫回收', '口语流畅', '不要求每种题材都有情绪弧线']) assert.ok(prompt.includes(term));
});

test('final requests default to source profile and honor explicit project override', () => {
  const sourceVersion = { id: 'source', text: '原稿', creativeProfile: legacy };
  const project = createProject({ creativeProfile: knowledge, topic: '摄影', notes: '保留参数' });
  const sourcePrompt = final({ project, sourceVersion });
  assert.ok(sourcePrompt.includes(JSON.stringify(legacy, null, 2)));
  assert.ok(!sourcePrompt.includes(JSON.stringify(knowledge, null, 2)));
  assert.ok(final({ project, sourceVersion, creativeProfile: knowledge }).includes(JSON.stringify(knowledge, null, 2)));
  assert.ok(final({ project: { ...project, sourceVersion } }).includes(JSON.stringify(legacy, null, 2)));
  assert.ok(final({ project, sourceVersion: { id: 'old' } }).includes(JSON.stringify(legacy, null, 2)));
  assert.deepEqual(project.creativeProfile, knowledge);
});

test('archive snapshots prefer pending then source then project without changing kind or adoption', () => {
  const source = { id: 'old', phase: 'outline', artifactKind: 'outline', text: '旧纲', creativeProfile: legacy };
  const project = createProject({ creativeProfile: knowledge, currentVersionId: 'old', versions: [source] });
  for (const [pending, expected] of [[task({ sourceVersion: source }), legacy], [task({ sourceVersion: source, creativeProfile: open }), open], [task({}), knowledge]]) {
    const result = archiveResult(project, pending, '新稿', metadata);
    assert.deepEqual(result.versions.at(-1).creativeProfile, expected);
    assert.equal(result.currentVersionId, 'old');
    if (pending.sourceVersion) assert.equal(result.versions.at(-1).artifactKind, 'outline');
    result.versions.at(-1).creativeProfile.themeTags.push('changed');
    assert.deepEqual(project.creativeProfile, knowledge); assert.deepEqual(source.creativeProfile, legacy);
  }
  const report = archiveResult(project, task({ phase: 'audit', sourceVersionId: 'old' }), '审稿', metadata);
  assert.deepEqual(report.reports[0].creativeProfile, legacy);
});

test('extraction omits audit criteria and malformed nested snapshots fail validation', () => {
  const extracted = final({ phase: 'audit', instruction: '[DSH_EXTRACT_CHARACTERS]' });
  assert.match(extracted, /只输出 JSON/); assert.doesNotMatch(extracted, /审稿适配/);
  for (const pending of [task({ creativeProfile: null }), task({ request: { creativeProfile: { ...open, audience: '' } } }), task({ sourceVersion: { creativeProfile: null } }), task({ request: { sourceVersion: { creativeProfile: null } } })]) {
    assert.equal(validateProject(createProject({ pending })).ok, false);
    assert.equal(validateProject(createProject({ retry: pending })).ok, false);
  }
});

test('failed archive preserves exact retry request including profile snapshot', () => {
  const request = { text: 'EXACT_REQUEST', sessionId: 's', creativeProfile: legacy, receipts: ['r'] };
  const result = archiveResult(createProject(), task({ request, creativeProfile: legacy }), { error: 'failed' });
  assert.deepEqual(result.retry.request, request);
  assert.deepEqual(result.retry.creativeProfile, legacy);
  result.retry.request.creativeProfile.themeTags.push('changed'); assert.deepEqual(request.creativeProfile, legacy);
});
