window.__ModuleLoader__.load({
  id: '@local/elderly-script',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    const SHORT_VIDEO_RULES = "---\nname: jc-xiachen-duanshipin-jiaoben\ndescription: Use when a user wants a family-ethics video turned into a shoot-ready master script, or wants a high-fidelity adaptation of an existing master script for a new relationship, setting, cast, prop, budget, or duration.\n---\n\n# 下沉短视频剧本\n\n把原生理解的视频写成可复拍的母版，并沿同一结构指纹继续改编。核心原则：先看懂真实视听证据，再写执行稿；改编保留爆款机制，不得只换名字。\n\n## 路由\n\n- 用户提供视频并要求“扒片、扒剧本、写拍摄稿”：进入**扒片模式**。\n- 用户提供母版拍摄稿及新要求：进入**改编模式**。\n- 用户说“根据刚才的剧本”：读取当前会话最近生成且唯一匹配的项目；有多个候选且无法唯一判断时，请用户指定，不凭印象重建。\n\n开始前读取 [工作模式与输入输出](references/工作模式与输入输出.md)。扒片和改编都必须读取 [最终拍摄稿模板](references/最终拍摄稿模板.md)；改编另读 [高保真改编规则](references/高保真改编规则.md)。按任务需要读取 [类型与目标受众](references/类型与目标受众.md)、[爆款结构组件库](references/爆款结构组件库.md)、[工具启动条件](references/工具启动条件.md)、[反例与风险边界](references/反例与风险边界.md) 和 [结构金标准样例](references/结构金标准样例.md)。可复制 [拍摄稿资产模板](assets/shooting-script-template.md) 作为骨架。\n\n## 原生视频理解优先\n\n默认由当前多模态模型直接联合分析画面、镜头、动作、表情、站位、台词、字幕、环境声、音乐、沉默和空间进入顺序；**默认不调用** FFmpeg、拆帧、音频提取或 Whisper。\n\n仅在用户明确要求工具、逐字字幕、精确时间轴或可审计证据，模型无法读取媒体，或人名、金额、日期、亲属关系、改变剧情因果的关键台词等**关键事实**不确定/冲突时启动工具。能确认局部就只做**局部复核**，不默认全片重处理。详见 [工具启动条件](references/工具启动条件.md)。\n\n## 必做流程\n\n1. 扒片先提取结构指纹，再输出同等证据粒度的完整母版拍摄稿；视频未出现且无法可靠推断的关键事实不得编造，必须先向用户确认；只能现场决定的非关键项标明实际负责人和时点，例如 `【待现场确认：责任人=现场制片；时点=开拍前】`。\n2. 改编先列锁定项、可替换项和冲突，再按母版的钩子功能、人物功能位、阻力/证据顺序、空间推进、阶段奖励、兑现类型、结尾债务和主要争议重写故事外壳。\n3. 保存到 `短视频剧本项目/<视频文件名>/`：扒片写 `母版拍摄稿.md` 与 `结构指纹.md`；改编另写 `改编要求.md` 与递增版本的 `改编拍摄稿-v1.md`。\n4. 交付前检查八个栏目、顶层 `登场人物/空间路径`、逐场 `出场人物/空间动作`、人物关系、空间顺序、时长预算、证据边界和禁区；运行 `scripts/validate_shooting_script.py`。校验失败必须修正并重跑，不交付失败稿。\n\n## 不可违反\n\n- 不得编造视频事实、后台数据、医学因果或未确认的连续剧情。\n- 不生成小号冒充真人、虚假评论或操纵舆论方案；只分析自然争议，并可写官方账号透明置顶评论。\n- 自然手持可以保留，但不以剧烈晃动、故意穿帮或失控收音冒充真实。\n- 门未打开前不展示门内信息；人物、道具和行动必须连续。\n- 扒片时长服从原片；高保真改编默认在母版时长 `±15%`，用户指定时长优先，并同步重分配台词、动作、走路与沉默。\n\n\n# 反例与风险边界\n\n## 证据边界\n\n当前校准只有 4 个用户确认爆款，具体播放、留存、完播、互动和涨粉数未提供。不得从“爆款”倒推出每段重复、每秒停顿、某种时长或具体道具都有效，不编造数值或算法权重。\n\n## 已知反例\n\n- 开头不必固定用前情大字：对白也能交代关系；钩子可先给目标、承诺或损失结果。\n- 事件集常用现场阻力，但角色告白集可用信息揭露阶梯和代价升级推进。\n- 动作高潮不是必需：阵营/信任变化可形成部分接纳，因果真相可形成解释兑现。\n- 长情绪尾段不是必需；保留反应同时评估中途弃看风险。\n- 多场景不是必需；单一客厅只要持续改变立场、证据或帮助程度也有进展。\n- 儿童不必完成指定动作；熟睡、怕生等自然状态本身可作视觉证据。\n- 大门、豪门、记者、核桃、伪纪录片均是故事变量，不是通用爆款组件。\n- 直接回应“这是剧本”可能引发真实性讨论，也可能提醒怀疑并反噬，只能作为账号已有语境下的高风险单集策略。\n\n## 真实性与拍摄\n\n- 允许自然手机手持、真实停顿、卡壳和儿童反应；不得要求故意剧烈晃动、穿帮、失焦、错误收音或伪造偷拍/记者身份来冒充真实。\n- 不为制造争议而隐瞒拍摄风险、医学常识或法律边界。\n- 不把未出现的姓名、疾病症状、证明材料、聊天记录、人物关系或倒叙写成事实。\n- 证据状态不可升级：不能把“可以拿病历”写成现场取出病历袋，不能把“愿意提供材料”写成材料已经在场或被查看，也不能把“当场出示”写成已经核验。\n- `【待现场确认】` 不是偷懒占位符：关键事实交付前必须确认；只能现场决定的非关键项必须填写实际负责人和时点，例如 `【待现场确认：责任人=现场制片；时点=开拍前】`，不能保留“姓名、某人、待定”等模板词。\n\n## 运营禁区\n\n不生成小号冒充真人、不写虚假观众评论、不组织两派带节奏、不编造后台数据。可以列自然争议问题、不同可辩护立场、评论风险，以及官方账号透明署名的置顶回复。\n\n## 内容风险\n\n- 儿童、残障人士、老人等不可控或脆弱主体：动作以安全和真实状态为先，不强迫哭、摔、吞咽小物或反复刺激。\n- 医学、亲子鉴定、户籍、抚养、养老等关键结论：只写已证实内容；剧情化表达不能伪装专业建议。\n- 对目标受众做语言适配，不使用贬损、污名或智力刻板印象。\n- 冲突应围绕关系和责任；极端羞辱、暴力、跪地、砸物等只有原片证据或用户明确需求且安全合规时才能出现，不能作为默认加码。\n\n\n# 工作模式与输入输出\n\n## 扒片模式\n\n输入为可读取视频，以及可选的人名、账号背景、连续剧情状态、时长或拍摄限制。先用原生视听联合分析建立证据表，再提取结构指纹，最后直接生成完整母版，不另交付一份冗余“事实还原稿”。\n\n### 证据表\n\n按时间顺序记录可见/可听事实：人物、位置、动作、表情、台词要义、字幕、声音、停顿、镜头变化和空间开闭。区分：\n\n- 明确：画面与声音共同支持，可写成确定内容。\n- 可合理概括：不改变事实的口语化归纳。\n- 不确定但影响拍摄：关键事实先向用户确认；只能现场决定的非关键项填写实际负责人和时点，例如 `【待现场确认：责任人=现场制片；时点=开拍前】`，不得补全事实或保留模板占位词。\n- 不影响因果的小口误、语气词：无需工具复核。\n\n### 证据状态不可升级\n\n对病历、照片、鉴定、聊天记录、现金、合同等关键材料，先标明原片状态：`提及 → 承诺提供 → 实物在场 → 当场出示 → 已经核验`。后一级必须有原片画面或声音支持；成稿的准备清单、人物动作、台词、花字和爆点只能保持原状态，不能自行向后升级。\n\n- 原片只说“可以拿来、下次带、愿意提供”，状态是**承诺提供**：只保留口头承诺，不把材料加入本集道具清单，不写掏出、递交、展示或他人查看。\n- 原片只拍到材料在场但没有打开，状态是**实物在场**：可以写持有人和位置，不能写内容已被看见或确认。\n- 原片有人查看材料但没有得出结论，状态是**当场出示**：可以写查看动作，不能写已经核验。\n- 只有原片明确完成核验并给出结果，才能写**已经核验**；仍要区分角色说法与客观结论。\n\n### 结构指纹\n\n必须单独保存并覆盖：开场钩子功能、核心关系、单集诉求、人物功能位、空间门槛、阻力升级链、证据阶梯、阵营问题、阶段性奖励、情绪兑现类型、结尾追更债务、自然争议点、真实感来源、本集在连续剧情中的任务。\n\n### 输出\n\n写入：\n\n```text\n短视频剧本项目/<视频文件名>/\n├── 母版拍摄稿.md\n└── 结构指纹.md\n```\n\n母版遵守 [最终拍摄稿模板](最终拍摄稿模板.md)，粒度足以让导演、演员、摄影和剪辑不回看原片也能执行；可执行性不能以新增原片没有的证据、道具或动作换取。\n\n## 改编模式\n\n输入为已保存或用户明确指定的母版、对应结构指纹，以及人物、关系、题材、场景、道具、预算、时长等新要求。找不到可识别母版时要求用户指定。\n\n先生成改编对照：`母版结构项 → 新故事实现 → 是否锁定 → 冲突/补偿`。再按 [高保真改编规则](高保真改编规则.md) 写完整新稿，不能把结构对照当成最终拍摄稿。\n\n写入同一项目：\n\n```text\n├── 改编要求.md\n└── 改编拍摄稿-v1.md  # 后续递增 v2、v3\n```\n\n## 冲突处理\n\n- 要求与母版结构冲突：明确指出冲突，采用最接近母版机制且满足用户核心意图的实现，并说明补偿；不得静默破坏结构。\n- 多项要求互相矛盾：若无不改变核心意图的唯一解，列出冲突并请用户选择。\n- 连续剧情资料冲突：以用户最新明确事实为准，保留变更记录；研究编号、文件顺序和推测不得冒充剧内顺序。\n- 视频读取失败：报告失败并按工具条件尝试；仍无法获得可靠证据则停止，不生成想象剧情。\n\n## 完成定义\n\n两种模式都必须输出八段式完整拍摄稿、顶层 `登场人物/空间路径` 声明、逐场 `位置/出场人物/空间动作` 等完整字段、明确时长预算并通过交付前校验。所有逐场人物必须来自顶层声明；第一场从空间路径起点开始，后续位置只能停留或走到下一节点，不得跨级或跳到路径外；离场回到旧地点时必须把该地点再次列入完整行程。仍含 `【待现场确认】` 的关键项必须先向用户确认；确实只能现场决定的非关键执行项必须填写实际负责人和确认时点，不得保留“姓名、某人、待定”等模板占位词。\n\n\n# 工具启动条件\n\n## 默认路径\n\n原生视频理解优先。当前多模态模型直接联合读取画面、音轨、字幕和时间关系，默认不调用 FFmpeg、ffprobe、拆帧、音频提取、OCR 或 Whisper。工具不是“更专业”的固定步骤，而是特定精度或可读性问题的备用取证路径。\n\n## 允许启动\n\n满足任一项才启动：\n\n1. 用户明确要求转字幕、拆帧、精确时间轴、工具分析或工具复核；\n2. 当前模型无法读取视频、画面或音轨；\n3. 人名、金额、日期、亲属关系等关键事实不确定；\n4. 关键台词的不同听法会改变剧情因果；\n5. 画面字幕与声音内容冲突；\n6. 用户要求逐字字幕、精确到秒的镜头长度或可审计证据。\n\n普通语气词、无关口误、口音细节和不影响剧情的小误差不触发工具。\n\n## 最小范围原则\n\n先记录需要回答的精确问题、对应大致时间段和所需证据类型。能局部复核就只截对应片段/帧/音频，不默认全片拆帧或双模型转写。输出中区分原生观察、工具证据和仍未确认项。\n\n备用脚本 `scripts/extract_video_evidence.py` 只能由用户要求或上述条件显式触发；不得在 Skill 启动、视频上传或扒片模式中自动运行。\n\n## 失败处理\n\n- 无法读取：说明具体失败点，再尝试最小备用路径。\n- 工具不可用：报告依赖/格式问题，不能假装已复核。\n- 多源冲突：保留冲突，优先可见原始证据；影响因果且无法裁决时向用户确认，不能留给拍摄现场猜测。\n- 工具结果只用于补证，不取代对动作、表情、空间、沉默和环境声的联合理解。\n\n\n# 最终拍摄稿协议\n\n每份母版与改编稿必须依次包含以下八部分，不得用剧情梗概代替。\n\n## 1. 剧本标题与本集任务\n\n写标题、版本、目标总时长、母版/改编来源、本集在连续剧情中的任务，以及一句话核心关系与结果期待。另用 `登场人物：` 声明全稿可出现的人物，用 `空间路径：外部 > 门槛 > 内部` 声明本集允许的真实进入顺序；人物或地点变化时必须同步更新声明。\n\n## 2. 拍摄前必看\n\n写画幅、设备、可接受的手持程度、收音、光线、表演口径、空间连续性和安全要求。普通手机可完成；自然手持不等于故意剧烈晃动，低制作感不等于关键动作和收音失控。\n\n## 3. 准备清单\n\n按场景、道具、服装妆发、人物初始状态、儿童/不可控主体预案分类。道具必须说明由谁持有、何时出现、承担什么证据或关系功能。\n\n## 4. 人物表演规则\n\n逐角色写：功能位、当场目标、外显动作、情绪上限、说话节奏、与他人的称呼和禁演项。不要只贴“善良、强势”等抽象标签。\n\n## 5. 逐场、逐镜头拍摄剧本\n\n每场至少包含：\n\n```text\n【场次 / 预计时长 / 本场功能】\n位置：\n出场人物：只能填写“登场人物”中已声明的角色\n空间动作：写清进入、退出、门的开闭及本场结尾空间状态\n镜头怎么拍：景别、机位、运动、切换点、关键可见信息\n人物动作：谁先做什么，其他人如何反应\n台词：按角色逐句，口语、短句、可表演\n屏幕花字：内容、出现点；没有则写“无”\n环境音 / BGM：来源、进入/退出点；没有则写“仅现场声”\n沉默和停留时间：具体秒数及作用\n剪辑注意事项：保留点、可压缩点、空间/道具连续性\n本场功能：说明本场改变了哪项关系、阻力、证据、帮助程度或追更债务\n```\n\n第一场位置必须匹配空间路径起点；后续场次只能停留或进入路径中的下一节点，不得跨级或使用路径外地点。空间路径写本集完整行程，离场返回旧地点时把该地点再次写入路径，例如 `院门外 > 客厅 > 院门外`；未声明回程就不能倒退。门、楼梯、院子、客厅等必须按真实开闭和行进顺序拍；门未打开前不能泄露门内信息，也不能写人物直接进入门内。儿童自然反应可以改变节奏，但不得诱导危险动作或把偶然表现写成必成镜头。\n\n## 6. 本集爆点与伏笔\n\n列出钩子如何回收、阻力/证据如何升级、阶段性奖励、兑现类型、未还清的关系债务和下一集可回答的具体问题。伏笔必须已在画面、台词或道具中建立。\n\n## 7. 剪辑与发布建议\n\n写总时长与分场预算、必须保留的动作/停顿/环境音、字幕可读性、BGM边界、封面候选、标题候选、自然评论争议点和官方账号透明置顶评论建议。不得生成虚假账号、冒充真人评论或虚构后台数据。\n\n## 8. 拍摄验收表\n\n逐项勾验：栏目完整、关系一致、称呼一致、人物出入连续、门和空间连续、道具连续、关键证据拍清、每场时长有预算、总内容量匹配目标时长、台词可说、声音可用、花字与事实一致、未确认项已解决、禁区未触发。\n\n## 时长核算\n\n- 扒片：以原视频实际时长为基准，允许镜头层级的合理估算，但不得把估算写成精确事实。\n- 改编：默认母版总时长 `±15%`；用户明确指定时长时，以用户要求为准。\n- 分场时长之和必须等于目标总时长；目标可写秒、分钟或“分+秒”，校验时统一换算为秒。改变总时长必须同步增删对白、动作、走路和沉默，不能只改标题数字。\n\n\n# 爆款结构组件库\n\n把组件按“功能”迁移，不照抄样本人物、豪门、记者或道具。\n\n## 开场钩子\n\n首屏先识别核心亲缘/伦理关系，并给出结果期待：可以是行动目标、已被打破的承诺，或尚未解释的巨大损失。关系先行不等于没有悬念，悬念可转为“如何得到、为何失去、要付什么代价”。\n\n## 人物功能位\n\n- 诉求者：承担单一、可复述的本集目标。\n- 缺席/延迟目标：被反复谈论，出现或回应即构成回报。\n- 门槛守卫者：控制空间、信息、资源或接触权。\n- 可争取决策者：态度变化形成阶段奖励。\n- 怀疑派与辩护派：分别承担清楚的观众立场；非必要不扩角色。\n- 儿童/依赖者：关系核心、视觉证据或行动触发者，不是台词工具。\n- 观众：告白型单集中可被设为倾诉与判断对象。\n\n## 阻力与证据阶梯\n\n事件集的阻力每轮必须加价或换形：拒绝行动 → 质疑身份 → 提高证明门槛 → 限制关系 → 增加现实代价。守门人可更换，阻力不能只是同义争吵。\n\n证据从弱到强布置：持续行动、具体照料、可见相似/旧物、拒绝不当利益、可核验材料、目标人物确认。证据强度不得超过已知事实；扒片时还要保持材料的原始状态，不能把口头承诺升级成实物在场、当场出示或已经核验。生活照料清单只有在证明长期照护能力或抬高分离成本时才保留。\n\n角色告白集无现场对手时，用因果揭露和代价升级替代：关系建立 → 误解/选择 → 不可逆后果 → 当下困境 → 残酷选择。只有情绪形容而无新因果属于纯重复。\n\n## 空间推进\n\n门外、院内、楼门、客厅等空间门槛可视化家庭准入和权力变化。单场景也能成立，但每一段必须改变阵营、证据、帮助程度或因果理解。空间严格按真实开闭和进入顺序。\n\n## 四类阶段奖励\n\n1. **得到型**：相认、拥抱、获准见面。\n2. **失去型**：交出孩子、被迫离开、关系被切断。\n3. **部分接纳型**：获准进门、被相信、留下联系方式、获得临时帮助。\n4. **解释型**：回收开头损失，补齐前史并完成动机辩护。\n\n兑现后可留人物反应供情绪消费，但长度服从实际表演与时长预算，不把所有拖尾视为有效。\n\n## 追更债务\n\n结尾留下已建立但未解决的具体关系问题：缺席者何时回应、身份如何核验、照护责任归谁、阶段接纳是否反转。可以不用口播“下集见”；固定人物旧账、状态损失和主目标前进一步都能形成追更。\n\n## 自然争议\n\n从剧情事实提炼两种以上可辩护立场，例如责任与边界、动机与证据、亲权与照护。家庭议事厅可让角色承担不同判断。只输出争议问题和官方账号可透明表达的立场，不伪造评论。\n\n\n# 类型与目标受众\n\n## 类型\n\n主要适用于“大众家庭伦理强情绪连续短剧”：以婆媳、夫妻、亲子、认亲、背叛、养老、贫富差异等高识别关系为核心，用口语对白、明确立场、连续阻碍和充分情绪回报推动观看与追更。\n\n关系先于背景。冷观众应尽快明白“谁找谁、谁拦谁、谁受委屈、这一集要解决什么”，不需要先掌握完整世界观。\n\n## 已知受众事实\n\n用户指定的四个爆款样本约 95% 受众来自中国三四五线城市及农村地区，以低收入、受教育程度较低的人群为主。该事实只适用于这组账号样本，不外推到所有短剧或地区人群，也不得写成对个体智力、审美和行为的刻板印象。\n\n## 适配原则\n\n- 用具体称呼、行动词和可见因果降低理解门槛；关键关系可重申，但每次重复应恢复上下文、强化立场或增加代价。\n- 字幕服务静音理解，短句服务表演；不要机械堆语气词或把人物写成只会喊口号。\n- 核心争议优先来自亲权、养老义务、血缘、照护、家庭准入、动机与责任，而非生造误会。\n- 让受损者的诉求简单可识别，同时给对立方现实理由，形成可讨论的站队而非单薄脸谱。\n- 儿童健康可为寻亲、求助或接触家庭资源提供正当动机，但医学因果必须有证据，不能为了强情绪虚构。\n- 核心男性目标可延迟出现，让守门人、决策者和怀疑派先形成压力；延迟必须换来阶段奖励、信息或状态变化。\n- 角色可直接称目标受众为“叔叔阿姨”等可信任对象，经营倾诉关系；只在角色告白型单集和账号语气匹配时使用。\n\n## 评价口径\n\n同时检查关系识别、理解门槛、立场站队、冲突递进、情绪兑现、评论触发和连续追更。四个样本均为用户确认爆款，但没有具体后台字段；这些结论是候选方法和边界，不是最佳时长、留存率或因果公式。\n\n\n# 结构金标准样例\n\n本页只定义“成品应具体到什么程度”，不提供可照搬的故事。记者、认亲、豪门、旧核桃等是来源样本变量；通用稿必须换成当前视频的真实人物、关系、空间和证据。\n\n## 合格成品的纵向颗粒度\n\n1. 标题先写本集任务与目标时长，不用营销标题代替剧情任务。\n2. 拍摄前必看把设备、画幅、收音、光线、自然手持、空间和安全说清。\n3. 准备清单不仅列物件，还说明摆放、持有人、首次出现点和剧情功能。\n4. 表演规则逐人写目标、动作、节奏、情绪上限、称呼与禁演，不只写性格。\n5. 逐场从位置开始，写到镜头、动作、台词、花字、声音、沉默、剪辑和本场功能。\n6. 爆点与伏笔说明前文如何建立、何处回收、结尾还欠什么关系答案。\n7. 后期与发布建议有时长预算、保留点、字幕/BGM边界、封面标题和自然争议。\n8. 验收表让现场能逐项判断是否拍到、是否连续、是否能剪。\n\n## 抽象场次示例\n\n```text\n【场 2：第一道空间门槛 / 35 秒 / 把“想见人”升级成“必须证明有资格见”】\n位置：院门外；门初始关闭，镜头和人物都不越线。\n出场人物：诉求者、守门者、同行者。\n空间动作：诉求者和同行者停在院门外；守门者开门一条缝但不让路；本场结束无人跨过门槛。\n镜头怎么拍：中景跟诉求者走到门前；切手部按铃；回到双人中景等待；门只开一条缝后才出现守门者。\n人物动作：诉求者先按铃并退半步；守门者只露上身，不主动让路；同行者在对话第三轮才出示已确认的证明。\n台词：每轮短句。第一轮问来意，第二轮质疑关系，第三轮提高证明门槛；不得加入证据表中没有的姓名或材料。\n屏幕花字：首轮出现核心关系词；不写煽动性结论。\n环境音 / BGM：保留门铃、脚步和开锁声；此场不用 BGM。\n沉默和停留时间：守门者看到证明后停 2 秒，让态度变化可见。\n剪辑注意事项：开门前不能切门内反应；保留开锁声和守门者让出半步的动作。\n本场功能：把“想见人”升级成“必须证明有资格见”，建立第一道行动与关系门槛。\n```\n\n该示例展示的是“指令可执行 + 空间连续 + 功能明确”，不是要求每条视频都用院门、证明或三轮对话。\n\n## 真实感替换原则\n\n- 使用自然手持：跟随动作时有轻微呼吸感，关键证据出现时保持可辨认；不故意剧烈晃动。\n- 使用生活痕迹：只保留与人物状态和空间可信度有关的陈设，不按清单人为做旧。\n- 使用真实反应：允许停顿和儿童自然行为，但每段都说明可剪边界；不把笑场、口误和失控当必需品。\n- 使用透明运营：列出剧情天然产生的争议与官方置顶评论建议，不生成假账号评论。\n\n## 不合格降级\n\n以下任何一种都未达到金标准：只有剧情梗概；只有台词没有镜头/动作；准备清单与剧情无关；场次没有时间预算；门和人物突然跳空间；把推断写成事实；把具体样本道具当公式；发布建议包含虚假互动操作。\n\n\n# 高保真改编规则\n\n高保真改编是“锁定结构指纹，替换故事外壳”，不是逐句同义改写，也不是只换名字。\n\n## 默认锁定\n\n- 开场钩子的功能和信息顺序；\n- 人物功能位及数量级；\n- 阻力与证据的递进顺序；\n- 空间推进方式；\n- 阶段性奖励；\n- 高潮/情绪兑现类型；\n- 结尾追更问题的功能；\n- 主要评论争议的两难结构；\n- 本集在连续剧情中的任务。\n\n## 允许替换\n\n人名、身份、具体家庭关系、社会背景、可获得场景、道具与视觉证据、事件外壳，以及用户明确要求修改的结构项。所有替换都要因果等价：新道具必须承担原道具的证据功能，新角色必须承担原功能位，新空间必须保留相同的准入/权力变化。\n\n## 改编步骤\n\n1. 抄录母版结构指纹，不先写新剧情。\n2. 建立对照表：`结构项 | 母版实现 | 新实现 | 锁定/用户要求变化 | 风险与补偿`。\n3. 删掉没有对应功能的新增角色、支线、重病、事故、跪地、砸物、身份反转等强事件。\n4. 按相同升级轮数配置新阻力与证据；检查每轮是否改变风险、立场或证明门槛。\n5. 保持阶段奖励和兑现类型。母版是部分接纳，就不能擅自改成大团圆；母版是克制失去，就不能靠更惨事故替代。\n6. 按完整八段协议重写，不交付只有结构表或场次梗概的半成品。\n7. 做结构指纹逐项回查和时长核算。\n\n## 时长与容量\n\n默认总时长在母版 `±15%`。用户指定时长优先，但必须同步重新分配场次、对白、动作、走路和停顿。压缩优先删无功能重复与旁支；扩展优先增加反应、证据过程或空间行动，不新增结构层级。\n\n## 冲突\n\n用户要求改变锁定项时：先点明“哪项要求会改变母版的哪种机制”，再采用最接近母版且满足其核心意图的方案。能通过等价补偿解决时直接说明后执行；会产生两种明显不同成品且无法判断偏好时请用户选择。\n\n## 失败自检\n\n- 只替换人名、地点或名词，台词仍属于原关系。\n- 新增角色/支线导致功能位扩张。\n- 用更惨的疾病、事故、下跪、暴力替代原证据链。\n- 阻力轮数、顺序或目标被改变。\n- 高潮从得到变失去、从部分接纳变团圆，或反之。\n- 只改总时长数字，内容量未变。\n- 缺少逐场字段、准备、表演、发布或验收栏目。\n\n出现任一项即返工，不进入交付校验。\n\n\n# 《[剧本标题]》[母版/改编]拍摄稿\n\n## 1. 剧本标题与本集任务\n\n- 版本：\n- 来源项目/母版：\n- 目标总时长：\n- 本集任务：\n- 核心关系与结果期待：\n- 登场人物：\n- 空间路径：\n\n## 2. 拍摄前必看\n\n- 画幅与设备：默认 9:16，可按原片或用户要求调整；普通手机可完成\n- 手持与机位：\n- 收音与光线：\n- 表演口径：\n- 空间连续性：\n- 安全要求：\n\n## 3. 场景、道具、服装和人物状态准备清单\n\n### 场景\n\n| 场景 | 初始状态 | 进入顺序 | 剧情功能 |\n| --- | --- | --- | --- |\n|  |  |  |  |\n\n### 道具\n\n| 道具 | 持有人/位置 | 首次出现 | 证据或关系功能 |\n| --- | --- | --- | --- |\n|  |  |  |  |\n\n### 服装、妆发与人物初始状态\n\n| 人物 | 服装妆发 | 开场状态 | 连续性注意 |\n| --- | --- | --- | --- |\n|  |  |  |  |\n\n## 4. 人物表演规则\n\n| 人物 | 功能位/目标 | 动作与节奏 | 情绪上限 | 称呼 | 禁演项 |\n| --- | --- | --- | --- | --- | --- |\n|  |  |  |  |  |  |\n\n## 5. 逐场、逐镜头拍摄剧本\n\n### 【场 1：[场名] / 预计 [ ] 秒 / [本场功能]】\n\n- 位置：\n- 出场人物：\n- 空间动作：\n- 镜头怎么拍：\n- 人物动作：\n- 台词：\n- 屏幕花字：\n- 环境音 / BGM：\n- 沉默和停留时间：\n- 剪辑注意事项：\n- 本场功能：\n\n> 按相同字段继续增加场次。所有分场时长合计应与目标总时长一致。\n\n## 6. 本集爆点与伏笔\n\n- 开场钩子及回收：\n- 阻力/证据阶梯：\n- 阶段性奖励：\n- 情绪兑现类型：\n- 已埋伏笔：\n- 结尾追更债务：\n\n## 7. 剪辑与发布建议\n\n- 分场时长预算：\n- 必须保留的动作、停顿和环境音：\n- 可压缩部分：\n- 字幕与花字：\n- BGM：\n- 封面候选：\n- 标题候选：\n- 自然评论争议点：\n- 官方账号透明置顶评论建议：\n\n## 8. 拍摄验收表\n\n- [ ] 八个栏目齐全\n- [ ] 人名、关系、称呼和连续剧情一致\n- [ ] 人物出入、门的开闭和空间进入顺序连续\n- [ ] 道具持有人、位置和首次出现连续\n- [ ] 每场必需字段和时长预算齐全\n- [ ] 分场时长之和匹配目标总时长\n- [ ] 关键动作、证据、反应和声音拍清\n- [ ] 台词可说、字幕与事实一致\n- [ ] `【待现场确认：责任人=现场制片；时点=开拍前】` 等非关键现场项已填写实际负责人和确认时点\n- [ ] 未编造事实、医学因果或后台数据\n- [ ] 无冒充真人、虚假评论或操纵舆论方案\n";
// UPDATE_CORE_START
const CURRENT_VERSION = '1.2.0';
const REPOSITORY = 'OuyangLing1999/Dsh-scriptForGin';

function compareVersions(left, right) {
  const parse = (value) => {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value);
    if (!match) throw new Error('版本号格式不受支持：' + value);
    return match.slice(1).map(Number);
  };
  const a = parse(left), b = parse(right);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

async function checkForUpdates(fetcher = globalThis.fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetcher('https://api.github.com/repos/' + REPOSITORY + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 404
      ? '暂未发布正式版本，请稍后重试。'
      : response.status === 403 || response.status === 429
        ? 'GitHub 请求频率受限，请稍后重试。'
        : 'GitHub 返回 HTTP ' + response.status);
    const release = await response.json();
    if (release.draft || release.prerelease || typeof release.tag_name !== 'string') {
      throw new Error('GitHub 返回的正式版本信息不完整。');
    }
    const latest = release.tag_name.replace(/^v/, '');
    return {
      current: CURRENT_VERSION, latest,
      available: compareVersions(latest, CURRENT_VERSION) > 0,
      url: 'https://github.com/' + REPOSITORY + '/releases/tag/' + encodeURIComponent(release.tag_name),
      notes: typeof release.body === 'string' ? release.body.slice(0, 6000) : '',
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('检查更新超时，请检查网络后重试。');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// UPDATE_CORE_END
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

    const MODES = [
      { id: 'live', label: '老年直播·写剧本' },
      { id: 'live-opt', label: '老年直播·优化' },
      { id: 'duan-ba', label: '短视频·扒片' },
      { id: 'duan-adapt', label: '短视频·改编' },
    ];

    function MainPanel({ pluginCtx }) {
      const [mode, setMode] = useState('live');
      // 老年直播
      const [topic, setTopic] = useState('');
      const [roles, setRoles] = useState('主播：李姐；一麦：张姨；二麦：王叔');
      const [product, setProduct] = useState('');
      const [draft, setDraft] = useState('');
      const [optimizeNote, setOptimizeNote] = useState('');
      // 短视频
      const [videoPath, setVideoPath] = useState('');
      const [videoNote, setVideoNote] = useState('');
      const [masterDraft, setMasterDraft] = useState('');
      const [adaptNote, setAdaptNote] = useState('');
      // 会话
      const [sessions, setSessions] = useState([]);
      const [targetSession, setTargetSession] = useState('');
      const [useNew, setUseNew] = useState(true);
      const [busy, setBusy] = useState(false);
      const [notice, setNotice] = useState(null);
      const [checkingUpdate, setCheckingUpdate] = useState(false);
      const [updateResult, setUpdateResult] = useState(null);
      const [updateError, setUpdateError] = useState('');

      async function checkUpdate() {
        if (checkingUpdate) return;
        setCheckingUpdate(true);
        setUpdateError('');
        setUpdateResult(null);
        try {
          setUpdateResult(await checkForUpdates());
        } catch (error) {
          setUpdateError(error.message || '网络连接失败，请稍后重试。');
        } finally {
          setCheckingUpdate(false);
        }
      }

      useEffect(() => {
        let alive = true;
        function update() {
          if (!alive) return;
          const snapshot = pluginCtx.sessions.list.getSnapshot();
          const items = snapshot.ids.map((id) => snapshot.byId[id]).filter(Boolean)
            .map((item) => ({ ...item, sessionId: item.id }));
          setSessions(items);
          setTargetSession((previous) => items.some((item) => item.sessionId === previous)
            ? previous : (items.find((item) => !item.blank) || items[0])?.sessionId || '');
        }
        const unsubscribe = pluginCtx.sessions.list.subscribe(update);
        update();
        pluginCtx.sessions.refresh().catch((error) => {
          if (alive) setNotice({ kind: 'err', text: '读取会话列表失败：' + error.message });
        });
        return () => { alive = false; unsubscribe(); };
      }, [pluginCtx]);

      function buildPrompt() {
        if (mode === 'live') {
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
        if (mode === 'live-opt') {
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
        if (mode === 'duan-ba') {
          const target = videoPath.trim();
          return [
            '请调用 duanshipin-jiaoben skill，按其中「扒片模式」处理我提供的视频，输出可复拍的母版拍摄稿。',
            '',
            '视频文件：' + (target || '（未提供路径，请在会话中告诉我或直接上传）'),
            '补充说明：' + (videoNote.trim() || '无'),
            '',
            '要求：先建立证据表并区分证据状态，再提取结构指纹，最后按八段式拍摄稿协议输出完整母版；',
            '输出后保存到「短视频剧本项目/<视频文件名>/」目录：母版拍摄稿.md 与 结构指纹.md；',
            '定位插件随包 skills/duanshipin-jiaoben/scripts/validate_shooting_script.py 并运行校验。失败修正重跑；脚本未执行时明确标记未执行，不得声称 VALID。',
            '以实际可读取的视频证据为准；附件引用只在附件所在会话生效。关键证据缺失时先列待确认项，不补造剧情。',
          ].join('\n');
        }
        return [
          '请调用 duanshipin-jiaoben skill，按其中「高保真改编模式」改编我提供的母版拍摄稿。',
          '',
          '改编要求：' + (adaptNote.trim() || '按规范执行高保真改编：锁定结构指纹、替换故事外壳。'),
          '',
          '母版拍摄稿：',
          masterDraft,
          '',
          '要求：先输出结构对照表，再按八段式拍摄稿协议输出完整改编稿；保存「改编要求.md」，并检查已有文件后采用递增版本「改编拍摄稿-vN.md」，保留已有版本；',
          '时长默认在母版 ±15%，并同步重分配场次、对白、动作、走路和沉默；',
          '定位插件随包 skills/duanshipin-jiaoben/scripts/validate_shooting_script.py 并运行校验。失败修正重跑；脚本未执行时明确标记未执行，不得声称 VALID。',
          '以实际可读取的视频证据为准；附件引用只在附件所在会话生效。关键证据缺失时先列待确认项，不补造剧情。',
        ].join('\n');
      }

      async function submit() {
        if (busy) return;
        if (mode === 'live' && !topic.trim()) { setNotice({ kind: 'err', text: '请先填写剧本主题。' }); return; }
        if (mode === 'live-opt' && !draft.trim()) { setNotice({ kind: 'err', text: '请先粘贴需要优化的剧本。' }); return; }
        if (mode === 'duan-ba' && !videoPath.trim()) { setNotice({ kind: 'err', text: '请先填写视频文件路径（或先在会话中上传视频后引用）。' }); return; }
        if (mode === 'duan-adapt' && !masterDraft.trim()) { setNotice({ kind: 'err', text: '请先粘贴母版拍摄稿。' }); return; }

        setBusy(true);
        setNotice({ kind: 'info', text: '正在提交任务…' });
        try {
          let sessionId = targetSession;
          if (useNew || !sessionId) {
            sessionId = await pluginCtx.sessions.create({});
            if (!sessionId) throw new Error('会话创建失败');
          }
          const requestId = 'elderly-script-' + Date.now();
          const text = (mode.startsWith('duan-') ? '以下为内置短视频创作规范，按当前任务选择适用模式。无需依赖另装 skill。\n' + SHORT_VIDEO_RULES + '\n\n当前任务：\n' : '') + buildPrompt();
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
          pluginCtx.uiWorkspace.openSession(sessionId);
        } catch (e) {
          setNotice({ kind: 'err', text: '提交失败：' + (e && e.message ? e.message : String(e)) });
        } finally {
          setBusy(false);
        }
      }

      function modeButton(m) {
        const active = mode === m.id;
        return h('button', {
          key: m.id,
          onClick: () => setMode(m.id),
          style: {
            flex: '1 1 46%', padding: '10px 8px', fontSize: 13, fontWeight: 600,
            borderRadius: 10, cursor: 'pointer',
            border: '1px solid ' + (active ? T.brand : T.border2),
            background: active ? T.brand : T.layer1,
            color: active ? '#ffffff' : T.label1,
          },
        }, m.label);
      }

      function liveForm() {
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

      function liveOptForm() {
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

      function duanBaForm() {
        return h('div', { style: cardStyle },
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '视频本地路径 / 当前会话附件 *'),
            h('input', {
              value: videoPath, onChange: (e) => setVideoPath(e.target.value), style: inputStyle,
              placeholder: '例如：D:\\videos\\家庭短片.mp4，或先在对话里上传视频后写“见会话附件”',
            }),
          ),
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '补充说明（人名、账号背景、时长限制等，没有就留空）'),
            h('textarea', {
              value: videoNote, onChange: (e) => setVideoNote(e.target.value),
              rows: 4, style: inputStyle,
              placeholder: '例如：全片控制在 2 分半；女主张姨、男主是上门女婿…',
            }),
          ),
        );
      }

      function duanAdaptForm() {
        return h('div', { style: cardStyle },
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '粘贴母版拍摄稿 *'),
            h('textarea', {
              value: masterDraft, onChange: (e) => setMasterDraft(e.target.value),
              rows: 14, style: inputStyle,
              placeholder: '把要改编的母版拍摄稿整段粘贴到这里…',
            }),
          ),
          h('div', { style: fieldStyle },
            h('label', { style: labelStyle }, '改编要求（换关系/场景/时长等，没有就留空）'),
            h('textarea', {
              value: adaptNote, onChange: (e) => setAdaptNote(e.target.value),
              rows: 4, style: inputStyle,
              placeholder: '例如：改成婆媳关系，场景换成小区楼道，全片控制在 3 分钟',
            }),
          ),
        );
      }

      function sessionBox() {
        return h('div', { style: cardStyle },
          h('label', { style: labelStyle }, '发送到'),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
            h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: T.label1, cursor: 'pointer' } },
              h('input', { type: 'radio', checked: useNew, onChange: () => setUseNew(true) }),
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
                  (s.title || s.displayTitle || (s.blank ? '新对话' : '未命名对话')) + (s.running ? '（运行中）' : '')),
              ),
            ),
          ),
        );
      }

      const currentMode = MODES.find((m) => m.id === mode);
      const submitLabel = busy ? '提交中…'
        : mode === 'live' ? '生成直播剧本'
        : mode === 'live-opt' ? '开始优化'
        : mode === 'duan-ba' ? '开始扒片'
        : '开始改编';

      return h('div', { style: { maxWidth: 780, margin: '0 auto', padding: 28, color: T.label1 } },
        h('h1', { style: { margin: '0 0 6px', fontSize: 22, fontWeight: 700 } }, '剧本工具'),
        h('p', { style: { margin: '0 0 20px', color: T.label2, fontSize: 13, lineHeight: 1.6 } },
          '老年直播间剧本 + 短视频拍摄稿。填好信息点一下按钮，剩下的交给 AI。'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 } },
          MODES.map(modeButton),
        ),
        mode === 'live' ? liveForm()
          : mode === 'live-opt' ? liveOptForm()
          : mode === 'duan-ba' ? duanBaForm()
          : duanAdaptForm(),
        sessionBox(),
        h('button', {
          onClick: submit, disabled: busy,
          style: { ...buttonPrimary, ...(busy ? { opacity: 0.6, cursor: 'default' } : {}) },
        }, submitLabel),
        h('div', { style: { ...cardStyle, marginTop: 20 } },
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } },
            h('span', { style: { fontSize: 13, color: T.label2 } }, '当前版本 v' + CURRENT_VERSION),
            h('button', {
              type: 'button', onClick: checkUpdate, disabled: checkingUpdate,
              style: { padding: '8px 14px', borderRadius: 8, border: '1px solid ' + T.border2,
                background: T.layer2, color: T.label1, cursor: checkingUpdate ? 'wait' : 'pointer' },
            }, checkingUpdate ? '检查中…' : '检查更新'),
          ),
          updateError ? h('p', { role: 'alert', style: { color: T.err, fontSize: 13 } }, updateError) : null,
          updateResult ? h('div', { role: 'status', style: { fontSize: 13, lineHeight: 1.7 } },
            h('p', null, updateResult.available ? '发现新版本 v' + updateResult.latest : '当前已是最新版本（GitHub 正式版 v' + updateResult.latest + '）'),
            updateResult.notes ? h('pre', { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', maxHeight: 180, overflow: 'auto' } }, updateResult.notes) : null,
            h('a', { href: updateResult.url, target: '_blank', rel: 'noopener noreferrer', style: { color: T.brand } },
              updateResult.available ? '查看更新说明与下载' : '查看当前版本发布页'),
            updateResult.available ? h('p', { style: { color: T.label2 } }, '下载新版本后，在 DSH 插件管理中安装；完成后刷新页面。') : null,
          ) : null,
        ),
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
      inject: ['slots', 'layout', 'sessions', 'uiWorkspace', 'remote', 'remote.session'],
      apply(ctx) {
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'elderly-script', order: 20, label: '剧本工具' },
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
