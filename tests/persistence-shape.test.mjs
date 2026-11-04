import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, validateProject, exportBackup, importBackup } from '../workbench-core.js';

test('legacy backups and rich workbench backups remain compatible', () => {
  const legacy = createProject({ id: 'legacy', draft: '原稿' });
  assert.equal(importBackup(exportBackup(legacy)).ok, true);
  const project = createProject({ id: 'rich', reports: [{ id: 'r1', text: '审稿意见', sourceVersionId: 'v1' }],
    materials: [{ id: 'm1', name: '字幕.srt', text: '时间轴证据' }], editBuffers: { v1: '编辑中的稿件' },
    pending: { taskId: 'task', phase: 'polish', request: { text: '原请求', sessionId: 'session', parts: [] } } });
  const restored = importBackup(exportBackup(project));
  assert.equal(restored.ok, true);
  assert.deepEqual(restored.project, project);
});

test('malformed optional collections and task state are rejected before hydration', () => {
  for (const patch of [
    { reports: 'report' }, { reports: [{ id: 'r1', text: 42 }] },
    { materials: [{ id: 'm1', name: 7, text: 'text' }] },
    { materials: [{ id: 'm1', name: 'a', text: 'a' }, { id: 'm1', name: 'b', text: 'b' }] },
    { editBuffers: { v1: null } }, { pending: { phase: 'full' } },
    { retry: { phase: 'unsupported' } }, { samples: [{ id: 's1', text: 'text', tags: 'tag' }] },
  ]) assert.equal(validateProject(createProject(patch)).ok, false, JSON.stringify(patch));
});
