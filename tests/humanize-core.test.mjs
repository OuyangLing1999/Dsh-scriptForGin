import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPolishPrompt, checkHumanize } from '../humanize-core.js';

test('polish prompt includes rules, facts preservation and source', () => {
  const prompt = buildPolishPrompt({ draft: '原稿', instruction: '保留口语' });
  assert.match(prompt, /只做文字润色/);
  assert.match(prompt, /“可能”不改成“确定”/);
  assert.match(prompt, /原稿/);
  assert.match(prompt, /保留口语/);
  assert.match(prompt, /不把对白改成旁白/);
});

test('polish prompt never includes full-script protocol', () => {
  const prompt = buildPolishPrompt({ draft: '【主播】\n你好' });
  assert.doesNotMatch(prompt, /至少200个汉字|11字段|八段/);
});

test('deterministic check flags slop and spares concrete lists', () => {
  assert.ok(checkHumanize('该方案稳定可靠、快速响应、易于维护').issues.some(x => x.code === 'FOUR_CHAR_PILE'));
  assert.ok(checkHumanize('本文将深入探讨一个至关重要的问题').issues.some(x => x.code === 'BUZZWORD'));
  assert.ok(checkHumanize('这不是一次更新，更是效率的飞跃').issues.some(x => x.code === 'FAKE_CONTRAST'));
  assert.ok(checkHumanize('好问题！希望这对您有帮助').issues.some(x => x.code === 'CUSTOMER_SERVICE'));
  assert.equal(checkHumanize('导出、搜索和批量重命名是三个不同的功能').ok, true);
});
