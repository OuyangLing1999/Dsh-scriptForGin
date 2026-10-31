window.__ModuleLoader__.load({
  id: '@local/elderly-script',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef } = React;
    /* WORKBENCH_CORE */
    /* IO_CORE */
    /* UPDATE_CORE */
    /* SCRIPT_RULES */
    const T = {
      bg: 'var(--dsw-alias-bg-base)', layer1: 'var(--dsw-alias-bg-layer-1)', layer2: 'var(--dsw-alias-bg-layer-2)',
      border: 'var(--dsw-alias-border-l2)', brand: 'var(--dsw-alias-brand-primary)',
      text: 'var(--dsw-alias-label-primary)', muted: 'var(--dsw-alias-label-secondary)', error: 'var(--dsw-alias-state-error-primary)',
    };
    const card = { padding: 18, marginBottom: 16, border: '1px solid ' + T.border, borderRadius: 12, background: T.layer1 };
    const input = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', margin: '5px 0 12px', borderRadius: 8, border: '1px solid ' + T.border, background: T.layer2, color: T.text, font: 'inherit' };
    const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9 };
    const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    const catalogKey = 'dsh-script.projects.v2';
    const modeLabels = { live: '直播创作', 'live-opt': '直播优化', 'duan-ba': '视频扒片', 'duan-adapt': '短视频改编' };
    function blankProject(title = '新剧本项目') {
      return WB.createProject({ id: uid(), title, topic: '', notes: '', videoPath: '', sessionId: '', autoRepair: true,
        videoEvidence: '', fingerprint: '', outline: '', pending: null, mode: 'live', draft: '' });
    }
    function hydrateProject(value) {
      const p = { ...blankProject(), ...value };
      for (const key of ['topic','notes','videoPath','sessionId','videoEvidence','fingerprint','outline']) if (typeof p[key] !== 'string') p[key] = '';
      p.brief = Object.fromEntries(Object.entries(p.brief).map(([key, entry]) => [key, Array.isArray(entry) ? entry.join('\n') : entry]));
      p.autoRepair = p.autoRepair !== false;
      return p;
    }
    function loadCatalog() {
      try {
        const raw = localStorage.getItem(catalogKey);
        if (raw) {
          const value = JSON.parse(raw);
          if (!Array.isArray(value.projects) || !value.projects.length || value.projects.some((p) => !WB.validateProject(p).ok || typeof p.id !== 'string')) throw Error('项目存档格式异常');
          return { ...value, projects: value.projects.map(hydrateProject), error: '' };
        }
        return { projects: [blankProject()], activeId: '', error: '' };
      } catch (error) {
        try {
          const recovery = JSON.parse(localStorage.getItem(catalogKey + '.recovery'));
          if (Array.isArray(recovery?.projects) && recovery.projects.length && recovery.projects.every((p) => WB.validateProject(p).ok && typeof p.id === 'string')) {
            return { ...recovery, projects: recovery.projects.map(hydrateProject), error: '主存档异常，已恢复上一次有效副本。请检查后保存或导出备份。', blocked: true };
          }
        } catch {}
        return { projects: [blankProject()], activeId: '', error: '读取本机存档失败：' + error.message + '。可导入备份恢复；确认保存后才会替换原存档。', blocked: true };
      }
    }
    function download(name, content, type) {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function Button({ children, onClick, disabled, primary, ...props }) {
      return h('button', { type: 'button', onClick, disabled, style: {
        padding: '9px 14px', borderRadius: 8, border: '1px solid ' + (primary ? T.brand : T.border),
        background: primary ? T.brand : T.layer2, color: T.text, cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? .55 : 1,
      }, ...props }, children);
    }
    function Field({ label, value = '', onChange, rows, placeholder, ...props }) {
      return h('label', { style: { display: 'block', fontSize: 13 } }, label,
        h(rows ? 'textarea' : 'input', { ...props, value, placeholder, rows, style: input, onChange: (event) => onChange(event.target.value) }));
    }
    function MainPanel({ ctx }) {
      const [store, setStore] = useState(loadCatalog);
      const revisionRef = useRef(store.revision || 0);
      const [saveStatus, setSaveStatus] = useState('');
      const [notice, setNotice] = useState('');
      const [tab, setTab] = useState('create');
      const [sessions, setSessions] = useState([]);
      const [busy, setBusy] = useState(false);
      const [repairQueue, setRepairQueue] = useState(null);
      const [live, setLive] = useState(null);
      const [files, setFiles] = useState([]);
      const [selectedVersion, setSelectedVersion] = useState('');
      const [compareId, setCompareId] = useState('');
      const [revision, setRevision] = useState('');
      const [update, setUpdate] = useState(null);
      const [updateError, setUpdateError] = useState('');
      const [checking, setChecking] = useState(false);
      const [dismissed, setDismissed] = useState('');
      const [confirmed, setConfirmed] = useState(false);
      const project = store.projects.find((p) => p.id === store.activeId) || store.projects[0];
      const projectRef = useRef(project); projectRef.current = project;
      const storeRef = useRef(store); storeRef.current = store;
      const completedRef = useRef(new Set());
      const mounted = useRef(true);
      useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
      function change(patch, id = projectRef.current.id) {
        setStore((current) => ({ ...current, projects: current.projects.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p) }));
      }
      function changeBrief(key, value) { change({ brief: { ...project.brief, [key]: value } }); setConfirmed(false); }
      useEffect(() => {
        if (store.blocked) return;
        let alive = true;
        const persist = () => {
          if (!alive) return;
          const result = WB.saveCatalog(localStorage, catalogKey, { projects: store.projects, activeId: store.activeId }, revisionRef.current);
          if (result.ok) { revisionRef.current = result.revision; setSaveStatus('草稿已自动保存在当前浏览器'); }
          else {
            setSaveStatus('自动保存暂停：' + result.error + ' 可先导出项目备份。');
            if (result.conflict) setStore((current) => ({ ...current, blocked: true, conflict: true }));
          }
        };
        if (navigator.locks?.request) navigator.locks.request(catalogKey, persist).catch((error) => { if (alive) setSaveStatus('自动保存失败：' + error.message); });
        else persist();
        return () => { alive = false; };
      }, [store]);
      useEffect(() => {
        const sync = () => {
          const snapshot = ctx.sessions.list.getSnapshot();
          setSessions(snapshot.ids.map((id) => snapshot.byId[id]).filter(Boolean));
        };
        const stop = ctx.sessions.list.subscribe(sync); sync();
        ctx.sessions.refresh().catch((error) => setNotice(error.message));
        return stop;
      }, [ctx]);
      useEffect(() => {
        setFiles([]); setSelectedVersion(''); setCompareId(''); setLive(null); setConfirmed(false);
      }, [project.id]);
      // Host projection is authoritative for task results; no Client event folding.
      useEffect(() => {
        if (!project.sessionId) return;
        let alive = true, reference, stopProjection, stopStatus;
        (async () => {
          await ctx.sessions.refresh();
          if (!alive) return;
          reference = ctx.sessions.retain(project.sessionId, { source: 'controllerOperation' });
          const binding = await reference.ready;
          if (!alive) return;
          const face = binding.session.projections.faceOf('scriptWorkbench');
          const sync = () => { if (alive) setLive(face.getSnapshot() || null); };
          stopProjection = face.subscribe(sync); sync();
          stopStatus = binding.session.subscribe(() => {
            const snapshot = binding.session.getSnapshot();
            if (alive && snapshot.lastAgentError) setNotice('生成任务异常：' + snapshot.lastAgentError);
          });
        })().catch((error) => { if (alive) setNotice('读取项目结果失败：' + error.message); });
        return () => { alive = false; stopProjection?.(); stopStatus?.(); reference?.release(); };
      }, [ctx, project.sessionId, project.id]);
      useEffect(() => startAutoUpdateChecks({ onResult: setUpdate, onError: (error) => setUpdateError(error.message) }), []);
      async function checkUpdate() {
        if (checking) return;
        setChecking(true); setDismissed(''); setUpdateError('');
        try { setUpdate(await checkForUpdates()); } catch (error) { setUpdateError(error.message); } finally { setChecking(false); }
      }
      const latest = project.versions.at(-1);
      const chosen = project.versions.find((v) => v.id === selectedVersion) || latest;
      const output = chosen?.text || '';
      const check = WB.validateScript(output, chosen?.mode || project.mode);
      async function submitTask(phase = 'full', instruction = '', repairCount = 0, override) {
        if (busy) return;
        const p = override || projectRef.current;
        if (p.pending && !override) { setNotice('项目已有任务运行，完成后再提交。'); return; }
        if (!['revision', 'audit'].includes(phase) && p.mode === 'live' && !p.topic.trim() && !p.brief.conflict.trim()) { setNotice('请填写主题或本集冲突。'); return; }
        if (!['revision', 'audit'].includes(phase) && ['live-opt', 'duan-adapt'].includes(p.mode) && !p.draft.trim() && !files.length) { setNotice('请粘贴原稿或导入文件。'); return; }
        if (!['revision', 'audit'].includes(phase) && p.mode === 'duan-ba' && !p.videoPath.trim() && !files.length && !p.videoEvidence.trim()) { setNotice('请导入视频、填写本地路径或提供带时间段的证据资料。'); return; }
        const taskFiles = override ? [] : files;
        setBusy(true); setNotice('准备任务…');
        let target = p.sessionId;
        try {
          if (!target) target = await ctx.sessions.create({});
          const parts = [];
          for (const file of taskFiles) {
            setNotice('上传 ' + file.name + '…');
            const receipt = await ctx.fileUpload.upload(target, file, file.name, undefined, (progress) => {
              if (mounted.current) setNotice('上传 ' + file.name + (progress.total ? ' ' + Math.round(progress.loaded / progress.total * 100) + '%' : '…'));
            });
            if (!receipt.ok) throw receipt.error;
            parts.push({ type: 'file', receiptId: receipt.value.receiptId });
          }
          const taskId = uid();
          const scriptVersion = [...p.versions].reverse().find((v) => !['outline','audit'].includes(v.phase));
          const source = ['revision', 'audit'].includes(phase) ? (override?.repairText || (chosen && !['outline','audit'].includes(chosen.phase) ? chosen.text : scriptVersion?.text) || p.draft) : p.draft;
          const brief = { ...p.brief, conflict: p.brief.conflict || p.topic };
          const prompt = WB.buildPrompt({ project: p, brief, phase, draft: source, instruction: [
            '主题：' + p.topic, '补充要求：' + p.notes, instruction,
            p.outline ? '已确认大纲：\n' + p.outline : '',
            p.videoPath ? '运行 DSH 的电脑本地视频路径：' + p.videoPath : '',
            p.videoEvidence ? '已记录视频证据（逐条标注时间段、画面/音轨来源和不确定项）：\n' + p.videoEvidence : '',
            p.fingerprint ? '本项目结构指纹：\n' + p.fingerprint : '',
            taskFiles.length ? '已附文件：' + taskFiles.map((file) => file.name).join('、') + '。先用实际可用工具读取，读取失败明确说明，不补造视频事实；需要音轨时请求转写或局部取证。' : '',
            '请把本阶段完整成品写在最终回复中，便于插件收集。不要只返回文件路径。',
          ].filter(Boolean).join('\n\n') });
          const rules = p.mode.startsWith('duan') ? SHORT_VIDEO_RULES : LIVE_RULES;
          const text = '[DSH_SCRIPT_TASK:' + taskId + ']\n[DSH_SCRIPT_PHASE:' + phase + ']\n' + rules + '\n\n' + prompt;
          const pending = { taskId, phase, repairCount, submittedAt: Date.now(), mode: p.mode };
          change({ sessionId: target, pending }, p.id);
          const reference = ctx.sessions.retain(target, { source: 'controllerOperation' });
          try {
            const binding = await reference.ready;
            const result = await binding.session.prompt([{ type: 'text', text }, ...parts], 'queue', undefined, taskId);
            if (!result.ok) throw result.error;
          } finally { reference.release(); }
          if (!override && taskFiles.length) setFiles([]);
          setTab('result'); setSelectedVersion(''); setNotice('任务已提交，结果将在本面板显示。');
        } catch (error) { change({ pending: null }, p.id); setNotice('提交失败：' + error.message); }
        finally { setBusy(false); }
      }
      useEffect(() => {
        if (!live?.done || !live.taskId || completedRef.current.has(live.taskId)) return;
        const owner = storeRef.current.projects.find((item) => item.pending?.taskId === live.taskId);
        if (!owner) return;
        const p = owner;
        completedRef.current.add(live.taskId);
        if (live.error || !live.text.trim()) {
          change({ pending: null }, p.id); setNotice('任务未生成完整成品：' + (live.error || '结果为空')); return;
        }
        const phase = p.pending.phase;
        const taskMode = p.pending.mode || p.mode;
        const version = { id: uid(), text: live.text, phase, createdAt: new Date().toISOString(), taskId: live.taskId, mode: taskMode };
        const versions = [...p.versions, version];
        change({ versions, pending: null }, p.id); setSelectedVersion(version.id);
        if (phase === 'outline' || phase === 'audit') { setNotice(phase === 'outline' ? '大纲已生成，确认后可继续生成正文。' : 'AI 审稿已完成，请核对审稿意见。'); return; }
        const issues = WB.validateScript(live.text, taskMode).issues;
        if (p.autoRepair && p.pending.repairCount < 1 && issues.length) {
          setNotice('发现 ' + issues.length + ' 项格式或连续性问题，等待定向返修一次…');
          setRepairQueue({ project: { ...p, mode: taskMode, versions, pending: null, repairText: live.text },
            instruction: '只修复下列明确问题，保留已正确部分与锁定事实：\n' + issues.map((issue) => issue.message).join('\n') });
        } else setNotice(issues.length ? '正文已保存，仍有 ' + issues.length + ' 项待核对问题。' : '正文已保存，程序检查通过；事实和剧情质量仍需人工确认。');
      }, [live]);
      useEffect(() => {
        if (!repairQueue || busy) return;
        const task = repairQueue;
        setRepairQueue(null);
        void submitTask('revision', task.instruction, 1, task.project);
      }, [repairQueue, busy]);
      async function importFiles(list) {
        const picked = Array.from(list || []);
        const importProjectId = project.id;
        const importMode = project.mode;
        try {
          const binary = [];
          for (const file of picked) {
            if (/\.(txt|md|srt|vtt)$/i.test(file.name)) {
              if (file.size > 5 * 1024 * 1024) throw Error('文本文件超过 5MB');
              const text = await file.text();
              if (importMode === 'duan-ba') change({ videoEvidence: text }, importProjectId); else change({ draft: text }, importProjectId);
              setNotice('已读取 ' + file.name);
            } else if (/\.docx$/i.test(file.name)) {
              const text = await IO.readDocxText(await file.arrayBuffer(), async (bytes) => {
                const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
                return new Uint8Array(await new Response(stream).arrayBuffer());
              });
              change({ draft: text }, importProjectId); setNotice('已读取 Word 正文：' + file.name);
            } else {
              if (file.size > 250 * 1024 * 1024) throw Error('单个文件超过 250MB，请使用本地路径或较短片段。');
              binary.push(file);
            }
          }
          if (binary.length && projectRef.current.id !== importProjectId) { setNotice('项目已切换，文本已导入原项目；待上传文件请回到原项目重新选择。'); return; }
          if (binary.length) { setFiles((previous) => [...previous, ...binary]); setNotice('文件已选择，提交时上传；刷新前请先提交，文件本体不保存在草稿中。'); }
        } catch (error) { setNotice('导入失败：' + error.message); }
      }
      function addProject() {
        const p = blankProject();
        setStore((current) => ({ ...current, projects: [...current.projects, p], activeId: p.id })); setTab('create');
      }
      function updateItem(collection, id, patch) { change({ [collection]: project[collection].map((item) => item.id === id ? { ...item, ...patch } : item) }); }
      async function importBackup(event) {
        try {
          const file = event.target.files[0]; if (!file) return;
          const result = WB.importBackup(await file.text()); if (!result.ok) throw Error(result.error);
          const p = { ...hydrateProject(result.project), id: uid(), pending: null, sessionId: '' };
          setStore((current) => ({ ...current, blocked: false, projects: [...current.projects, p], activeId: p.id }));
          setNotice('项目备份已导入；会话重新创建，资料和版本已恢复。');
        } catch (error) { setNotice('备份导入失败：' + error.message); }
      }
      function creativeForm() {
        return h('div', null,
          h('div', { style: card },
            h('h2', { style: { fontSize: 17, marginTop: 0 } }, '创作资料'),
            h(Field, { label: '主题 / 本集任务', value: project.topic, onChange: (topic) => { change({ topic }); setConfirmed(false); }, placeholder: '谁遇到什么问题，这集要解决什么？' }),
            h('label', null, '创作模式', h('select', { style: input, value: project.mode, onChange: (e) => { change({ mode: e.target.value }); setConfirmed(false); } }, Object.entries(modeLabels).map(([id, label]) => h('option', { key: id, value: id }, label)))),
            ['live-opt', 'duan-adapt'].includes(project.mode) ? h(Field, { label: '原稿 / 母版（也可拖入 TXT、Markdown、Word）', value: project.draft, rows: 9, onChange: (draft) => change({ draft }) }) : null,
            project.mode === 'duan-ba' ? h('div', null,
              h(Field, { label: '视频本地路径（也可直接选择视频）', value: project.videoPath, onChange: (videoPath) => change({ videoPath }) }),
              h(Field, { label: '字幕 / 时间轴证据 / 待复核事实', value: project.videoEvidence, rows: 5, onChange: (videoEvidence) => change({ videoEvidence }), placeholder: '标注时间段、画面/音轨依据、不确定的人名金额等；不要把猜测记为已确认。' }),
            ) : null,
            h('div', { onDragOver: (e) => e.preventDefault(), onDrop: (e) => { e.preventDefault(); void importFiles(e.dataTransfer.files); }, style: { border: '1px dashed ' + T.border, padding: 14, borderRadius: 8 } },
              h('label', { style: { display: 'block' } }, '拖入素材或选择文件：', h('input', { type: 'file', multiple: true, accept: '.txt,.md,.docx,.srt,.vtt,.mp4,.mov,.mkv,.webm,.wav,.mp3', onChange: (e) => void importFiles(e.target.files), style: { display: 'block', marginTop: 8, maxWidth: '100%' } })),
              files.map((file, i) => h('div', { key: i, style: row }, file.name, h(Button, { onClick: () => setFiles((old) => old.filter((_, index) => index !== i)) }, '移除'))),
            ),
            h(Field, { label: '补充要求 / 活动信息（选填）', value: project.notes, rows: 3, onChange: (notes) => change({ notes }) }),
          ),
          h('details', { style: card, open: true }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, '创作要点与保护项'),
            ...[['relationship', '核心人物关系'], ['conflict', '这一次具体争什么'], ['goals', '各方分别想得到什么'], ['ending', '结尾方向'], ['lockedFacts', '必须保留的事实与情节'], ['protectedLines', '必须原样保留的台词']].map(([key, label]) => h(Field, { key, label, value: project.brief[key], rows: key === 'lockedFacts' || key === 'protectedLines' ? 3 : undefined, onChange: (value) => changeBrief(key, value) })),
            h('label', null, '优化力度', h('select', { value: project.intensity, style: input, onChange: (e) => change({ intensity: e.target.value }) },
              h('option', { value: 'light' }, '轻度润色：保留情节和顺序'), h('option', { value: 'structure' }, '结构优化：保留人物事实与结局'), h('option', { value: 'deep' }, '深度重写：允许重构，解释变化'))),
            h(Field, { label: '结构指纹（改编项目可保存并复用）', value: project.fingerprint, rows: 4, onChange: (fingerprint) => change({ fingerprint }) }),
          ),
          h('div', { style: card }, h('strong', null, '创作确认卡'),
            h('p', { style: { whiteSpace: 'pre-wrap', lineHeight: 1.7 } }, [project.topic || '主题待补充', '关系：' + (project.brief.relationship || '根据人物卡'), '冲突：' + (project.brief.conflict || project.topic || '待补充'), '结尾：' + (project.brief.ending || '按剧情发展'), '保护项：' + (project.brief.lockedFacts || '无额外锁定')].join('\n')),
            h('label', null, h('input', { type: 'checkbox', checked: confirmed, onChange: (e) => setConfirmed(e.target.checked) }), ' 我已核对创作要点（也可直接一键生成）'),
            h('label', { style: { display: 'block', margin: '10px 0' } }, h('input', { type: 'checkbox', checked: project.autoRepair, onChange: (e) => change({ autoRepair: e.target.checked }) }), ' 生成后程序检查，发现问题自动定向返修一次'),
            h('div', { style: row }, h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask('outline') }, '先生成大纲'), h(Button, { primary: true, disabled: busy || !!project.pending, onClick: () => submitTask('full') }, confirmed ? '按确认卡生成全文' : '一键生成全文')),
          ),
          h('details', { style: card }, h('summary', { style: { cursor: 'pointer' } }, '高级选项：关联会话'),
            h('select', { style: input, value: project.sessionId, onChange: (e) => change({ sessionId: e.target.value }), disabled: !!project.pending },
              h('option', { value: '' }, '自动为项目新建会话'), ...sessions.map((session) => h('option', { key: session.id, value: session.id }, session.title || session.displayTitle || '未命名会话'))),
            project.sessionId ? h(Button, { onClick: () => ctx.uiWorkspace.openSession(project.sessionId) }, '打开关联对话') : null,
          ),
        );
      }
      function libraryView() {
        return h('div', null,
          h('div', { style: card }, h('h2', { style: { fontSize: 17 } }, '人物卡'),
            h('p', { style: { color: T.muted, fontSize: 13 } }, '由你确认的人物资料会随项目复用；不自动把 AI 临时补出的设定记为事实。'),
            ...project.characters.map((person) => h('details', { key: person.id, style: { ...card, background: T.layer2 }, open: true }, h('summary', null, person.name || '新人物'),
              ...[['name', '姓名 / 称呼'], ['relationship', '身份与关系'], ['goal', '当场诉求和顾虑'], ['knowledge', '知道什么 / 不知道什么'], ['voice', '说话习惯'], ['state', '已发生事情与当前态度']].map(([key, label]) => h(Field, { key, label, value: person[key] || '', onChange: (value) => updateItem('characters', person.id, { [key]: value }) })),
              h(Button, { onClick: () => change({ characters: project.characters.filter((item) => item.id !== person.id) }) }, '移除此人物'))),
            h(Button, { onClick: () => change({ characters: [...project.characters, { id: uid(), name: '', relationship: '', goal: '', knowledge: '', voice: '', state: '' }] }) }, '添加人物卡'),
          ),
          h('div', { style: card }, h('h2', { style: { fontSize: 17 } }, '优秀样稿库'),
            h('p', { style: { color: T.muted, fontSize: 13 } }, '只勾选最相关的少量样稿。记录优点和反例，借鉴结构口吻，不照搬样稿事实。'),
            ...project.samples.map((sample) => h('details', { key: sample.id, style: card }, h('summary', null, sample.title || '新样稿'),
              h('label', null, h('input', { type: 'checkbox', checked: project.selectedSampleIds.includes(sample.id), onChange: (e) => change({ selectedSampleIds: e.target.checked ? [...project.selectedSampleIds, sample.id] : project.selectedSampleIds.filter((id) => id !== sample.id) }) }), ' 用于当前创作'),
              h(Field, { label: '样稿名称', value: sample.title || '', onChange: (title) => updateItem('samples', sample.id, { title }) }),
              h('select', { value: sample.mode || 'live', style: input, onChange: (e) => updateItem('samples', sample.id, { mode: e.target.value }) }, ...Object.entries(modeLabels).map(([key, label]) => h('option', { key, value: key }, label))),
              h(Field, { label: '样稿正文', value: sample.text, rows: 8, onChange: (text) => updateItem('samples', sample.id, { text }) }),
              h(Field, { label: '优点 / 不要模仿的表达', value: sample.notes || '', rows: 3, onChange: (notes) => updateItem('samples', sample.id, { notes }) }),
              h(Button, { onClick: () => change({ samples: project.samples.filter((item) => item.id !== sample.id), selectedSampleIds: project.selectedSampleIds.filter((id) => id !== sample.id) }) }, '移除此样稿'))),
            h(Button, { onClick: () => change({ samples: [...project.samples, { id: uid(), title: '', mode: project.mode, text: '', notes: '' }] }) }, '添加样稿'),
            output ? h(Button, { onClick: () => { change({ samples: [...project.samples, { id: uid(), title: project.title + ' 已确认成稿', mode: project.mode, text: output, notes: '' }] }); setNotice('已加入样稿库，请标注优点并勾选后使用。'); } }, '将当前成稿收入样稿库') : null,
          ),
        );
      }
      function resultView() {
        const before = project.versions.find((v) => v.id === compareId);
        const diff = before && output ? WB.compareVersions(before.text, output) : null;
        const activeText = project.pending && live?.taskId === project.pending.taskId ? live.text : '';
        return h('div', null,
          h('div', { style: card }, h('h2', { style: { fontSize: 17 } }, '生成结果与版本'),
            project.pending ? h('p', { role: 'status' }, '任务运行中：' + project.pending.phase + '。可离开面板，返回后继续接收结果。') : null,
            project.pending ? h('div', { style: row }, h(Button, { onClick: () => ctx.uiWorkspace.openSession(project.sessionId) }, '查看生成详情'), h(Button, { onClick: async () => {
              const stoppingId = project.id, stoppingTask = project.pending?.taskId;
              try { await ctx.sessions.using(project.sessionId, { source: 'controllerOperation' }, async (reference) => { const result = await reference.binding.session.cancel(); if (!result.ok) throw result.error; });
                setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === stoppingId && item.pending?.taskId === stoppingTask ? { ...item, pending: null } : item) }));
              } catch (error) { setNotice(error.message); }
            } }, '停止生成')) : null,
            project.versions.length ? h('select', { style: input, value: chosen?.id || '', onChange: (e) => setSelectedVersion(e.target.value) }, ...project.versions.map((v, i) => h('option', { key: v.id, value: v.id }, 'v' + (i + 1) + ' · ' + ({full:'全文',outline:'大纲',revision:'修订',audit:'审稿',manual:'手动编辑'})[v.phase] + ' · ' + new Date(v.createdAt).toLocaleString()))) : null,
            h('pre', { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.9, minHeight: 140, maxHeight: 650, overflow: 'auto', padding: 12, background: T.layer2, borderRadius: 8 } }, activeText || output || '尚无结果。请先创作，或导入原稿后检查。'),
            output ? h('div', { style: row },
              h(Button, { onClick: async () => { try { await navigator.clipboard.writeText(output); setNotice('全文已复制'); } catch { setNotice('复制失败，请选中正文复制。'); } } }, '复制全文'),
              ...['md','txt','docx'].map((ext) => h(Button, { key: ext, onClick: () => download(project.title + '.' + ext, ext === 'docx' ? IO.buildDocxBytes(output) : output, ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain;charset=utf-8') }, '下载 ' + ext.toUpperCase())),
              h(Button, { onClick: () => { change({ draft: output }); setTab('create'); setNotice('当前版本已作为创作原稿，历史版本保留。'); } }, '作为下一版原稿'),
              chosen.phase === 'outline' ? h(Button, { primary: true, onClick: () => { change({ outline: output }); setTab('create'); setNotice('大纲已确认保存，回到创作区生成全文。'); } }, '确认此大纲') : null,
            ) : null,
            !output && project.draft ? h(Button, { onClick: () => change({ versions: [...project.versions, { id: uid(), text: project.draft, phase: 'manual', mode: project.mode, createdAt: new Date().toISOString() }] }) }, '将导入原稿放入结果区') : null,
          ),
          output ? h('div', { style: card }, h('h3', null, '检查与定向返修'),
            h('p', { style: { color: T.muted, fontSize: 13 } }, '程序核对格式、字数、时长与部分连续性；AI 审稿评估动机和因果。两者均不替代原始证据核实。'),
            chosen.phase === 'outline' || chosen.phase === 'audit' ? h('p', null, '当前为大纲或审稿报告，不按完整剧本格式判定。') : h('div', null,
              h('strong', null, check.ok ? '程序检查通过' : '发现 ' + check.issues.length + ' 项待检查问题'),
              h('ul', null, ...check.issues.map((issue, i) => h('li', { key: i }, (issue.segment ? '第' + issue.segment + '段：' : '') + issue.message))),
            ),
            h(Field, { label: '修改要求（只改指定部分）', value: revision, rows: 3, onChange: setRevision }),
            h('div', { style: row }, ...['对白更自然','压缩时长但保留核心因果','加强话轮交接','只改结尾','保留正确部分，修复程序发现的问题'].map((text) => h(Button, { key: text, disabled: busy || !!project.pending, onClick: () => submitTask('revision', text + '\n' + (text.includes('程序') ? check.issues.map((issue) => issue.message).join('\n') : '')) }, text))),
            h('div', { style: { ...row, marginTop: 10 } }, h(Button, { primary: true, disabled: busy || !!project.pending, onClick: () => submitTask('revision', revision) }, '按要求返修'), h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask('audit', '检查角色动机、因果、对白、情绪兑现和证据边界；指出具体位置和依据。') }, 'AI 审稿')),
            h('details', { style: { marginTop: 16 } }, h('summary', null, '直接编辑当前稿并保存新版本'), h(Field, { label: '可编辑稿', value: project.editBuffers?.[chosen.id] ?? output, rows: 12, onChange: (text) => change({ editBuffers: { ...project.editBuffers, [chosen.id]: text } }) }), h(Button, { onClick: () => {
              const version = { id: uid(), text: project.editBuffers?.[chosen.id] ?? output, phase: 'manual', mode: chosen.mode || project.mode, createdAt: new Date().toISOString() };
              change({ versions: [...project.versions, version], editText: null }); setSelectedVersion(version.id);
            } }, '保存为新版本')),
          ) : null,
          project.versions.length > 1 ? h('div', { style: card }, h('h3', null, '版本对照'),
            h('select', { style: input, value: compareId, onChange: (e) => setCompareId(e.target.value) }, h('option', { value: '' }, '选择要比较的旧版本'), ...project.versions.filter((v) => v.id !== chosen?.id).map((v, i) => h('option', { key: v.id, value: v.id }, '版本 ' + (project.versions.indexOf(v) + 1) + ' · ' + v.phase))),
            diff ? h('div', null, h('p', null, typeof diff.summary === 'string' ? diff.summary : JSON.stringify(diff.summary)), h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 } },
              h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 450, overflow: 'auto', fontFamily: 'inherit' } }, before.text),
              h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 450, overflow: 'auto', fontFamily: 'inherit' } }, output))) : null,
          ) : null,
        );
      }
      return h('div', { style: { boxSizing: 'border-box', height: '100%', overflowY: 'auto', maxWidth: 1100, margin: '0 auto', padding: '24px 24px 48px', color: T.text, fontSize: 14 } },
        h('h1', { style: { margin: '0 0 8px', fontSize: 24 } }, '剧本工具'),
        h('p', { style: { color: T.muted } }, '项目资料 → 创作确认 → 生成 → 检查返修 → 成稿版本'),
        update?.available && dismissed !== update.latest ? h('section', { role: 'status', style: { ...card, borderColor: T.brand } }, h('strong', null, '发现新版 v' + update.latest),
          h('details', null, h('summary', null, '更新说明'), h('pre', { style: { whiteSpace: 'pre-wrap' } }, update.notes)),
          h('div', { style: row }, h('a', { href: update.url, target: '_blank', rel: 'noopener noreferrer', style: { color: T.brand } }, '查看并下载更新'), h(Button, { onClick: () => setDismissed(update.latest) }, '稍后再说'))) : null,
        h('div', { style: card }, h('div', { style: row },
          h('label', null, '当前项目 ', h('select', { value: project.id, style: { ...input, width: 'auto', maxWidth: '100%', marginBottom: 0 }, onChange: (e) => setStore((current) => ({ ...current, activeId: e.target.value })) }, ...store.projects.map((p) => h('option', { key: p.id, value: p.id }, p.title)))),
          h(Button, { onClick: addProject }, '新建项目'), h(Button, { onClick: () => download(project.title + '-项目备份.json', WB.exportBackup(project), 'application/json') }, '备份项目'),
          h('label', null, '导入备份 ', h('input', { type: 'file', accept: '.json', onChange: importBackup, style: { maxWidth: 210 } }))),
          h(Field, { label: '项目名称', value: project.title, onChange: (title) => change({ title }) }),
          h('small', { role: 'status', style: { color: T.muted } }, saveStatus || store.error || '正在读取草稿…'),
          store.conflict ? h(Button, { onClick: () => {
            const disk = loadCatalog();
            if (disk.blocked) { setNotice(disk.error); return; }
            const copies = store.projects.map((item) => ({ ...item, id: uid(), title: item.title + '（本页副本）' }));
            const selected = copies[store.projects.findIndex((item) => item.id === project.id)] || copies[0];
            revisionRef.current = disk.revision || 0;
            setStore({ projects: [...disk.projects, ...copies], activeId: selected.id, blocked: false, conflict: false });
            setNotice('已保留其他标签页的项目，并将本页内容另存为副本。');
          } }, '保留双方项目并合并副本') : store.blocked ? h(Button, { onClick: () => {
            try { const raw = localStorage.getItem(catalogKey); if (raw) localStorage.setItem(catalogKey + '.corrupt.' + Date.now(), raw); localStorage.removeItem(catalogKey); revisionRef.current = 0; setStore((s) => ({ ...s, blocked: false })); } catch (error) { setNotice(error.message); }
          } }, '备份损坏存档并保存当前项目') : null,
        ),
        notice ? h('div', { role: 'status', style: { ...card, borderColor: T.brand } }, notice) : null,
        h('nav', { 'aria-label': '剧本工作区', style: { ...row, marginBottom: 16 } }, ...[['create','创作'],['library','人物与样稿'],['result','结果与版本']].map(([key,label]) => h(Button, { key, primary: tab === key, onClick: () => setTab(key) }, label))),
        tab === 'result' ? resultView() : h('fieldset', { disabled: busy || !!project.pending || !!repairQueue, style: { border: 0, padding: 0, margin: 0, minWidth: 0 } }, tab === 'create' ? creativeForm() : libraryView()),
        h('div', { style: card }, h('div', { style: row }, h('span', null, '当前版本 v' + CURRENT_VERSION), h(Button, { disabled: checking, onClick: checkUpdate }, checking ? '检查中…' : '检查更新')),
          h('small', { style: { color: T.muted } }, '打开面板自动检查，保持打开时每30分钟重查。由你决定是否更新。'),
          updateError ? h('p', { role: 'alert', style: { color: T.error } }, updateError) : null,
          update && !update.available ? h('p', null, '已检查：当前无可用的新正式版本。') : null),
      );
    }
    function Icon({ size = 20 }) { return h('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': true }, h('rect', { x: 4, y: 2, width: 16, height: 20, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }), ...[7,12,17].map((y) => h('path', { key: y, d: 'M8 ' + y + 'h8', stroke: 'currentColor', strokeWidth: 1.6 }))); }
    return {
      inject: ['slots','sessions','uiWorkspace','fileUpload','remote','remote.session'],
      apply(ctx) {
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name:'sidebar.panellist', id:'elderly-script', order:20, label:'剧本工具' }, Icon));
        ctx.slots.inject('main', () => ctx.slots.register({ name:'main', key:'elderly-script' }, () => h(MainPanel, { ctx })));
      },
    };
  },
});
