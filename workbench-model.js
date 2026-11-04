import { buildPrompt, resolveCreativeProfile } from './workbench-core.js';

const KINDS = new Set(['idea', 'outline', 'script', 'report']);
const EXTRACT_MARKER = '[DSH_EXTRACT_CHARACTERS]';
const copy = value => JSON.parse(JSON.stringify(value));
const textOf = value => typeof value === 'string' ? value : '';

export function artifactKind(version) {
  if (KINDS.has(version?.artifactKind)) return version.artifactKind;
  if (version?.phase === 'audit') return 'report';
  if (['idea', 'idea-opt'].includes(version?.phase)) return 'idea';
  if (['outline', 'outline-opt'].includes(version?.phase)) return 'outline';
  return 'script';
}

/** Migrate legacy history without mutating input; adopted manuscript is independent of newest output. */
export function normalizeProject(project) {
  const result = copy(project || {});
  result.creativeProfile = resolveCreativeProfile(project);
  const reports = Array.isArray(result.reports) ? result.reports : [];
  const reportIds = new Set(reports.map(item => item.id).filter(Boolean));
  const history = Array.isArray(result.versions) ? result.versions : [];
  const byId = new Map(history.map(item => [item.id, item]));
  function infer(version, seen = new Set()) {
    if (KINDS.has(version.artifactKind)) return version.artifactKind;
    if (['manual', 'polish', 'revision'].includes(version.phase) && version.sourceVersionId && !seen.has(version.id)) {
      seen.add(version.id);
      const source = byId.get(version.sourceVersionId);
      if (source) { const kind = infer(source, seen); if (kind !== 'report') return kind; }
    }
    return artifactKind(version);
  }
  result.versions = history.filter(version => {
    if (version.phase !== 'audit' && artifactKind(version) !== 'report') return true;
    if (!version.id || !reportIds.has(version.id)) {
      reports.push({ ...version, artifactKind: 'report' });
      if (version.id) reportIds.add(version.id);
    }
    return false;
  }).map(version => ({ ...version, artifactKind: infer(version) }));
  result.reports = reports.map(report => ({ ...report, artifactKind: 'report' }));
  if (!result.versions.some(version => version.id === result.currentVersionId)) result.currentVersionId = result.versions.at(-1)?.id || '';
  return result;
}

/** Fork editable material/history, never an old running task or retry request. */
export function forkProject(project, { id, title } = {}) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('项目副本需要显式 id');
  const result = normalizeProject(project);
  return { ...result, id, ...(title === undefined ? {} : { title }), pending: null, retry: null, sessionId: '' };
}

export function resolveVersion(project, selectedId) {
  const versions = (Array.isArray(project?.versions) ? project.versions : [])
    .filter(version => version && version.phase !== 'audit' && artifactKind(version) !== 'report');
  return versions.find(version => version.id === selectedId)
    || versions.find(version => version.id === project?.currentVersionId)
    || versions.at(-1) || null;
}

export function revisionPhase(version) {
  const kind = artifactKind(version);
  return kind === 'idea' ? 'idea-opt' : kind === 'outline' ? 'outline-opt' : kind === 'report' ? null : 'revision';
}

function characterDraft(text) {
  const candidates = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map(match => match[1]);
  candidates.push(text.trim());
  for (const raw of candidates) {
    try {
      const value = JSON.parse(raw);
      const list = Array.isArray(value) ? value : value?.characters;
      if (!Array.isArray(list)) continue;
      const cards = list.filter(item => item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim())
        .map(item => Object.fromEntries(['name', 'relationship', 'goal', 'knowledge', 'voice', 'state'].map(key => [key, textOf(item[key])])));
      if (cards.length) return cards;
    } catch {}
  }
  return null;
}

/** Return a new project; caller supplies archive metadata and source snapshot. */
export function archiveResult(project, pending, result, metadata = {}) {
  const next = normalizeProject(project);
  if (!pending) return next;
  const taskId = pending.taskId || '';
  if (taskId && (next.versions.some(item => item.taskId === taskId)
    || next.reports.some(item => item.taskId === taskId) || next.personaDraftTaskId === taskId)) return next;
  const text = textOf(typeof result === 'string' ? result : result?.text);
  const error = typeof result === 'object' && result ? result.error : '';
  if (error || !text.trim()) {
    return { ...next, pending: null, retry: { phase: pending.phase, instruction: pending.instruction || '',
      repairCount: pending.repairCount || 0, sourceVersionId: pending.sourceVersionId || '',
      artifactKind: pending.artifactKind,
      ...(pending.request === undefined ? {} : { request: copy(pending.request) }),
      creativeProfile: resolveCreativeProfile(pending.creativeProfile !== undefined ? pending : pending.sourceVersion || project),
      reason: textOf(error?.message || error) || '结果为空' } };
  }
  if (pending.phase === 'persona') return { ...next, personaDraft: text.trim(), personaDraftTaskId: taskId, pending: null, retry: null };
  if (!metadata.id || !metadata.createdAt) throw new Error('归档需要 id 与 createdAt');
  const source = pending.sourceVersion || next.versions.find(item => item.id === pending.sourceVersionId);
  const sourceVersionId = pending.sourceVersionId || source?.id || '';
  const report = pending.phase === 'audit';
  const kind = report ? 'report' : ['idea', 'idea-opt'].includes(pending.phase) ? 'idea'
    : ['outline', 'outline-opt'].includes(pending.phase) ? 'outline'
    : pending.phase === 'full' ? 'script'
    : KINDS.has(pending.artifactKind) && pending.artifactKind !== 'report' ? pending.artifactKind
    : source && artifactKind(source) !== 'report' ? artifactKind(source) : 'script';
  const entry = { id: metadata.id, createdAt: metadata.createdAt, text, phase: pending.phase,
    creativeProfile: resolveCreativeProfile(pending.creativeProfile !== undefined ? pending : source || project),
    mode: pending.mode || source?.mode || next.mode, taskId, artifactKind: kind, sourceVersionId };
  next.pending = null;
  next.retry = null;
  if (report) {
    const extracting = textOf(pending.instruction).includes(EXTRACT_MARKER);
    next.reports.push({ ...entry, reportKind: extracting ? 'characters' : 'audit' });
    if (extracting) {
      next.characterDraft = characterDraft(text);
      next.characterDraftError = next.characterDraft ? '' : '人物卡结果未包含有效 JSON，原始结果已保存在报告中。';
    }
  } else {
    next.versions.push(entry);
    if (!next.currentVersionId) next.currentVersionId = entry.id;
  }
  return next;
}

/** Actual final request, shared by UI and tests. Full skills only apply to full/revision. */
export function buildTaskText({ project, phase = 'full', draft, instruction = '', taskId, artifactKind: sourceKind,
  creativeProfile, sourceVersion,
  liveRules = '', shortRules = '', humanizeRules = '' }) {
  const source = sourceVersion || project.sourceVersion;
  const profile = creativeProfile !== undefined ? resolveCreativeProfile({ creativeProfile }) : resolveCreativeProfile(source || project);
  project = { ...project, creativeProfile: profile };
  if (typeof taskId !== 'string' || !/^[A-Za-z0-9._:-]+$/.test(taskId)) throw new Error('任务标记无效');
  const details = [
    phase === 'polish' && sourceKind === 'idea' ? '来源内容类型：思路。只润色当前思路，保持思路结构，不扩成大纲或完整剧本。' : '',
    phase === 'polish' && sourceKind === 'outline' ? '来源内容类型：大纲。只润色当前大纲，保留话轮或场次骨架，不扩写完整台词或完整剧本。' : '',
    project.topic ? '主题：' + project.topic : '', project.notes ? '补充要求：' + project.notes : '',
    project.outline ? '已确认大纲：\n' + project.outline : '',
    project.videoPath ? '运行 DSH 的电脑本地视频路径：' + project.videoPath : '',
    project.videoEvidence ? '视频证据（以原始视听资料为准）：\n' + project.videoEvidence : '',
    project.fingerprint ? '结构指纹：\n' + project.fingerprint : '', instruction,
    '请把本阶段完整成品写在最终回复中，不要只返回文件路径。',
  ].filter(Boolean).join('\n\n');
  const rules = ['full', 'revision'].includes(phase)
    ? (project.mode.startsWith('duan') ? shortRules : liveRules)
    : phase === 'polish' ? humanizeRules : '';
  return ['[DSH_SCRIPT_TASK:' + taskId + ']', '[DSH_SCRIPT_PHASE:' + phase + ']', rules,
    buildPrompt({ project, phase, draft, instruction: details,
      extractCharacters: phase === 'audit' && instruction.includes(EXTRACT_MARKER) })].filter(Boolean).join('\n\n');
}
