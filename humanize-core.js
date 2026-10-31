// humanize-core.js：润色提示词构建与确定性自检。
import { HUMANIZE_RULES, HUMANIZE_PATTERNS } from './humanize-rules.js';

export function buildPolishPrompt(options = {}) {
  const source = options.draft || options.text || '';
  const instruction = options.instruction || '';
  return [
    '任务：对下面文本做文字润色，让它更自然，同时保留全部事实、确定程度和作者语气。',
    '润色规则：\n' + HUMANIZE_RULES,
    '直播/短视频剧本额外要求：保留【角色名】行、场次标题、预计秒数等结构；不把对白改成旁白，不把动作描写删到无法执行。',
    '当前文本：\n' + source,
    instruction ? '本次要求：\n' + instruction : '',
  ].filter(Boolean).join('\n\n');
}

export function checkHumanize(text) {
  const source = typeof text === 'string' ? text : '';
  const issues = [];
  for (const rule of HUMANIZE_PATTERNS) {
    if (rule.pattern.test(source)) issues.push({ code: rule.code, message: '仍可能出现：' + rule.label });
  }
  return { ok: issues.length === 0, issues };
}
