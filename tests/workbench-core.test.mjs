import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, validateProject, saveProject, loadProject, exportBackup, importBackup, buildPrompt, validateScript, compareVersions, extractEventText, STORAGE_KEY } from '../workbench-core.js';

const memory = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data }; };
test('project backups round trip rich state without sharing references', () => {
  const project = createProject({ title: '老人回家', draft: '事实原稿', brief: { lockedFacts: ['年龄六十'] }, characters: [{ id: 'c1', name: '张姐', stance: '想见孩子' }], samples: [{ id: 's1', text: '样本', mode: 'live' }], selectedSampleIds: ['s1'], versions: [{ id: 'v1', text: '第一版' }] });
  const backup = importBackup(exportBackup(project));
  assert.equal(backup.ok, true);
  assert.deepEqual(backup.project, project);
  backup.project.characters[0].name = '修改';
  assert.equal(project.characters[0].name, '张姐');
});
test('malformed backups, unsupported schema, invalid collections and dangling sample IDs are rejected', () => {
  assert.equal(importBackup('{').ok, false);
  assert.equal(importBackup(JSON.stringify({ format: 'script-workbench', schemaVersion: 2 })).ok, false);
  for (const patch of [{ draft: 7 }, { characters: [{ id: 'x' }] }, { samples: null }, { versions: [{ id: 'v', text: 7 }] }, { selectedSampleIds: ['missing'] }, { characters: [{ id: 'x', name: '甲' }, { id: 'x', name: '乙' }] }]) {
    assert.equal(validateProject(createProject(patch)).ok, false, JSON.stringify(patch));
  }
});
test('safe persistence keeps prior valid version and recovers corrupt primary', () => {
  const storage = memory();
  assert.equal(loadProject(storage).ok, true);
  assert.equal(saveProject(storage, createProject({ draft: '旧稿' })).ok, true);
  assert.equal(saveProject(storage, createProject({ draft: '新稿' })).ok, true);
  storage.setItem(STORAGE_KEY, 'broken');
  const result = loadProject(storage);
  assert.equal(result.recovered, true);
  assert.equal(result.project.draft, '旧稿');
  assert.equal(typeof result.error, 'string');
  assert.equal(storage.getItem(STORAGE_KEY), 'broken');
});
test('storage read/write failures surface errors and retain in-memory draft', () => {
  const project = createProject({ draft: '珍贵原稿' });
  assert.equal(saveProject({ getItem() { throw new Error('denied'); } }, project).error, 'denied');
  assert.equal(saveProject({ getItem: () => null, setItem() { throw new Error('quota'); } }, project).error, 'quota');
  assert.equal(loadProject({ getItem() { throw new Error('blocked'); } }).ok, false);
  assert.equal(project.draft, '珍贵原稿');
  const storage = memory();
  saveProject(storage, project);
  const before = storage.getItem(STORAGE_KEY);
  assert.equal(saveProject(storage, { ...project, mode: 'invalid' }).ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), before);
});
test('prompt modes isolate live constraints and relevant selected samples', () => {
  const project = createProject({ samples: [{ id: 'l', mode: 'live', text: 'LIVE_ONLY' }, { id: 'd', mode: 'duan-ba', text: 'SHORT_ONLY' }, { id: 'u', mode: 'live', text: 'UNSELECTED' }], selectedSampleIds: ['l', 'd'] });
  const live = buildPrompt({ mode: 'live', project });
  assert.match(live, /至少200个汉字/);
  assert.match(live, /LIVE_ONLY/);
  assert.doesNotMatch(live, /SHORT_ONLY|UNSELECTED|11字段|八段/);
  const short = buildPrompt({ mode: 'duan-adapt', project });
  assert.match(short, /SHORT_ONLY/);
  assert.match(short, /11字段|八段/);
  assert.doesNotMatch(short, /LIVE_ONLY|至少200个汉字/);
  assert.match(buildPrompt({ mode: 'duan-ba', project }), /先按时间整理可见\/可听证据表/);
});
test('phase, intensity, creative brief and protected facts stay explicit', () => {
  const project = createProject({ brief: { relationship: '母子', conflict: '拒绝回家', goals: '见面', ending: '部分接纳', lockedFacts: '金额三千', protectedLines: '原句保留' }, characters: [{ id: 'a', name: '李姐', style: '直白' }] });
  assert.match(buildPrompt({ mode: 'live-opt', phase: 'revision', intensity: 'deep', project }), /允许重构/);
  assert.match(buildPrompt({ mode: 'live-opt', intensity: 'light', project }), /仅修口语/);
  assert.match(buildPrompt({ mode: 'live-opt', intensity: 'structure', project }), /调整话轮/);
  for (const word of ['母子', '拒绝回家', '见面', '部分接纳', '金额三千', '原句保留', '李姐']) assert.ok(buildPrompt({ project }).includes(word));
  assert.match(buildPrompt({ phase: 'outline', project }), /只给大纲/);
  assert.match(buildPrompt({ phase: 'audit', project }), /只审校/);
  assert.throws(() => buildPrompt({ mode: 'other' }));
});
test('live review counts Chinese characters, identifies stage directions and missing handoffs', () => {
  const result = validateScript('【主播】\n' + '家'.repeat(199) + '123abc\n【张姐】\n（点头）我来了', 'live');
  assert.ok(result.issues.some(x => x.code === 'LIVE_SHORT_SEGMENT' && x.count === 199));
  assert.ok(result.issues.some(x => x.code === 'LIVE_STAGE_DIRECTION'));
  assert.ok(result.issues.some(x => x.code === 'LIVE_HANDOFF'));
  const good = validateScript('【主播】\n' + '家'.repeat(200) + '张姐，您说呢？\n【张姐】\n' + '亲'.repeat(200), 'live');
  assert.equal(good.ok, true);
});
test('duplicate paragraph check is deterministic', () => {
  const paragraph = '这是一个应当识别出来的重复段落，不能被忽略。';
  assert.ok(validateScript(paragraph + '\n\n' + paragraph).issues.some(x => x.code === 'DUPLICATE_PARAGRAPH'));
});
const fields = (position, person = '妈妈') => `位置：${position}\n出场人物：${person}\n空间动作：站在原地\n镜头怎么拍：中景\n人物动作：抬头\n台词：妈妈：我回来了\n屏幕花字：无\n环境音 / BGM：仅现场声\n沉默和停留时间：2秒\n剪辑注意事项：保持连续\n本场功能：关系推进`;
const shooting = (second = '门槛', person = '妈妈', duration = 20) => `# 1. 剧本标题与本集任务\n登场人物：妈妈、儿子\n空间路径：门外 > 门槛 > 客厅\n目标总时长：30秒\n# 2. 拍摄前必看\n手机\n# 3. 准备清单\n衣服\n# 4. 人物表演规则\n自然\n# 5. 逐场、逐镜头拍摄剧本\n【1 / 10秒 / 钩子】\n${fields('门外')}\n【2 / ${duration}秒 / 推进】\n${fields(second, person)}\n# 6. 本集爆点与伏笔\n关系\n# 7. 剪辑与发布建议\n保留\n# 8. 拍摄验收表\n核验`;
test('short checks eight sections, scene fields, budgets, people and route', () => {
  assert.equal(validateScript(shooting(), 'duan-ba').ok, true);
  const bad = validateScript(shooting('客厅', '邻居', 15).replace('屏幕花字：无', '屏幕花字：'), 'duan-adapt');
  for (const code of ['SHORT_ROUTE_JUMP', 'SHORT_UNDECLARED_PERSON', 'SHORT_DURATION_SUM', 'SHORT_SCENE_FIELD']) assert.ok(bad.issues.some(x => x.code === code), code);
  assert.ok(validateScript(shooting().replace('拍摄前必看', 'missing'), 'duan-ba').issues.some(x => x.code === 'SHORT_SECTION'));
});
test('line summaries handle multiplicity, CRLF and reorder in linear space', () => {
  assert.deepEqual(compareVersions('a\r\nb\na', 'a\nb\nc'), { added: 1, removed: 1, changed: true, summary: '新增1行，移除1行（按行计数，重排不计）' });
  assert.equal(compareVersions('a\nb', 'b\na').changed, false);
  assert.equal(compareVersions({ text: 'a' }, { text: 'b' }).added, 1);
});
test('event extraction prefers durable content and filters reasoning and tool fragments', () => {
  const event = { type: 'assistant/message', data: { message: { role: 'assistant', content: [{ type: 'reasoning', text: 'SECRET' }, { type: 'text', text: '正文' }] }, stream: [{ type: 'text-chunks', texts: ['重复'] }] } };
  assert.equal(extractEventText(event), '正文');
  assert.equal(extractEventText({ type: 'event', event }), '正文');
  assert.equal(extractEventText({ type: 'user/message', data: { content: 'user' } }), '');
  assert.equal(extractEventText({ ...event, data: { message: { channel: 'analysis', content: 'SECRET' } } }), '');
  assert.equal(extractEventText({ type: 'assistant/message', data: { stream: [{ type: 'reasoning-chunks', texts: ['secret'] }, { type: 'text-chunks', texts: ['甲', '乙'] }, { type: 'chunk', chunk: { type: 'text-delta', text: '丙', index: 0 } }, { type: 'chunk', chunk: { type: 'tool-call-delta', argumentsDelta: 'secret' } }] } }), '甲乙丙');
});
test('stream channel metadata excludes analysis while start/end carry no duplicated text', () => {
  const stream = [
    { type: 'chunk', chunk: { type: 'text-start', id: 'a', channel: 'analysis' } },
    { type: 'chunk', chunk: { type: 'text-delta', id: 'a', delta: 'secret' } },
    { type: 'chunk', chunk: { type: 'text-start', id: 'b', channel: 'final' } },
    { type: 'chunk', chunk: { type: 'text-delta', id: 'b', delta: '可见' } },
    { type: 'chunk', chunk: { type: 'block-end', block: { type: 'text', text: '可见' } } },
  ];
  assert.equal(extractEventText({ type: 'assistant/message', data: { stream } }), '可见');
});
