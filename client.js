window.__ModuleLoader__.load({
  id: '@local/elderly-script',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    const T = {
      bg: 'var(--dsw-alias-bg-base)',
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      border1: 'var(--dsw-alias-border-l1)',
      border2: 'var(--dsw-alias-border-l2)',
      brand: 'var(--dsw-alias-brand-primary)',
      label1: 'var(--dsw-alias-label-primary)',
      label2: 'var(--dsw-alias-label-secondary)',
      err: 'var(--dsw-alias-state-error-primary)',
      ok: 'var(--dsw-alias-state-success-primary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
    };

    function PanelIcon(props) {
      const s = props && props.size ? props.size : 20;
      return h('svg', {
        viewBox: '0 0 64 64', width: s, height: s, 'aria-hidden': true,
        style: { display: 'block' },
      },
        h('rect', { x: 4, y: 10, width: 56, height: 44, rx: 10, fill: '#247bbf' }),
        h('rect', { x: 12, y: 20, width: 40, height: 6, rx: 3, fill: '#ffffff' }),
        h('rect', { x: 12, y: 32, width: 30, height: 6, rx: 3, fill: '#ffffff' }),
        h('rect', { x: 12, y: 44, width: 22, height: 6, rx: 3, fill: '#9fd0f5' }),
        h('circle', { cx: 40, cy: 53, r: 9, fill: '#0f5b96' }),
        h('path', { d: 'M36 53h8M40 49v8', stroke: '#ffffff', strokeWidth: 2.4, strokeLinecap: 'round' }),
      );
    }

    const labelStyle = {
      display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.label1,
    };
    const inputStyle = {
      width: '100%', boxSizing: 'border-box', padding: '9px 11px', fontSize: 14,
      borderRadius: 8, border: '1px solid ' + T.border2, background: T.layer2, color: T.label1,
      outline: 'none',
    };
    const cardStyle = {
      background: T.layer1, border: '1px solid ' + T.border1, borderRadius: 12,
      padding: 16, marginBottom: 14,
    };
    const fieldStyle = { marginBottom: 14 };

    const buttonPrimary = {
      width: '100%', padding: '12px 16px', fontSize: 15, fontWeight: 700,
      borderRadius: 10, border: '1px solid ' + T.brand, background: T.brand, color: '#ffffff',
      cursor: 'pointer',
    };

    function MainPanel({ pluginCtx }) {
      const [mode, setMode] = useState('write');
      const [topic, setTopic] = useState('');
      const [roles, setRoles] = useState('主播：李姐；一麦：张姨；二麦：王叔');
      const [product, setProduct] = useState('');
      const [draft, setDraft] = useState('');
      const [optimizeNote, setOptimizeNote] = useState('');
      const [sessions, setSessions] = useState([]);
      const [targetSession, setTargetSession] = useState('');
      const [useNew, setUseNew] = useState(true);
      const [busy, setBusy] = useState(false);
      const [notice, setNotice] = useState(null);

      useEffect(() => {
        let alive = true;
        async function load() {
          try {
            const res = await pluginCtx.remote.session.list({});
            if (!res.ok) throw res.error;
            const items = (res.value && res.value.items) || [];
            if (!alive) return;
            setSessions(items);
            const first = items.find((s) => !s.blank) || items[0];
            if (first) {
              setTargetSession(first.sessionId);
              setUseNew(false);
            } else {
              setUseNew(true);
            }
          } catch (e) {
            if (alive) {
              setNotice({ kind: 'err', text: '读取会话列表失败：' + (e && e.message ? e.message : String(e)) });
            }
          }
        }
        load();
        return () => { alive = false; };
      }, []);

      function buildPrompt() {
        if (mode === 'write') {
          return [
            '请调用 elderly-livestream-script skill，按其中「老年观众直播间剧本」规范创作一个直播间连麦剧本。',
            '',
            '主题：' + topic.trim(),
            '角色设定：' + (roles.trim() || '主播：李姐；一麦：张姨；二麦：王叔'),
            '商品/活动信息：' + (product.trim() || '无'),
            '',
            '要求：线下主播 + 线上连麦一麦、二麦；全篇只写【角色名】和纯对白，不写任何动作、神态或舞台提示；每段正式台词不少于200字；话轮交接必须点名、称呼、复述对方观点或直接接话；语言通俗直白、关键信息换说法重复；剧情围绕孝道与家庭伦理展开。',
            '直接输出完整剧本，不要解释。',
          ].join('\n');
        }
        return [
          '请调用 elderly-livestream-script skill，按其中「老年观众直播间剧本」规范优化下面这段直播间剧本。',
          '',
          '优化要求：' + (optimizeNote.trim() || '按规范全面优化：补足每段不少于200字的长对白、显式话轮交接、口语化、主题聚焦孝道家庭伦理、删除一切动作描写。'),
          '',
          '原剧本：',
          draft,
          '',
          '直接输出优化后的完整剧本，不要解释。',
        ].join('\n');
      }

      async function submit() {
        if (busy) return;
        if (mode === 'write' && !topic.trim()) {
          setNotice({ kind: 'err', text: '请先填写剧本主题。' });
          return;
        }
        if (mode === 'optimize' && !draft.trim()) {
          setNotice({ kind: 'err', text: '请先粘贴需要优化的剧本。' });
          return;
        }
        setBusy(true);
        setNotice({ kind: 'info', text: '正在提交任务…' });
        try {
          let sessionId = targetSession;
          if (useNew || !sessionId) {
            const created = await pluginCtx.remote.session.create({});
            if (!created.ok) throw created.error;
            sessionId = created.value && created.value.sessionId;
            if (!sessionId) throw new Error('会话创建失败');
          }
          const requestId = 'elderly-script-' + Date.now();
          const text = buildPrompt();
          const admitted = await pluginCtx.remote.session.prompt({
            requestId,
            sessionId,
            mode: 'queue',
            content: [{ type: 'text', text }],
            clientTimeZone:
              typeof Intl !== 'undefined' && Intl.DateTimeFormat
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : undefined,
          });
          if (!admitted.ok) throw admitted.error;
          setNotice({ kind: 'ok', text: '任务已发送，正在对话面板生成结果…' });
          if (pluginCtx.layout && typeof pluginCtx.layout.selectPanel === 'function') {
            pluginCtx.layout.selectPanel('conversation');
          }
        } catch (e) {
          setNotice({ kind: 'err', text: '提交失败：' + (e && e.message ? e.message : String(e)) });
        } finally {
          setBusy(false);
        }
      }

      function modeButton(id, label) {
        const active = mode === id;
        return h('button', {
          key: id,
          onClick: () => setMode(id),
          style: {
            flex: 1, padding: '10px 12px', fontSize: 14, fontWeight: 600,
            borderRadius: 10, cursor: 'pointer',
            border: '1px solid ' + (active ? T.brand : T.border2),
            background: active ? T.brand : T.layer1,
            color: active ? '#ffffff' : T.label1,
          },
        }, label);
      }

      function writeForm() {
        return h('div', { style: cardStyle },
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '剧本主题 *'),
            h('input', {
              value: topic, onChange: (e) => setTopic(e.target.value), style: inputStyle,
              placeholder: '例如：子女在外工作，爸妈总盼着一家人吃顿团圆饭',
            }),
          ),
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '角色设定'),
            h('input', {
              value: roles, onChange: (e) => setRoles(e.target.value), style: inputStyle,
              placeholder: '主播：李姐；一麦：张姨；二麦：王叔',
            }),
          ),
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '商品 / 活动信息（没有就留空）'),
            h('textarea', {
              value: product, onChange: (e) => setProduct(e.target.value),
              rows: 3, style: inputStyle,
              placeholder: '例如：今晚八点开播的孝心礼盒，两盒立减30元',
            }),
          ),
        );
      }

      function optimizeForm() {
        return h('div', { style: cardStyle },
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '粘贴原剧本 *'),
            h('textarea', {
              value: draft, onChange: (e) => setDraft(e.target.value),
              rows: 12, style: inputStyle,
              placeholder: '把写好的剧本整段粘贴到这里…',
            }),
          ),
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '优化要求（没有就留空）'),
            h('textarea', {
              value: optimizeNote, onChange: (e) => setOptimizeNote(e.target.value),
              rows: 3, style: inputStyle,
              placeholder: '例如：台词再长一点、多强调“常回家看看”、去掉生僻词',
            }),
          ),
        );
      }

      function sessionBox() {
        return h('div', { style: cardStyle },
          h('label', { style: labelStyle }, '发送到'),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
            h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: T.label1, cursor: 'pointer' } },
              h('input', {
                type: 'radio', checked: useNew,
                onChange: () => setUseNew(true),
              }),
              '新建一个会话（推荐）',
            ),
            h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: T.label1, cursor: 'pointer' } },
              h('input', {
                type: 'radio', checked: !useNew,
                onChange: () => setUseNew(false),
                disabled: sessions.length === 0,
              }),
              '发到已有会话：',
            ),
            h('select', {
              value: targetSession,
              onChange: (e) => setTargetSession(e.target.value),
              disabled: useNew || sessions.length === 0,
              style: inputStyle,
            },
              sessions.map((s) =>
                h('option', { key: s.sessionId, value: s.sessionId },
                  (s.blank ? '（空白会话）' : '') + s.sessionId + (s.running ? '（运行中）' : '')),
              ),
            ),
          ),
        );
      }

      return h('div', { style: { maxWidth: 760, margin: '0 auto', padding: 28, color: T.label1 } },
        h('h1', { style: { margin: '0 0 6px', fontSize: 22, fontWeight: 700 } }, '老年直播间剧本工具'),
        h('p', { style: { margin: '0 0 20px', color: T.label2, fontSize: 13, lineHeight: 1.6 } },
          '为 60 岁以上观众写连麦剧本、优化剧本。填好信息点一下按钮，剩下的交给 AI。'),
        h('div', { style: { display: 'flex', gap: 8, marginBottom: 18 } },
          modeButton('write', '写新剧本'),
          modeButton('optimize', '优化已有剧本'),
        ),
        mode === 'write' ? writeForm() : optimizeForm(),
        sessionBox(),
        h('button', {
          onClick: submit, disabled: busy,
          style: {
            ...buttonPrimary,
            ...(busy ? { opacity: 0.6, cursor: 'default' } : {}),
          },
        }, busy ? '提交中…' : (mode === 'write' ? '生成剧本' : '开始优化')),
        notice
          ? h('div', {
              style: {
                marginTop: 14, padding: '10px 12px', borderRadius: 8, fontSize: 13, lineHeight: 1.5,
                background: T.layer1,
                border: '1px solid ' + (notice.kind === 'ok' ? T.ok : notice.kind === 'err' ? T.err : T.border1),
                color: notice.kind === 'err' ? T.err : T.label1,
              },
            }, notice.text)
          : null,
      );
    }

    return {
      inject: ['slots', 'layout', 'remote', 'remote.session'],
      apply(ctx) {
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'elderly-script', order: 20, label: '老年剧本' },
            PanelIcon,
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: 'elderly-script' },
            (props) => h(MainPanel, { ...props, pluginCtx: ctx }),
          ),
        );
      },
    };
  },
});
