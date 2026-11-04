window.__ModuleLoader__.load({
  id: "@local/elderly-script",
  factory(require) {
    const React = require("react");
    const h = React.createElement;
    const { useState, useEffect, useRef } = React;
    /* WORKBENCH_CORE */
    /* WORKBENCH_MODEL */
    /* WORKBENCH_ANALYSIS */
    /* UPDATE_INSTALL */
    /* HUMANIZE_CORE */
    /* WORKBENCH_CSS */
    /* IO_CORE */
    /* UPDATE_CORE */
    /* SCRIPT_RULES */
    /* HUMANIZE_RULES */
    const T = {
      bg: "var(--dsw-alias-bg-base)",
      layer1: "var(--dsw-alias-bg-layer-1)",
      layer2: "var(--dsw-alias-bg-layer-2)",
      border: "var(--dsw-alias-border-l2)",
      brand: "var(--dsw-alias-brand-primary)",
      text: "var(--dsw-alias-label-primary)",
      muted: "var(--dsw-alias-label-secondary)",
      error: "var(--dsw-alias-state-error-primary)"
    };
    const card = { padding: 18, marginBottom: 16, border: "1px solid " + T.border, borderRadius: 12, background: T.layer1 };
    const input = { width: "100%", boxSizing: "border-box", padding: "9px 11px", margin: "5px 0 12px", borderRadius: 8, border: "1px solid " + T.border, background: T.layer2, color: T.text, font: "inherit" };
    const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 9 };
    const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    const catalogKey = "dsh-script.projects.v2";
    const fontScaleKey = "dsh-script.fontScale.v1";
    const hintKey = "dsh-script.hint.v1";
    const onboardKey = "dsh-script.onboard.v1";
    const favoriteTagsKey = "dsh-script.favoriteTags.v1";
    const topicPresets = ["家庭情感", "退休生活", "怀旧故事", "生活知识", "防诈骗", "兴趣才艺", "旅行见闻", "邻里日常"];
    const stylePresets = ["幽默", "温暖", "纪实", "干货", "克制", "接地气"];
    function loadFavoriteTags() {
      try {
        const value = JSON.parse(localStorage.getItem(favoriteTagsKey) || "{}");
        return { themeTags: WB.normalizeTags(value?.themeTags), styleTags: WB.normalizeTags(value?.styleTags) };
      } catch {
        return { themeTags: [], styleTags: [] };
      }
    }
    const modeLabels = { live: "直播创作", "live-opt": "直播优化", "duan-ba": "视频扒片", "duan-adapt": "短视频改编" };
    function blankProject(title = "新剧本项目") {
      return WB.createProject({
        id: uid(),
        title,
        topic: "",
        notes: "",
        videoPath: "",
        sessionId: "",
        autoRepair: false,
        videoEvidence: "",
        fingerprint: "",
        outline: "",
        pending: null,
        retry: null,
        mode: "live",
        draft: "",
        deliverable: "script",
        persona: ""
      });
    }
    function hydrateProject(value) {
      const p = { ...blankProject(), ...value, creativeProfile: WB.resolveCreativeProfile(value) };
      for (const key of ["topic", "notes", "videoPath", "sessionId", "videoEvidence", "fingerprint", "outline", "persona"]) if (typeof p[key] !== "string") p[key] = "";
      p.brief = Object.fromEntries(Object.entries(p.brief).map(([key, entry]) => [key, Array.isArray(entry) ? entry.join("\n") : entry]));
      p.autoRepair = p.autoRepair === true;
      if (!["idea", "outline", "script"].includes(p.deliverable)) p.deliverable = "script";
      return WM.normalizeProject(p);
    }
    function loadCatalog() {
      try {
        const raw = localStorage.getItem(catalogKey);
        if (raw) {
          const value = JSON.parse(raw);
          if (!Array.isArray(value.projects) || !value.projects.length || value.projects.some((p) => !WB.validateProject(p).ok || typeof p.id !== "string")) throw Error("项目存档格式异常");
          return { ...value, projects: value.projects.map(hydrateProject), error: "" };
        }
        return { projects: [blankProject()], activeId: "", error: "" };
      } catch (error) {
        try {
          const recovery = JSON.parse(localStorage.getItem(catalogKey + ".recovery"));
          if (Array.isArray(recovery?.projects) && recovery.projects.length && recovery.projects.every((p) => WB.validateProject(p).ok && typeof p.id === "string")) {
            return { ...recovery, projects: recovery.projects.map(hydrateProject), error: "主存档异常，已恢复上一次有效副本。请检查后保存或导出备份。", blocked: true };
          }
        } catch {
        }
        return { projects: [blankProject()], activeId: "", error: "读取本机存档失败：" + error.message + "。可导入备份恢复；确认保存后才会替换原存档。", blocked: true };
      }
    }
    function download(name, content, type) {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    }
    function Button({ children, onClick, disabled, primary, ...props }) {
      return h("button", { type: "button", onClick, disabled, style: {
        font: "inherit",
        minHeight: 38,
        padding: "8px 13px",
        borderRadius: 8,
        border: "1px solid " + (primary ? T.brand : T.border),
        background: primary ? T.brand : T.layer2,
        color: primary ? "var(--dsw-alias-bg-base)" : T.text,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.55 : 1
      }, "data-primary": primary ? "true" : void 0, ...props }, children);
    }
    function Field({ label, value = "", onChange, rows, placeholder, ...props }) {
      return h(
        "label",
        { style: { display: "block", fontSize: ".93em" } },
        label,
        h(rows ? "textarea" : "input", { ...props, value, placeholder, rows, style: input, onChange: (event) => onChange(event.target.value) })
      );
    }
    function AudienceEditor({ value, onChange }) {
      const [draft, setDraft] = useState(value);
      useEffect(() => setDraft(value), [value]);
      return h(Field, {
        label: "目标受众",
        value: draft,
        maxLength: 200,
        onChange: setDraft,
        onBlur: () => {
          const next = draft.trim() || value;
          setDraft(next);
          if (next !== value) onChange(next);
        },
        placeholder: "例如：50岁以上中老年人，城市退休人群"
      });
    }
    function TagEditor({ label, field, tags, presets, favorites, onChange, onSave, onForget }) {
      const [draft, setDraft] = useState("");
      const [feedback, setFeedback] = useState("");
      const add = (value) => {
        const raw = value.split(/[,，、;；\n]+/).map((item) => item.trim()).filter(Boolean);
        if (!raw.length) return;
        const next = WB.normalizeTags([...tags, ...raw.filter((tag) => tag.length <= 40)]);
        const overflow = raw.some((tag) => tag.length > 40) || new Set([...tags, ...raw].map((tag) => tag.toLowerCase())).size > 12;
        const changed = next.length !== tags.length;
        setFeedback(overflow ? "每组最多12个标签，每个标签最多40字；超出部分未添加。" : changed ? "已添加 " + (next.length - tags.length) + " 个标签" : "该标签已选择，无需重复添加。");
        if (changed) onChange(next);
        if (!overflow) setDraft("");
      };
      const remove = (tag) => {
        onChange(tags.filter((item) => item !== tag));
        setFeedback("已移除：" + tag);
      };
      return h(
        "section",
        { className: "script-tag-editor", "aria-label": label },
        h("div", { className: "script-section-heading" }, h("strong", null, label), h("small", { className: "script-muted" }, tags.length + " / 12")),
        h(
          "div",
          { className: "script-tag-list" },
          ...tags.map((tag) => h("span", { key: tag, className: "script-tag-selected" }, h("span", null, tag), h(Button, { className: "script-tag-remove", "aria-label": "移除" + label + "：" + tag, title: "移除此标签", onClick: () => remove(tag) }, "×"))),
          !tags.length ? h("span", { className: "script-muted" }, "未设标签，按选题创作") : null
        ),
        h("div", { className: "script-tag-add" }, h("input", { "aria-label": "自定义" + label, "aria-describedby": field + "-feedback", value: draft, maxLength: 300, placeholder: "输入标签，回车添加", onChange: (event) => {
          setDraft(event.target.value);
          setFeedback("");
        }, onKeyDown: (event) => {
          if (event.key === "Enter" && !event.nativeEvent?.isComposing) {
            event.preventDefault();
            add(draft);
          }
        } }), h(Button, { "aria-label": "添加" + label, disabled: !draft.trim(), onClick: () => add(draft) }, "添加")),
        feedback ? h("small", { id: field + "-feedback", className: "script-tag-feedback", role: "status" }, feedback) : null,
        h("div", { className: "script-tag-list script-tag-recommendations" }, h("small", null, "推荐"), ...presets.map((tag) => h(Button, { key: tag, "aria-pressed": tags.includes(tag), onClick: () => tags.includes(tag) ? remove(tag) : add(tag) }, tag))),
        h(
          "details",
          { className: "script-tag-favorites" },
          h("summary", null, "我的常用" + label + "（当前浏览器）"),
          h(Button, { disabled: !tags.length, onClick: () => onSave(field, tags) }, "将已选" + label + "存为常用"),
          !favorites.length ? h("p", { className: "script-muted" }, "保存后可跨项目点选。") : null,
          h("div", { className: "script-tag-list" }, ...favorites.map((tag) => h("span", { key: tag, className: "script-tag-favorite" }, h(Button, { onClick: () => add(tag) }, tag), h(Button, { className: "script-tag-remove", "aria-label": "删除常用" + label + "：" + tag, onClick: () => onForget(field, tag) }, "×"))))
        )
      );
    }
    function MainPanel({ ctx }) {
      const [store, setStore] = useState(loadCatalog);
      const revisionRef = useRef(store.revision || 0);
      const [saveStatus, setSaveStatus] = useState("");
      const [notice, setNotice] = useState("");
      const [tab, setTab] = useState("create");
      const [sessions, setSessions] = useState([]);
      const [busy, setBusy] = useState(false);
      const [repairQueue, setRepairQueue] = useState([]);
      const busyRef = useRef(false);
      const [projections, setProjections] = useState({});
      const [importPreview, setImportPreview] = useState(null);
      const [importStrategy, setImportStrategy] = useState("materials");
      const [selection, setSelection] = useState("");
      const [reading, setReading] = useState(false);
      const [taskStatus, setTaskStatus] = useState("");
      const [files, setFiles] = useState([]);
      const [selectedVersion, setSelectedVersion] = useState("");
      const [compareId, setCompareId] = useState("");
      const [revision, setRevision] = useState("");
      const [searchQuery, setSearchQuery] = useState("");
      const [searchIndex, setSearchIndex] = useState(0);
      const [reviseSegment, setReviseSegment] = useState("");
      const [sampleTagFilter, setSampleTagFilter] = useState("");
      const [characterPick, setCharacterPick] = useState({});
      const [fieldErrors, setFieldErrors] = useState({});
      const [favoriteTags, setFavoriteTags] = useState(loadFavoriteTags);
      const [useProjectProfile, setUseProjectProfile] = useState(false);
      const [fontScale, setFontScale] = useState(() => {
        try {
          return localStorage.getItem(fontScaleKey) || "normal";
        } catch {
          return "normal";
        }
      });
      const [showHint, setShowHint] = useState(false);
      const [onboard, setOnboard] = useState(() => {
        try {
          return localStorage.getItem(onboardKey) !== "seen";
        } catch {
          return true;
        }
      });
      const [update, setUpdate] = useState(null);
      const [updateError, setUpdateError] = useState("");
      const [checking, setChecking] = useState(false);
      const [dismissed, setDismissed] = useState("");
      const [editing, setEditing] = useState(false);
      const [elapsed, setElapsed] = useState(0);
      const project = store.projects.find((p) => p.id === store.activeId) || store.projects[0];
      const projectRef = useRef(project);
      projectRef.current = project;
      const live = projections[project.sessionId] || null;
      const storeRef = useRef(store);
      storeRef.current = store;
      const completedRef = useRef(/* @__PURE__ */ new Set());
      const mounted = useRef(true);
      useEffect(() => {
        mounted.current = true;
        return () => {
          mounted.current = false;
        };
      }, []);
      function change(patch, id = projectRef.current.id) {
        setStore((current) => ({ ...current, projects: current.projects.map((p) => p.id === id ? { ...p, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : p) }));
      }
      function saveFavoriteTags(field, tags, remove = false) {
        const latest = loadFavoriteTags();
        const next = { ...latest, [field]: remove ? latest[field].filter((tag) => tag !== tags) : WB.normalizeTags([...latest[field], ...tags]) };
        try {
          localStorage.setItem(favoriteTagsKey, JSON.stringify(next));
          setFavoriteTags(next);
          setNotice(remove ? "已删除常用标签，项目已选标签保留。" : "常用标签已保存，可跨项目复用。每组最多12个。");
        } catch (error) {
          setNotice("常用标签保存失败：" + error.message);
        }
      }
      function changeProfile(patch) {
        change({ creativeProfile: { ...WB.resolveCreativeProfile(project), ...patch } });
      }
      function creativeProfileView() {
        const profile = WB.resolveCreativeProfile(project);
        return h(
          "section",
          { style: card, className: "script-creative-profile" },
          h("h2", null, "创作定位"),
          h("p", { className: "script-profile-summary script-muted" }, "项目默认定位 · 本次明确要求优先"),
          h(AudienceEditor, { key: project.id, value: profile.audience, onChange: (audience) => changeProfile({ audience }) }),
          h("p", { className: "script-profile-summary script-muted" }, "交付形式：" + (project.mode.startsWith("live") ? "直播连麦" : "短视频拍摄稿")),
          ...[["themeTags", "题材标签", topicPresets], ["styleTags", "风格标签", stylePresets]].map(([field, label, presets]) => h(TagEditor, { key: project.id + field, field, label, presets, tags: profile[field], favorites: favoriteTags[field], onChange: (tags) => changeProfile({ [field]: tags }), onSave: saveFavoriteTags, onForget: (key, tag) => saveFavoriteTags(key, tag, true), onNotice: setNotice })),
          h("small", { className: "script-muted" }, "每组最多12个，每个40字；可留空。")
        );
      }
      function changeBrief(key, value) {
        change({ brief: { ...project.brief, [key]: value } });
      }
      useEffect(() => {
        if (store.blocked) return;
        let alive = true;
        const persist = () => {
          if (!alive) return;
          const result = WB.saveCatalog(localStorage, catalogKey, { projects: store.projects, activeId: store.activeId }, revisionRef.current);
          if (result.ok) {
            revisionRef.current = result.revision;
            setSaveStatus("草稿已自动保存在当前浏览器");
          } else {
            setSaveStatus("自动保存暂停：" + result.error + " 可先导出项目备份。");
            if (result.conflict) setStore((current) => ({ ...current, blocked: true, conflict: true }));
          }
        };
        setSaveStatus("正在保存…");
        const timer = setTimeout(() => {
          if (navigator.locks?.request) navigator.locks.request(catalogKey, persist).catch((error) => {
            if (alive) setSaveStatus("自动保存失败：" + error.message);
          });
          else persist();
        }, 350);
        window.addEventListener("pagehide", persist);
        const flushHidden = () => {
          if (document.visibilityState === "hidden") persist();
        };
        document.addEventListener("visibilitychange", flushHidden);
        return () => {
          alive = false;
          clearTimeout(timer);
          window.removeEventListener("pagehide", persist);
          document.removeEventListener("visibilitychange", flushHidden);
        };
      }, [store]);
      useEffect(() => {
        const sync = () => {
          const snapshot = ctx.sessions.list.getSnapshot();
          setSessions(snapshot.ids.map((id) => snapshot.byId[id]).filter(Boolean));
        };
        const stop = ctx.sessions.list.subscribe(sync);
        sync();
        ctx.sessions.refresh().catch((error) => setNotice(error.message));
        return stop;
      }, [ctx]);
      useEffect(() => {
        setFiles([]);
        setSelectedVersion("");
        setCompareId("");
        setEditing(false);
        setReviseSegment("");
        setRevision("");
        setSelection("");
        setSampleTagFilter("");
        setCharacterPick({});
        setFieldErrors({});
      }, [project.id]);
      useEffect(() => {
        setEditing(false);
      }, [selectedVersion]);
      useEffect(() => setUseProjectProfile(false), [project.id, selectedVersion]);
      useEffect(() => {
        if (!searchQuery.trim()) return;
        const el = document.querySelector(".script-search-current");
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, [searchIndex, searchQuery]);
      useEffect(() => {
        if (!project.pending) {
          setElapsed(0);
          return;
        }
        const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - project.pending.submittedAt) / 1e3)));
        tick();
        const timer = setInterval(tick, 1e3);
        return () => clearInterval(timer);
      }, [project.pending?.taskId]);
      const watchSessions = [...new Set(store.projects.filter((p) => p.pending || p.id === project.id).map((p) => p.sessionId).filter(Boolean))].sort().join("|");
      useEffect(() => {
        let alive = true;
        const stops = [];
        for (const id of watchSessions.split("|").filter(Boolean)) {
          const reference = ctx.sessions.retain(id, { source: "controllerOperation" });
          stops.push(() => reference.release());
          (async () => {
            const binding = await reference.ready;
            if (!alive) return;
            const face = binding.session.projections.faceOf("scriptWorkbench");
            const sync = () => {
              if (alive) setProjections((old) => ({ ...old, [id]: face.getSnapshot() || null }));
            };
            stops.push(face.subscribe(sync));
            sync();
          })().catch((error) => {
            if (alive) setNotice("读取项目结果失败：" + error.message);
          });
        }
        return () => {
          alive = false;
          stops.reverse().forEach((stop) => stop?.());
        };
      }, [ctx, watchSessions]);
      useEffect(() => startAutoUpdateChecks({ onResult: setUpdate, onError: (error) => setUpdateError(error.message) }), []);
      async function checkUpdate() {
        if (checking) return;
        setChecking(true);
        setDismissed("");
        setUpdateError("");
        try {
          setUpdate(await checkForUpdates());
        } catch (error) {
          setUpdateError(error.message);
        } finally {
          setChecking(false);
        }
      }
      function downloadUpdate() {
        if (!update) return;
        const target = update.assetUrl || update.url;
        const anchor = document.createElement("a");
        anchor.href = target;
        if (update.assetName) anchor.download = update.assetName;
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setNotice(update.assetUrl ? "已开始下载更新包：" + (update.assetName || "") + "。解压后可在插件管理中安装。" : "已打开发布页。");
      }
      async function installUpdate() {
        if (busyRef.current) return;
        const pm = ctx.remote?.pluginManager;
        if (!pm?.listBundles || !pm?.installBundle) {
          setUpdateError("当前环境使用手动安装，请下载新版安装包。");
          return;
        }
        busyRef.current = true;
        setBusy(true);
        try {
          const list = await pm.listBundles();
          if (!list.ok) throw list.error;
          const mine = list.value.find((b) => b.name === "@local/elderly-script");
          const target = UI.resolveInstallTarget(mine, update);
          if (target.kind !== "remote") {
            setUpdateError(target.reason);
            return;
          }
          const requestId = "update-" + Date.now();
          const installed = await pm.installBundle(target.spec, { enabled: true, requestId });
          if (!installed.ok) throw installed.error;
          if (pm.waitForInstall) {
            const waited = await pm.waitForInstall(requestId);
            if (!waited.ok) throw waited.error;
          }
          const refreshed = await pm.listBundles();
          if (!refreshed.ok) throw refreshed.error;
          const verified = UI.verifyInstalledVersion(refreshed.value.find((b) => b.name === "@local/elderly-script"), target.expectedVersion);
          if (!verified.ok) throw Error(verified.reason);
          setNotice("已核验安装版本 " + verified.actualVersion + "，刷新页面加载。");
        } catch (error) {
          setUpdateError("更新未完成：" + (error.message || String(error)));
        } finally {
          busyRef.current = false;
          setBusy(false);
        }
      }
      const chosen = WM.resolveVersion(project, selectedVersion);
      const output = chosen?.text || "";
      const chosenKind = chosen ? WM.artifactKind(chosen) : "script";
      const check = chosenKind === "script" ? WB.validateScript(output, chosen?.mode || project.mode) : { ok: true, issues: [], stats: {} };
      const humanizeCheck = chosen?.phase === "polish" ? HC.checkHumanize(output) : null;
      async function submitTask(phase = "full", instruction = "", repairCount = 0, override, retryRequest) {
        if (busyRef.current) return;
        const original = storeRef.current.projects.find((p2) => p2.id === (override?.id || projectRef.current.id));
        if (!original || original.pending) {
          setNotice("项目已有任务运行，完成后再提交。");
          return;
        }
        let p = { ...original, ...override };
        const edit = ["revision", "audit", "outline-opt", "idea-opt", "polish"].includes(phase);
        const sourceVersion = override?.sourceVersion || (edit ? WM.resolveVersion(p, p.id === projectRef.current.id ? selectedVersion : "") : null);
        if ((edit || override?.sourceVersion) && sourceVersion?.mode) p.mode = sourceVersion.mode;
        const overrideProfile = useProjectProfile && p.id === projectRef.current.id && repairCount === 0;
        p.creativeProfile = WB.resolveCreativeProfile(sourceVersion && !overrideProfile ? sourceVersion : p);
        if (p.sessionId && storeRef.current.projects.some((item) => item.id !== p.id && item.sessionId === p.sessionId && item.pending)) {
          setNotice("关联会话正用于另一个项目，请等待完成或选择独立会话。");
          return;
        }
        const source = override?.repairText ?? (edit ? sourceVersion?.text || p.draft : p.draft);
        const taskFiles = override ? [] : [...files];
        if (!retryRequest && !edit && phase !== "persona") {
          const errors = {};
          if (p.mode === "live" && !p.topic.trim() && !p.brief.conflict.trim()) errors.topic = "请填写选题或核心冲突。";
          if (["live-opt", "duan-adapt"].includes(p.mode) && !source.trim() && !taskFiles.length) errors.draft = "请提供原稿或母版。";
          if (p.mode === "duan-ba" && !p.videoPath.trim() && !taskFiles.length && !p.videoEvidence.trim()) errors.video = "请提供视频、路径或时间轴证据。";
          if (Object.keys(errors).length) {
            setFieldErrors(errors);
            setNotice("请补充标记的创作资料。");
            return;
          }
        }
        if (edit && !source?.trim() && !retryRequest) {
          setNotice("先选择稿件或载入原稿。");
          return;
        }
        busyRef.current = true;
        setBusy(true);
        setTaskStatus("准备任务");
        let target = retryRequest?.sessionId || p.sessionId;
        let request = retryRequest || null;
        const taskId = uid();
        try {
          if (!target) target = await ctx.sessions.create({});
          const parts = retryRequest ? [...retryRequest.parts] : [];
          if (!retryRequest) for (const file of taskFiles) {
            setTaskStatus("上传素材：" + file.name);
            const receipt = await ctx.fileUpload.upload(target, file, file.name, void 0, (progress) => {
              if (mounted.current) setTaskStatus("上传 " + file.name + (progress.total ? " · " + Math.round(progress.loaded / progress.total * 100) + "%" : ""));
            });
            if (!receipt.ok) throw receipt.error;
            parts.push({ type: "file", receiptId: receipt.value.receiptId });
          }
          const text = retryRequest ? retryRequest.text.replace(/\[DSH_SCRIPT_TASK:[^\]\r\n]+\]/, () => "[DSH_SCRIPT_TASK:" + taskId + "]") : WM.buildTaskText({
            taskId,
            sourceVersion,
            creativeProfile: p.creativeProfile,
            artifactKind: sourceVersion ? WM.artifactKind(sourceVersion) : void 0,
            project: p,
            phase,
            draft: source,
            instruction: [instruction, taskFiles.length ? "已附文件：" + taskFiles.map((f) => f.name).join("、") + "。使用可用工具读取，区分可见事实与不确定项。" : ""].filter(Boolean).join("\n"),
            liveRules: LIVE_RULES,
            shortRules: SHORT_VIDEO_RULES,
            humanizeRules: HUMANIZE_RULES
          });
          const kind = ["idea", "idea-opt"].includes(phase) ? "idea" : ["outline", "outline-opt"].includes(phase) ? "outline" : phase === "audit" ? "report" : edit ? WM.artifactKind(sourceVersion) : "script";
          request = { text, parts, sessionId: target, creativeProfile: p.creativeProfile, mode: p.mode, sourceVersionId: sourceVersion?.id || "", artifactKind: kind, sourceVersion: sourceVersion ? { id: sourceVersion.id, mode: sourceVersion.mode, phase: sourceVersion.phase, artifactKind: WM.artifactKind(sourceVersion), creativeProfile: WB.resolveCreativeProfile(sourceVersion) } : null };
          if (retryRequest) request = { ...retryRequest, text, parts };
          const pending = { taskId, phase, repairCount, submittedAt: Date.now(), mode: request.mode || p.mode, creativeProfile: request.creativeProfile || p.creativeProfile, instruction, sourceVersionId: request.sourceVersionId, artifactKind: request.artifactKind, sourceVersion: request.sourceVersion, request };
          change({ sessionId: target, pending, retry: null }, p.id);
          setTaskStatus("提交到会话");
          const reference = ctx.sessions.retain(target, { source: "controllerOperation" });
          try {
            const binding = await reference.ready;
            const result = await binding.session.prompt([{ type: "text", text }, ...parts], "queue", void 0, taskId);
            if (!result.ok) throw result.error;
          } finally {
            reference.release();
          }
          if (projectRef.current.id === p.id) {
            if (taskFiles.length) setFiles([]);
            setTab("result");
            setSelectedVersion("");
          }
          setNotice("任务已提交 · " + p.title + "。结果保留为新稿。");
        } catch (error) {
          change({ pending: null, retry: { phase, instruction, repairCount, request, reason: error.message || String(error) } }, p.id);
          setNotice("提交失败：" + (error.message || String(error)));
        } finally {
          busyRef.current = false;
          setBusy(false);
          setTaskStatus("");
        }
      }
      useEffect(() => {
        for (const result of Object.values(projections)) {
          if (!result?.done || !result.taskId || completedRef.current.has(result.taskId)) continue;
          const p = storeRef.current.projects.find((item) => item.pending?.taskId === result.taskId);
          if (!p) continue;
          completedRef.current.add(result.taskId);
          const pending = p.pending;
          if (result.error || !result.text?.trim()) {
            change({ pending: null, retry: { phase: pending.phase, instruction: pending.instruction, repairCount: pending.repairCount, request: pending.request, reason: result.error || "结果为空" } }, p.id);
            setNotice(p.title + " · 任务未完成：" + (result.error || "结果为空"));
            continue;
          }
          const next = WM.archiveResult(p, pending, result, { id: uid(), createdAt: (/* @__PURE__ */ new Date()).toISOString() });
          setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === p.id && item.pending?.taskId === result.taskId ? { ...item, ...next, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : item) }));
          const version = next.versions.at(-1);
          if (projectRef.current.id === p.id && !["audit", "persona"].includes(pending.phase)) setSelectedVersion(version?.id || "");
          if (pending.phase === "audit") {
            setNotice(next.characterDraftError || "报告已独立归档，当前稿件保持原样。");
            continue;
          }
          if (pending.phase === "persona") {
            setNotice("人设草稿已保存到人物与样稿，采用后生效。");
            continue;
          }
          const issues = WM.artifactKind(version) === "script" ? WB.validateScript(result.text, pending.mode || p.mode).issues : [];
          if (p.autoRepair && pending.repairCount < 1 && issues.length) setRepairQueue((queue) => [...queue, { project: { ...next, sourceVersion: version, repairText: result.text }, instruction: "只修复下列问题，保持其余内容与锁定事实：\n" + issues.map((issue) => issue.message).join("\n") }]);
          setNotice(p.title + " · 新稿已保存" + (issues.length ? "，有 " + issues.length + " 项检查提示。" : "。"));
        }
      }, [projections]);
      useEffect(() => {
        if (!repairQueue.length || busy) return;
        const [task, ...rest] = repairQueue;
        setRepairQueue(rest);
        void submitTask("revision", task.instruction, 1, task.project);
      }, [repairQueue, busy]);
      async function importFiles(list) {
        const ownerId = project.id, entries = [], binary = [], errors = [];
        for (const file of Array.from(list || [])) try {
          if (/\.(txt|md|srt|vtt|docx)$/i.test(file.name)) {
            if (file.size > (/\.docx$/i.test(file.name) ? 20 : 5) * 1024 * 1024) throw Error("超过导入大小限制");
            const text = /\.docx$/i.test(file.name) ? await IO.readDocxText(await file.arrayBuffer(), async (bytes) => {
              const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
              return new Uint8Array(await new Response(stream).arrayBuffer());
            }) : await file.text();
            entries.push({ id: uid(), name: file.name, text });
          } else {
            if (file.size > 250 * 1024 * 1024) throw Error("超过250MB，请使用本地路径或片段");
            binary.push(file);
          }
        } catch (error) {
          errors.push(file.name + "：" + error.message);
        }
        if (entries.length) setImportPreview({ ownerId, entries, errors });
        else if (errors.length) setNotice(errors.join("；"));
        if (binary.length && projectRef.current.id === ownerId) {
          setFiles((old) => [...old, ...binary]);
          setNotice("已选择 " + binary.length + " 份待上传素材，提交时上传。");
        } else if (binary.length) setNotice("项目已切换，待上传文件请回原项目重新选择。");
      }
      function applyImport() {
        if (!importPreview) return;
        const { ownerId, entries } = importPreview;
        setStore((current) => ({ ...current, projects: current.projects.map((p) => {
          if (p.id !== ownerId) return p;
          const text = entries.map((entry) => "【素材：" + entry.name + "】\n" + entry.text).join("\n\n"), key = p.mode === "duan-ba" ? "videoEvidence" : "draft";
          const patch = importStrategy === "materials" ? { materials: [...p.materials || [], ...entries] } : { [key]: importStrategy === "append" ? [p[key], text].filter(Boolean).join("\n\n") : text };
          return { ...p, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        }) }));
        setImportPreview(null);
        setNotice("已导入 " + entries.length + " 份文字素材。");
        setFieldErrors({});
      }
      function dismissOnboard() {
        setOnboard(false);
        try {
          localStorage.setItem(onboardKey, "seen");
        } catch {
        }
      }
      function loadExample() {
        const p = WM.forkProject(AN.buildExampleProject(), { id: uid(), title: "示例 · 春节回家" });
        setStore((current) => ({ ...current, projects: [...current.projects, p], activeId: p.id }));
        setTab("result");
        setSelectedVersion("");
        dismissOnboard();
        setNotice("已载入示例项目，可自由修改、删除或从模板复制。");
      }
      function addProject() {
        const p = blankProject();
        setStore((current) => ({ ...current, projects: [...current.projects, p], activeId: p.id }));
        setTab("create");
      }
      function deleteProject() {
        const target = project;
        if (target.pending || busy) {
          setNotice("任务运行中，先停止或等待完成再删除。");
          return;
        }
        if (!globalThis.confirm || confirm("确定删除项目「" + target.title + "」吗？此操作不可恢复，建议先备份。")) {
          setStore((current) => {
            let projects = current.projects.filter((item) => item.id !== target.id);
            if (!projects.length) projects = [blankProject()];
            const activeId = projects.some((item) => item.id === current.activeId) ? current.activeId : projects[0].id;
            return { ...current, projects, activeId };
          });
          setNotice("项目已删除。");
        }
      }
      function updateItem(collection, id, patch) {
        change({ [collection]: project[collection].map((item) => item.id === id ? { ...item, ...patch } : item) });
      }
      async function importBackup(event) {
        try {
          const file = event.target.files[0];
          if (!file) return;
          const result = WB.importBackup(await file.text());
          if (!result.ok) throw Error(result.error);
          const p = WM.forkProject(hydrateProject(result.project), { id: uid() });
          setStore((current) => ({ ...current, blocked: false, projects: [...current.projects, p], activeId: p.id }));
          setNotice("项目备份已导入；会话重新创建，资料和版本已恢复。");
        } catch (error) {
          setNotice("备份导入失败：" + error.message);
        }
      }
      function creativeForm() {
        const err = (key) => fieldErrors[key] ? h("p", { role: "alert", style: { color: T.error } }, fieldErrors[key]) : null;
        const phase = { idea: "idea", outline: "outline", script: "full" }[project.deliverable] || "full";
        return h(
          "div",
          { className: "script-brief-grid" },
          h(
            "div",
            null,
            h(
              "section",
              { style: card, className: "script-brief-main" },
              h("div", { className: "script-section-heading" }, h("h2", null, "创作简报"), h("span", { className: "script-badge" }, "编导主导 · AI 辅助")),
              h(
                "div",
                { className: "script-form-grid" },
                h("label", null, "工作模式", h("select", { style: input, value: project.mode, onChange: (e) => {
                  change({ mode: e.target.value });
                  setFieldErrors({});
                } }, Object.entries(modeLabels).map(([value, label]) => h("option", { key: value, value }, label)))),
                h("label", null, "本次产出", h("select", { style: input, value: project.deliverable, onChange: (e) => change({ deliverable: e.target.value }) }, h("option", { value: "idea" }, "选题 / 思路"), h("option", { value: "outline" }, "结构大纲"), h("option", { value: "script" }, "完整剧本")))
              ),
              h(Field, { label: "选题 / 本集任务", value: project.topic, onChange: (topic) => {
                change({ topic });
                setFieldErrors((old) => ({ ...old, topic: "" }));
              }, placeholder: "这一稿要讲什么，或要解决什么问题" }),
              err("topic"),
              h("div", { style: { margin: "-2px 0 10px" } }, h(Button, { onClick: () => {
                const themes = WB.resolveCreativeProfile(project).themeTags.join("、");
                change({ topic: themes.includes("防诈骗") ? "连麦聊聊冒充老同学借钱的电话，说明核实身份的具体方法" : themes.includes("家庭") || themes.includes("情感") ? "儿子春节不回家，母亲嘴上说理解心里委屈，最后通过连麦把话说开" : "几位退休同事第一次结伴出游，分享行程安排与沿途趣事" });
                setFieldErrors((old) => ({ ...old, topic: "" }));
              } }, "填入示例选题")),
              h(Field, { label: "原稿 / 母版 / 已有思路", value: project.draft, rows: 10, onChange: (draft) => {
                change({ draft });
                setFieldErrors((old) => ({ ...old, draft: "" }));
              }, placeholder: "可直接带稿工作；留空则按简报创作。" }),
              err("draft"),
              project.mode === "duan-ba" ? h("div", null, h(Field, { label: "视频路径（DSH 所在电脑）", value: project.videoPath, onChange: (videoPath) => change({ videoPath }) }), h(Field, { label: "字幕 / 时间轴证据", value: project.videoEvidence, rows: 5, onChange: (videoEvidence) => change({ videoEvidence }), placeholder: "时间段、画面 / 音轨依据、待复核事实" }), err("video")) : null,
              h(Field, { label: "本次指令 / 调整方向", value: project.notes, rows: 4, onChange: (notes) => change({ notes }), placeholder: "例如：保留结尾，只调整前半段冲突升级；对白更克制。" }),
              h("div", { className: "script-actionbar script-brief-submit" }, h(Button, { primary: true, disabled: busy || !!project.pending, onClick: () => submitTask(phase) }, "生成" + { idea: "思路", outline: "大纲", script: "剧本" }[project.deliverable]), h("span", { className: "script-muted" }, "按当前简报执行，结果保留为新版本"))
            ),
            h(
              "details",
              { className: "script-brief-secondary", style: card, onDragOver: (e) => e.preventDefault(), onDrop: (e) => {
                e.preventDefault();
                void importFiles(e.dataTransfer.files);
              } },
              h("summary", null, "素材收件箱", h("small", { className: "script-muted" }, " · 导入文字、视频或音频")),
              h("p", { className: "script-muted" }, "文字先预览，再选择载入方式；视频和音频提交时上传。"),
              h("input", { "aria-label": "导入创作素材", type: "file", multiple: true, accept: ".txt,.md,.docx,.srt,.vtt,.mp4,.mov,.mkv,.webm,.wav,.mp3", onChange: (e) => {
                void importFiles(e.target.files);
                e.target.value = "";
              }, style: { maxWidth: "100%" } }),
              ...files.map((file, i) => h("div", { key: i, style: row }, file.name, h(Button, { onClick: () => setFiles((old) => old.filter((_, index) => index !== i)) }, "移除"))),
              ...(project.materials || []).map((item) => h("details", { key: item.id, style: { marginTop: 12 } }, h("summary", null, item.name + " · " + item.text.length + " 字"), h("pre", { className: "script-material-text" }, item.text), h(Button, { onClick: () => change({ draft: [project.draft, item.text].filter(Boolean).join("\n\n") }) }, "追加到原稿"), h(Button, { onClick: () => change({ materials: project.materials.filter((entry) => entry.id !== item.id) }) }, "移除素材")))
            )
          ),
          h(
            "aside",
            null,
            creativeProfileView(),
            h(
              "details",
              { style: card, className: "script-constraint-details" },
              h("summary", null, "创作约束"),
              h("p", { className: "script-muted" }, "选填；已填内容始终参与生成和返修。"),
              ...[["relationship", "人物关系 / 参与者"], ["conflict", "核心问题 / 冲突"], ["goals", "表达目标 / 角色诉求"], ["ending", "收束 / 结尾方向"], ["lockedFacts", "锁定事实 / 情节"], ["protectedLines", "保护台词（逐字保留）"]].map(([key, label]) => h(Field, { key, label, rows: ["lockedFacts", "protectedLines"].includes(key) ? 3 : 2, value: project.brief[key], onChange: (value) => changeBrief(key, value) })),
              h("label", null, "优化力度", h("select", { style: input, value: project.intensity, onChange: (e) => change({ intensity: e.target.value }) }, h("option", { value: "light" }, "轻修 · 保留顺序与情节"), h("option", { value: "structure" }, "结构调整 · 保留核心因果"), h("option", { value: "deep" }, "重构 · 保留锁定项"))),
              h("label", { style: { display: "block", marginTop: 8 } }, h("input", { type: "checkbox", checked: project.autoRepair, onChange: (e) => change({ autoRepair: e.target.checked }) }), " 格式问题自动返修一次（额外调用 AI）")
            ),
            h("details", { style: card }, h("summary", null, "结构指纹 / 已确认大纲"), h(Field, { label: "结构指纹", value: project.fingerprint, rows: 5, onChange: (fingerprint) => change({ fingerprint }) }), h(Field, { label: "已确认大纲", value: project.outline, rows: 7, onChange: (outline) => change({ outline }) })),
            h("section", { style: { ...card, background: T.layer2 } }, h("strong", null, "本次参考"), h("p", { className: "script-muted" }, project.characters.length + " 张人物卡 · " + project.selectedSampleIds.length + " 份已选样稿"), h(Button, { onClick: () => setTab("library") }, "管理人物与样稿"))
          )
        );
      }
      function libraryView() {
        const allTags = [...new Set(project.samples.flatMap((sample) => sample.tags || []))];
        const visibleSamples = sampleTagFilter ? project.samples.filter((sample) => (sample.tags || []).includes(sampleTagFilter)) : project.samples;
        return h(
          "div",
          null,
          h(
            "div",
            { style: card },
            h("h2", { style: { fontSize: "1.21em" } }, "主播人设"),
            h("p", { style: { color: T.muted, fontSize: ".93em" } }, "粘贴你的人设让 AI 优化，或让 AI 生成一个再由你修改；人设会用于后续创作。"),
            h(Field, { label: "我的人设", value: project.persona || "", rows: 6, onChange: (persona) => change({ persona }) }),
            h(
              "div",
              { style: row },
              h(Button, { disabled: busy || !!project.pending, onClick: () => {
                if (!(project.persona || "").trim()) {
                  setNotice("请先粘贴你的人设。");
                  return;
                }
                submitTask("persona", "优化下面这段人设，贴合本项目的目标受众、题材与风格：保留真实信息，强化身份、性格、说话风格、与观众的关系和记忆点。只输出优化后的人设文字，不要解释。\n\n原人设：\n" + project.persona);
              } }, "优化我的人设"),
              h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask("persona", "根据本项目受众、题材和风格生成一个主播人设，包含称呼、年龄感、身份背景、性格、说话风格、口头禅、与观众的关系、擅长话题。只输出人设文字。\n\n主题：" + (project.topic || "按创作定位自主选择合适话题")) }, "给我一个人设")
            ),
            project.personaDraft ? h(
              "div",
              { style: { ...card, background: T.layer2, marginTop: 10 } },
              h("strong", null, "人设草稿"),
              h("pre", { style: { whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.7, maxHeight: 260, overflow: "auto" } }, project.personaDraft),
              h("div", { style: row }, h(Button, { primary: true, onClick: () => {
                change({ persona: project.personaDraft, personaDraft: null });
                setNotice("已采用该人设。");
              } }, "采用此版本"), h(Button, { onClick: () => change({ personaDraft: null }) }, "丢弃"))
            ) : null
          ),
          project.characterDraft?.length ? h(
            "div",
            { style: { ...card, borderColor: T.brand } },
            h("strong", null, "待确认人物卡草稿"),
            h("p", { style: { color: T.muted, fontSize: ".93em" } }, "由 AI 从成稿提取，请勾选要合并的人物，确认后写入人物卡。"),
            ...project.characterDraft.map((draft, index) => h(
              "label",
              { key: index, style: { display: "block", margin: "4px 0" } },
              h("input", { type: "checkbox", checked: !!characterPick[index], onChange: (e) => setCharacterPick({ ...characterPick, [index]: e.target.checked }) }),
              " " + (draft.name || "未命名") + (draft.relationship ? "（" + draft.relationship + "）" : "")
            )),
            h(
              "div",
              { style: { ...row, marginTop: 10 } },
              h(Button, { primary: true, onClick: () => {
                const selected = project.characterDraft.filter((_, index) => characterPick[index]).map((card2) => ({ id: uid(), ...card2 }));
                if (!selected.length) {
                  setNotice("请先勾选要合并的人物。");
                  return;
                }
                change({ characters: [...project.characters, ...selected], characterDraft: null });
                setCharacterPick({});
                setNotice("已合并 " + selected.length + " 张人物卡。");
              } }, "合并所选人物"),
              h(Button, { onClick: () => {
                change({ characterDraft: null });
                setCharacterPick({});
              } }, "丢弃草稿")
            )
          ) : null,
          h(
            "div",
            { style: card },
            h("h2", { style: { fontSize: "1.21em" } }, "人物卡"),
            h("p", { style: { color: T.muted, fontSize: ".93em" } }, "由你确认的人物资料会随项目复用；不自动把 AI 临时补出的设定记为事实。"),
            ...project.characters.map((person) => h(
              "details",
              { key: person.id, style: { ...card, background: T.layer2 }, open: true },
              h("summary", null, person.name || "新人物"),
              ...[["name", "姓名 / 称呼"], ["relationship", "身份与关系"], ["goal", "当场诉求和顾虑"], ["knowledge", "知道什么 / 不知道什么"], ["voice", "说话习惯"], ["state", "已发生事情与当前态度"]].map(([key, label]) => h(Field, { key, label, value: person[key] || "", onChange: (value) => updateItem("characters", person.id, { [key]: value }) })),
              h(Button, { onClick: () => change({ characters: project.characters.filter((item) => item.id !== person.id) }) }, "移除此人物")
            )),
            h(Button, { onClick: () => change({ characters: [...project.characters, { id: uid(), name: "", relationship: "", goal: "", knowledge: "", voice: "", state: "" }] }) }, "添加人物卡"),
            !project.characters.length ? h("p", { className: "script-muted" }, "先建主播人设和一张人物卡，AI 生成与返修会沿用这些设定。") : null
          ),
          h(
            "div",
            { style: card },
            h("h2", { style: { fontSize: "1.21em" } }, "优秀样稿库"),
            h("p", { style: { color: T.muted, fontSize: ".93em" } }, "只勾选最相关的少量样稿。记录优点和反例，借鉴结构口吻，不照搬样稿事实。"),
            allTags.length ? h(
              "label",
              { style: { display: "block", marginBottom: 10 } },
              "按标签筛选 ",
              h(
                "select",
                { value: sampleTagFilter, style: { ...input, width: "auto", minWidth: 160, marginBottom: 0 }, onChange: (e) => setSampleTagFilter(e.target.value) },
                h("option", { value: "" }, "全部"),
                ...allTags.map((tag) => h("option", { key: tag, value: tag }, tag))
              )
            ) : null,
            ...visibleSamples.map((sample) => h(
              "details",
              { key: sample.id, style: card },
              h("summary", null, sample.title || "新样稿"),
              h("label", null, h("input", { type: "checkbox", checked: project.selectedSampleIds.includes(sample.id), onChange: (e) => change({ selectedSampleIds: e.target.checked ? [...project.selectedSampleIds, sample.id] : project.selectedSampleIds.filter((id) => id !== sample.id) }) }), " 用于当前创作"),
              h(Field, { label: "样稿名称", value: sample.title || "", onChange: (title) => updateItem("samples", sample.id, { title }) }),
              h("select", { value: sample.mode || "live", style: input, onChange: (e) => updateItem("samples", sample.id, { mode: e.target.value }) }, ...Object.entries(modeLabels).map(([key, label]) => h("option", { key, value: key }, label))),
              h(Field, { label: "标签（用顿号或逗号分隔）", value: (sample.tags || []).join("、"), onChange: (text) => updateItem("samples", sample.id, { tags: text.split(/[、,，;；\s]+/).map((tag) => tag.trim()).filter(Boolean) }) }),
              h(Field, { label: "样稿正文", value: sample.text, rows: 8, onChange: (text) => updateItem("samples", sample.id, { text }) }),
              h(Field, { label: "优点 / 不要模仿的表达", value: sample.notes || "", rows: 3, onChange: (notes) => updateItem("samples", sample.id, { notes }) }),
              h(Button, { onClick: () => change({ samples: project.samples.filter((item) => item.id !== sample.id), selectedSampleIds: project.selectedSampleIds.filter((id) => id !== sample.id) }) }, "移除此样稿")
            )),
            h(Button, { onClick: () => change({ samples: [...project.samples, { id: uid(), title: "", mode: project.mode, text: "", notes: "", tags: [] }] }) }, "添加样稿"),
            output ? h(Button, { onClick: () => {
              change({ samples: [...project.samples, { id: uid(), title: project.title + " 已确认成稿", mode: project.mode, text: output, notes: "", tags: [] }] });
              setNotice("已加入样稿库，请标注优点并勾选后使用。");
            } }, "将当前成稿收入样稿库") : null
          )
        );
      }
      function resultView() {
        const before = project.versions.find((v) => v.id === compareId);
        const diff = before && output ? WB.diffLines(before.text, output) : null;
        const kind = chosenKind, phase = WM.revisionPhase(chosen), mode = chosen?.mode || project.mode;
        const segments = [...output.matchAll(mode.startsWith("live") ? /^【([^】\n]+)】\s*$/gm : /^[ \t]*(?:#{1,6}\s*)?【[^\n】]*[/／|｜][^\n】]*】/gm)];
        const reports = (project.reports || []).filter((report) => report.sourceVersionId === chosen?.id);
        const pendingText = project.pending && live?.taskId === project.pending.taskId ? live.text : "";
        const searchMatches = searchQuery.trim() ? AN.findMatches(output, searchQuery.trim()) : { matches: [], count: 0 };
        const roleStats = kind === "script" && output ? AN.analyzeRoles(output, mode) : null;
        const viewedIndex = chosen ? project.versions.findIndex((v) => v.id === chosen.id) + 1 : 0;
        const parentIndex = chosen?.sourceVersionId ? project.versions.findIndex((v) => v.id === chosen.sourceVersionId) + 1 : 0;
        const effectiveProfile = WB.resolveCreativeProfile(chosen && !useProjectProfile ? chosen : project);
        const checkGroups = AN.groupCheckIssues(check.issues);
        const visibleIssueCount = checkGroups.reduce((sum, group) => sum + group.issues.length, 0);
        const renderHighlighted = (text) => {
          if (!searchMatches.matches.length || !text) return text;
          const nodes = [];
          let last = 0;
          searchMatches.matches.forEach((m, i) => {
            if (m.start > last) nodes.push(text.slice(last, m.start));
            nodes.push(h("mark", { key: "sm" + i, className: i === searchIndex % searchMatches.matches.length ? "script-search-current" : "script-search-hit" }, text.slice(m.start, m.end)));
            last = m.end;
          });
          if (last < text.length) nodes.push(text.slice(last));
          return nodes;
        };
        return h(
          "div",
          { className: "script-result-grid" + (reading ? " script-reading" : "") },
          h(
            "section",
            { style: card },
            h("div", { className: "script-section-heading" }, h("h2", null, "稿件工作区"), h(Button, { onClick: () => setReading(!reading) }, reading ? "退出专注" : "专注阅读")),
            output ? h("div", { className: "script-search" }, h("input", { "aria-label": "搜索稿件", type: "search", style: input, value: searchQuery, placeholder: "在稿件中搜索…", onChange: (e) => {
              setSearchQuery(e.target.value);
              setSearchIndex(0);
            } }), searchQuery.trim() ? h("span", { className: "script-muted" }, searchMatches.count ? searchIndex + 1 + " / " + searchMatches.count : "无匹配") : null, searchQuery.trim() ? h(Button, { disabled: !searchMatches.count, onClick: () => setSearchIndex((i) => (i - 1 + searchMatches.count) % searchMatches.count) }, "上一个") : null, searchQuery.trim() ? h(Button, { disabled: !searchMatches.count, onClick: () => setSearchIndex((i) => (i + 1) % searchMatches.count) }, "下一个") : null, searchQuery.trim() ? h(Button, { onClick: () => {
              setSearchQuery("");
              setSearchIndex(0);
            } }, "清除") : null) : null,
            h(
              "div",
              { style: row },
              h("span", { className: "script-badge" }, { idea: "思路", outline: "大纲", script: "剧本" }[kind]),
              chosen ? h("span", { className: "script-muted", title: chosen.id === project.currentVersionId ? "已采用稿：默认工作稿；手动切换版本后，返修以当前浏览稿为准。" : "候选稿：刚生成或修改的新版本，采用后设为默认工作稿。" }, chosen.id === project.currentVersionId ? "已采用稿" : "候选稿 · 采用后设为默认工作稿") : null,
              chosen && chosen.id !== project.currentVersionId ? h(Button, { disabled: !!project.pending, onClick: () => {
                change({ currentVersionId: chosen.id });
                setNotice("已采用当前稿，历史版本保留。");
              } }, "采用此稿") : null
            ),
            project.versions.length ? h("label", null, "浏览版本", h("select", { "aria-label": "浏览稿件版本", style: input, value: chosen?.id || "", onChange: (e) => {
              setSelectedVersion(e.target.value);
              setSelection("");
              setCompareId("");
            } }, ...project.versions.map((v, i) => h("option", { key: v.id, value: v.id }, "v" + (i + 1) + " · " + { idea: "思路", outline: "大纲", script: "剧本" }[WM.artifactKind(v)] + " · " + (v.id === project.currentVersionId ? "已采用 · " : "") + new Date(v.createdAt).toLocaleString())))) : null,
            editing && chosen ? h("div", null, h(Field, { label: "编辑稿件", value: project.editBuffers?.[chosen.id] ?? output, rows: 22, onChange: (text) => change({ editBuffers: { ...project.editBuffers, [chosen.id]: text } }) }), h("div", { style: row }, h(Button, { primary: true, onClick: () => {
              const v = { id: uid(), text: project.editBuffers?.[chosen.id] ?? output, phase: "manual", artifactKind: kind, mode, creativeProfile: WB.resolveCreativeProfile(chosen), sourceVersionId: chosen.id, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
              change({ versions: [...project.versions, v] });
              setSelectedVersion(v.id);
              setEditing(false);
            } }, "保存为新版本"), h(Button, { onClick: () => setEditing(false) }, "取消编辑"))) : h("pre", { className: "script-document", tabIndex: 0, onMouseUp: () => {
              const text = window.getSelection()?.toString() || "";
              setSelection(output.includes(text) ? text.slice(0, 12e3) : "");
            } }, pendingText || renderHighlighted(output) || "载入原稿，或从创作简报生成。你可以直接编辑、审稿、润色或定向返修。"),
            output ? h(
              "div",
              { className: "script-actionbar script-document-tools", "aria-label": "稿件操作" },
              h(Button, { onClick: async () => {
                try {
                  await navigator.clipboard.writeText(output);
                  setNotice("稿件已复制");
                } catch {
                  setNotice("请选中正文复制。");
                }
              } }, "复制"),
              h(Button, { disabled: !!project.pending, onClick: () => setEditing(!editing) }, "编辑稿件"),
              h(Button, { onClick: () => download(project.title + ".docx", IO.buildDocxBytes(output), "application/vnd.openxmlformats-officedocument.wordprocessingml.document") }, "导出 Word"),
              h("details", { className: "script-more" }, h("summary", null, "更多"), h(
                "div",
                { style: row },
                ...["md", "txt"].map((ext) => h(Button, { key: ext, onClick: () => download(project.title + "." + ext, output, "text/plain;charset=utf-8") }, "导出 " + ext.toUpperCase())),
                h(Button, { onClick: () => {
                  change({ draft: output });
                  setTab("create");
                } }, "载入创作原稿"),
                h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask("audit", "[DSH_EXTRACT_CHARACTERS] 提取当前稿的人物卡。只输出JSON对象，characters数组每项包含name,relationship,goal,knowledge,voice,state。") }, "提取人物卡"),
                h(Button, { onClick: () => {
                  change({ samples: [...project.samples, { id: uid(), title: project.title + " 样稿", mode, text: output, notes: "", tags: [] }] });
                  setNotice("已收入样稿库。");
                } }, "收入样稿库")
              ))
            ) : project.draft ? h(Button, { primary: true, onClick: () => {
              const v = { id: uid(), text: project.draft, phase: "manual", artifactKind: project.deliverable, mode: project.mode, creativeProfile: WB.resolveCreativeProfile(project), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
              change({ versions: [...project.versions, v], currentVersionId: v.id });
              setSelectedVersion(v.id);
            } }, "载入原稿到工作区") : h(Button, { onClick: () => setTab("create") }, "打开创作简报"),
            diff ? h("section", { style: { marginTop: 24 } }, h("h3", null, "版本对照"), h("p", null, diff.summary), h("pre", { className: "script-diff" }, diff.blocks.map((entry, i) => h("div", { key: i, style: { whiteSpace: "pre-wrap", color: entry.type === "add" ? "var(--dsw-alias-state-success-primary)" : entry.type === "remove" ? T.error : T.muted, textDecoration: entry.type === "remove" ? "line-through" : "none" } }, (entry.type === "add" ? "+ " : entry.type === "remove" ? "- " : "  ") + entry.text)))) : null
          ),
          h(
            "aside",
            { className: "script-inspector" },
            h(
              "section",
              { style: card },
              h("h2", null, "编导指令"),
              h(
                "div",
                { className: "script-object-context", role: "group", "aria-label": "本次操作对象" },
                h("strong", null, chosen ? "正在修改：v" + viewedIndex + " · " + (chosen.id === project.currentVersionId ? "已采用稿" : "候选稿") : "尚未载入稿件"),
                chosen ? h("small", null, parentIndex ? "来源：v" + parentIndex + "；操作结果保存为新版本。" : "操作结果保存为新版本，原稿保留。") : h("small", null, "请先载入原稿或生成一份稿件。"),
                h("p", null, "本次定位：" + (chosen && !useProjectProfile ? "沿用来源稿" : "当前项目") + " · " + effectiveProfile.audience),
                h("small", null, "题材：" + (effectiveProfile.themeTags.join("、") || "开放") + "；风格：" + (effectiveProfile.styleTags.join("、") || "按稿件")),
                chosen ? h("label", { className: "script-source-profile" }, h("input", { type: "checkbox", checked: useProjectProfile, onChange: (event) => setUseProjectProfile(event.target.checked) }), " 本次改用当前项目创作定位") : null
              ),
              selection ? h("div", { className: "script-selection" }, h("strong", null, "已选文字"), h("p", null, selection.slice(0, 200) + (selection.length > 200 ? "…" : "")), h(Button, { onClick: () => setSelection("") }, "清除选择")) : null,
              h(Field, { label: "修改意图", value: revision, rows: 5, onChange: setRevision, placeholder: "例如：第3段情绪推进太快，补一层犹豫；保留结尾和金额。" }),
              segments.length ? h("label", null, "返修范围", h("select", { style: input, value: reviseSegment, onChange: (e) => setReviseSegment(e.target.value) }, h("option", { value: "" }, "全文"), ...segments.map((match, i) => h("option", { key: i, value: String(i + 1) }, "第" + (i + 1) + (mode.startsWith("live") ? "段 · " : "场 · ") + match[0])))) : null,
              h(Button, { primary: true, disabled: busy || !!project.pending || !output || !revision.trim(), onClick: () => submitTask(phase, [reviseSegment ? "仅修改第" + reviseSegment + (mode.startsWith("live") ? "段话轮" : "场") + "，其余保持原样。" : "", selection ? "仅修改以下选中文字，返回包含修改的完整稿件，其他内容保持原样：\n" + selection : "", revision].filter(Boolean).join("\n")) }, kind === "script" ? "定向返修" : "优化" + { idea: "思路", outline: "大纲" }[kind]),
              h("div", { className: "script-inspector-tools", style: { ...row, marginTop: 12 } }, h(Button, { disabled: busy || !!project.pending || !output, onClick: () => submitTask("polish", "仅润色当前稿件，保持其内容类型与结构。") }, "文字润色"), h(Button, { disabled: busy || !!project.pending || !output, onClick: () => submitTask("audit", "按位置、问题、依据、修复建议审稿；结合目标受众、题材和风格，核对事实依据、信息递进、对白与衔接；仅在剧情需要时评估人物动机和情绪。") }, "AI 审稿")),
              kind === "idea" && output ? h("div", { className: "script-actionbar" }, h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask("outline", "基于此思路生成结构大纲。", 0, { ...project, draft: output, sourceVersion: chosen, deliverable: "outline" }) }, "扩成大纲")) : null,
              ["idea", "outline"].includes(kind) && output ? h("div", { className: "script-actionbar" }, h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask("full", "基于当前稿件扩写完整剧本，保留已确定事实与结尾。", 0, { ...project, draft: output, sourceVersion: chosen, deliverable: "script" }) }, "扩成剧本"), kind === "outline" ? h(Button, { onClick: () => {
                change({ outline: output });
                setNotice("已确认此大纲，后续创作将作为约束。");
              } }, "确认大纲") : null) : null
            ),
            roleStats && roleStats.roles.length ? h("section", { style: card }, h("h3", null, "角色台词统计"), h("ul", { className: "script-roles" }, roleStats.roles.map((r) => h("li", { key: r.name }, h("span", { className: "script-role-name" }, r.name), h("span", { className: "script-role-bar" }, h("i", { style: { width: Math.round(r.share * 100) + "%" } })), h("span", { className: "script-muted" }, r.turns + " 段 · " + r.chars + " 字 · " + Math.round(r.share * 100) + "%"))))) : null,
            output && kind === "script" ? h(
              "section",
              { style: card, "aria-label": "程序检查结果" },
              h("h3", null, "程序检查"),
              h("p", { className: check.ok ? "script-muted" : "" }, check.ok ? "格式检查通过" : visibleIssueCount + " 项待核对 · 按位置排列"),
              h(
                "div",
                { className: "script-check-groups" },
                ...checkGroups.map((group) => h(
                  "details",
                  { key: group.key, open: true },
                  h("summary", null, group.label + " · " + group.issues.length + "项"),
                  h(
                    "ul",
                    null,
                    ...group.issues.map((issue, i) => h(
                      "li",
                      { key: i },
                      h("span", null, issue.message),
                      issue.role ? h("small", { className: "script-muted" }, "角色：" + issue.role) : null,
                      issue.excerpt ? h("blockquote", null, issue.excerpt) : null
                    ))
                  )
                ))
              ),
              check.issues.length ? h(Button, { disabled: busy || !!project.pending, onClick: () => submitTask(phase, "仅修复以下问题，保持其余内容：\n" + check.issues.map((issue) => issue.message).join("\n")) }, "修复检查问题") : null
            ) : null,
            humanizeCheck ? h("section", { style: card }, h("h3", null, "润色自检"), h("p", null, humanizeCheck.ok ? "未命中预设表达" : humanizeCheck.issues.map((issue) => issue.message).join("；"))) : null,
            reports.length ? h("section", { style: card }, h("h3", null, "本稿审稿记录"), h("p", null, reports.length + " 份报告"), h("div", { style: row }, h(Button, { onClick: () => setTab("reports") }, "查看审稿记录"), h(Button, { disabled: busy || !!project.pending, onClick: () => {
              const latestReport = reports.at(-1);
              setRevision("参考以下审稿意见，修复明确问题，保持已正确部分：\n" + latestReport.text);
            } }, "按最新意见返修"))) : null,
            project.versions.length > 1 ? h("section", { style: card }, h("h3", null, "版本对照"), h("select", { "aria-label": "对照旧稿", style: input, value: compareId, onChange: (e) => setCompareId(e.target.value) }, h("option", { value: "" }, "选择对照稿"), ...project.versions.filter((v) => v.id !== chosen?.id).map((v) => h("option", { key: v.id, value: v.id }, "v" + (project.versions.indexOf(v) + 1) + " · " + { idea: "思路", outline: "大纲", script: "剧本" }[WM.artifactKind(v)])))) : null
          )
        );
      }
      function reportsView() {
        return h(
          "section",
          { style: card },
          h("h2", null, "审稿与提取记录"),
          h("p", { className: "script-muted" }, "报告按来源版本归档，不替换稿件。"),
          ...(project.reports || []).slice().reverse().map((report, index) => {
            const sourceIndex = project.versions.findIndex((v) => v.id === report.sourceVersionId);
            const source = sourceIndex >= 0 ? project.versions[sourceIndex] : null;
            const sourceLabel = source ? "来源 v" + (sourceIndex + 1) + " · " + (source.id === project.currentVersionId ? "已采用稿" : "候选稿") : report.sourceVersionId ? "来源稿已不存在" : "历史报告 · 来源未记录";
            return h(
              "details",
              { key: report.id, style: { ...card, background: T.layer2 }, open: index === 0, title: "来源版本：报告单独归档，原稿保留。" },
              h("summary", null, new Date(report.createdAt).toLocaleString() + " · " + sourceLabel),
              h("p", { className: "script-report-context" }, sourceLabel + "；以下为报告原文。"),
              h("pre", { className: "script-material-text script-report-body" }, report.text),
              h(Button, { disabled: busy || !!project.pending || !source, onClick: () => {
                setSelectedVersion(report.sourceVersionId);
                setRevision("参考以下审稿意见，修复明确问题，保持已正确部分：\n" + report.text);
                setTab("result");
              } }, "以来源稿按意见返修")
            );
          }),
          !(project.reports || []).length ? h("p", null, "暂无报告。可在稿件工作区审稿或提取人物卡。") : null
        );
      }
      return h(
        "div",
        { className: "script-workbench", style: { "--script-font": fontScale === "large" ? "17px" : "14px" } },
        h("style", null, WORKBENCH_CSS),
        h(
          "header",
          { className: "script-header" },
          h("div", null, h("p", { className: "script-eyebrow" }, "SCRIPT WORKBENCH"), h("h1", null, "剧本工作台"), h("p", { className: "script-muted" }, "选题 · 结构 · 对白 · 返修")),
          h(Button, { onClick: () => ctx.layout.selectPanel(null), title: "返回DSH当前会话，项目保留" }, "返回会话"),
          h("details", { className: "script-settings" }, h("summary", null, "工作台设置"), h(
            "div",
            { style: card },
            h("p", { className: "script-muted" }, "版本 " + CURRENT_VERSION),
            h("div", { style: row }, h(Button, { disabled: checking, onClick: checkUpdate }, checking ? "检查中…" : "检查更新"), h(Button, { onClick: () => setShowHint(!showHint) }, "工作台说明"), h(Button, { onClick: () => {
              setOnboard(true);
              setTab("create");
            } }, "重新打开引导"), h(Button, { onClick: () => {
              const next = fontScale === "large" ? "normal" : "large";
              setFontScale(next);
              try {
                localStorage.setItem(fontScaleKey, next);
              } catch {
              }
            } }, fontScale === "large" ? "标准字号" : "大字号")),
            h("hr", null),
            h("div", { style: row }, h(Button, { onClick: () => download(project.title + "-项目备份.json", WB.exportBackup(project), "application/json") }, "导出项目备份"), h("label", null, "导入备份 ", h("input", { type: "file", accept: ".json", onChange: importBackup, style: { maxWidth: "100%" } }))),
            h("label", null, "关联会话", h("select", { style: input, value: project.sessionId, disabled: !!project.pending, onChange: (e) => change({ sessionId: e.target.value }) }, h("option", { value: "" }, "自动新建"), ...sessions.map((session) => h("option", { key: session.id, value: session.id }, session.title || session.displayTitle || "未命名会话")))),
            project.sessionId ? h(Button, { onClick: () => ctx.uiWorkspace.openSession(project.sessionId) }, "打开关联会话") : null,
            h(Button, { onClick: deleteProject, disabled: !!project.pending || busy }, "删除当前项目")
          ))
        ),
        onboard ? h(
          "section",
          { className: "script-onboard", "aria-label": "上手引导" },
          h("div", { className: "script-section-heading" }, h("h2", null, "从哪儿开始？"), h(Button, { onClick: dismissOnboard }, "跳过引导")),
          h("p", { className: "script-muted" }, "有稿直接改，没稿从一句话选题开始；也可以先看一个完整示例，理解四个分区。"),
          h(
            "div",
            { className: "script-onboard-actions" },
            h(Button, { primary: true, onClick: () => {
              setTab("create");
              dismissOnboard();
              setNotice("在创作简报粘贴原稿，或选择模式后生成。");
            } }, "带稿工作"),
            h(Button, { primary: true, onClick: () => {
              setTab("create");
              dismissOnboard();
              setNotice("填写选题与约束，生成思路、大纲或完整剧本。");
            } }, "从零创作"),
            h(Button, { onClick: loadExample }, "先看一个示例项目")
          )
        ) : null,
        h(
          "section",
          { className: "script-projectbar" },
          h("label", null, "项目", h("select", { "aria-label": "切换项目", style: { ...input, margin: 0, maxWidth: 230 }, value: project.id, onChange: (e) => setStore((current) => ({ ...current, activeId: e.target.value })) }, ...store.projects.map((p) => h("option", { key: p.id, value: p.id }, p.title + (p.pending ? " · 运行中" : ""))))),
          h("label", { className: "script-project-title" }, "名称", h("input", { "aria-label": "项目名称", style: { ...input, margin: 0 }, value: project.title, onChange: (e) => change({ title: e.target.value }) })),
          h(Button, { onClick: addProject }, "新建项目")
        ),
        h(
          "div",
          { className: "script-feedback" },
          h("div", { role: "status", "aria-label": "项目保存状态", className: "script-save-feedback", "data-error": store.blocked || /暂停|失败/.test(saveStatus) ? "true" : void 0 }, h("strong", null, "项目保存"), h("span", null, store.blocked ? store.error || "保存暂停，请处理存档冲突" : saveStatus || "读取草稿…")),
          h("div", { role: "status", "aria-label": "AI任务状态", className: "script-ai-feedback" }, h("strong", null, "AI任务"), h("span", null, busy ? taskStatus || "准备提交…" : project.pending ? "运行中 · " + ({ idea: "生成思路", "idea-opt": "优化思路", outline: "生成大纲", "outline-opt": "优化大纲", full: "生成剧本", revision: "定向返修", polish: "文字润色", audit: "审稿 / 提取", persona: "人设处理" }[project.pending.phase] || "处理中") : project.retry ? "上次未完成 · 可重试" : "就绪"))
        ),
        store.conflict ? h("section", { style: card }, h("p", null, "其他标签页已更新项目，本页内容保留。"), h(Button, { onClick: () => {
          const disk = loadCatalog();
          if (disk.blocked) {
            setNotice(disk.error);
            return;
          }
          const copies = store.projects.map((item) => WM.forkProject(item, { id: uid(), title: item.title + "（本页副本）" }));
          revisionRef.current = disk.revision || 0;
          setStore({ projects: [...disk.projects, ...copies], activeId: copies[0].id, blocked: false });
        } }, "保留双方项目副本")) : store.blocked ? h("section", { style: card }, h("p", null, store.error), h(Button, { onClick: () => {
          try {
            const raw = localStorage.getItem(catalogKey);
            if (raw) localStorage.setItem(catalogKey + ".corrupt." + Date.now(), raw);
            localStorage.removeItem(catalogKey);
            revisionRef.current = 0;
            setStore((old) => ({ ...old, blocked: false }));
          } catch (error) {
            setNotice(error.message);
          }
        } }, "备份异常存档并保存当前内容")) : null,
        showHint ? h("section", { style: card }, h("strong", null, "编导辅助工作台"), h("p", null, "从创作简报发起任务，或载入已有稿件直接审稿、润色、定向返修。候选稿与已采用稿分开，审稿报告独立归档；人物、样稿与保护项由编导维护。"), h(Button, { onClick: () => setShowHint(false) }, "收起说明")) : null,
        updateError ? h("p", { role: "alert", style: { color: T.error } }, updateError) : null,
        update?.available && dismissed !== update.latest ? h("section", { style: card }, h("strong", null, "发现新版 v" + update.latest), h("details", null, h("summary", null, "更新说明"), h("pre", { className: "script-material-text" }, update.notes)), h("div", { style: row }, h(Button, { onClick: installUpdate, disabled: busy }, "检查安装方式"), h(Button, { onClick: downloadUpdate }, "下载新版安装包"), h(Button, { onClick: () => setDismissed(update.latest) }, "稍后处理"))) : null,
        importPreview ? h(
          "section",
          { "aria-label": "素材导入预览", style: { ...card, borderColor: T.brand } },
          h("h2", null, "素材导入预览"),
          h("p", null, "目标项目：" + (store.projects.find((p) => p.id === importPreview.ownerId)?.title || "原项目")),
          ...importPreview.entries.map((entry) => h("details", { key: entry.id }, h("summary", null, entry.name + " · " + entry.text.length + " 字"), h("pre", { className: "script-material-text" }, entry.text.slice(0, 1500)))),
          importPreview.errors.length ? h("p", { role: "alert" }, importPreview.errors.join("；")) : null,
          h("label", null, "载入方式", h("select", { style: input, value: importStrategy, onChange: (e) => setImportStrategy(e.target.value) }, h("option", { value: "materials" }, "保存为独立素材（不覆盖原稿）"), h("option", { value: "append" }, "追加到原稿 / 证据"), h("option", { value: "replace" }, "替换原稿 / 证据（所有已选文字合并）"))),
          h("div", { style: row }, h(Button, { primary: true, onClick: applyImport }, "确认导入"), h(Button, { onClick: () => setImportPreview(null) }, "取消"))
        ) : null,
        notice ? h("div", { role: "status", "aria-label": "操作反馈", className: "script-notice" }, notice) : null,
        project.pending ? h("div", { className: "script-taskbar", "aria-label": "任务操作" }, h("span", { "aria-live": "off" }, "已用 " + elapsed + " 秒 · 结果保存为新版本"), project.pending ? h("div", { style: row }, h(Button, { onClick: () => ctx.uiWorkspace.openSession(project.sessionId) }, "查看任务"), h(Button, { disabled: busy, onClick: async () => {
          const id = project.id, pending = project.pending;
          try {
            await ctx.sessions.using(project.sessionId, { source: "controllerOperation" }, async (reference) => {
              const result = await reference.binding.session.cancel();
              if (!result.ok) throw result.error;
            });
            setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === id && item.pending?.taskId === pending.taskId ? { ...item, pending: null, retry: { phase: pending.phase, instruction: pending.instruction, repairCount: pending.repairCount, request: pending.request, reason: "任务已停止" } } : item) }));
          } catch (error) {
            setNotice(error.message);
          }
        } }, "停止")) : null) : null,
        project.retry && !project.pending ? h("section", { style: card }, h("strong", null, "上次任务未完成"), h("p", null, project.retry.reason), h(Button, { disabled: busy, onClick: () => submitTask(project.retry.phase, project.retry.instruction, project.retry.repairCount, void 0, project.retry.request) }, project.retry.request ? "按原输入重试" : "按当前资料重新提交")) : null,
        h("nav", { "aria-label": "剧本工作区", className: "script-tabs" }, ...[["create", "创作简报"], ["result", "稿件工作区"], ["library", "人物与样稿"], ["reports", "审稿记录"]].map(([key, label]) => h(Button, { key, primary: tab === key, "aria-current": tab === key ? "page" : void 0, onClick: () => setTab(key) }, label + (key === "reports" && project.reports?.length ? " · " + project.reports.length : "")))),
        tab === "result" ? resultView() : tab === "reports" ? reportsView() : h("fieldset", { disabled: busy || !!project.pending, style: { border: 0, padding: 0, margin: 0, minWidth: 0 } }, tab === "library" ? libraryView() : creativeForm())
      );
    }
    function Icon({ size = 20 }) {
      return h("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": true }, h("rect", { x: 4, y: 2, width: 16, height: 20, rx: 3, fill: "none", stroke: "currentColor", strokeWidth: 1.6 }), ...[7, 12, 17].map((y) => h("path", { key: y, d: "M8 " + y + "h8", stroke: "currentColor", strokeWidth: 1.6 })));
    }
    return {
      inject: ["slots", "sessions", "uiWorkspace", "layout", "fileUpload", "remote", "remote.session"],
      apply(ctx) {
        ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: "elderly-script", order: 20, label: "剧本工具" }, Icon));
        ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: "elderly-script" }, () => h(MainPanel, { ctx })));
        ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
          name: "conversation.session.header.utilities",
          id: "elderly-script-shortcut",
          order: 20
        }, () => h("button", {
          type: "button",
          "aria-label": "打开剧本工作台",
          title: "打开剧本工作台，保留当前会话",
          onClick: () => ctx.layout.selectPanel("elderly-script"),
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 9px",
            minHeight: 32,
            border: "1px solid " + T.border,
            borderRadius: 8,
            background: T.layer1,
            color: T.text,
            font: "inherit",
            fontSize: 12,
            whiteSpace: "nowrap",
            cursor: "pointer"
          }
        }, h(Icon, { size: 16 }), "剧本工作台")));
      }
    };
  }
});
