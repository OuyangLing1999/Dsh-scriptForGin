// Pure analysis helpers for the workbench; no browser or local-file imports.
// Kept independent so build-client.mjs can inline them without resolution concerns.

const countHan = value => (value.match(/\p{Script=Han}/gu) || []).length;
const strOf = value => (typeof value === 'string' ? value : '');

// Merge a counted speaker into a name-keyed accumulator.
function accumulate(counts, name, chars, turns) {
  const key = name.trim();
  if (!key) return;
  const entry = counts.get(key) || { name: key, turns: 0, chars: 0 };
  entry.turns += turns;
  entry.chars += chars;
  counts.set(key, entry);
}

function finishRoles(counts) {
  const totalChars = [...counts.values()].reduce((sum, role) => sum + role.chars, 0);
  const roles = [...counts.values()]
    .map(role => ({ name: role.name, turns: role.turns, chars: role.chars, share: totalChars ? role.chars / totalChars : 0 }))
    .sort((a, b) => b.chars - a.chars);
  return { roles, totalChars };
}

export function analyzeRoles(text, mode = 'live') {
  const source = strOf(text);
  if (!source.trim()) return { roles: [], totalChars: 0 };
  const counts = new Map();
  if (mode.startsWith('live')) {
    const markers = [...source.matchAll(/^【([^】\n]+)】\s*$/gm)];
    if (!markers.length) return { roles: [], totalChars: 0 };
    markers.forEach((marker, index) => {
      const body = source.slice(marker.index + marker[0].length, markers[index + 1]?.index ?? source.length);
      accumulate(counts, marker[1], countHan(body), 1);
    });
  } else {
    for (const line of source.split(/\r?\n/)) {
      const matched = /^\s*台词[：:]\s*(.+?)\s*$/.exec(line);
      if (!matched) continue;
      const content = matched[1];
      const speaker = /^([^：:，,。\s]{1,12})[：:]/.exec(content);
      accumulate(counts, speaker ? speaker[1] : '未标注', countHan(content), 1);
    }
  }
  return finishRoles(counts);
}

export function findMatches(text, query, options = {}) {
  const source = strOf(text);
  const { caseSensitive = false } = options || {};
  if (typeof query !== 'string' || query === '') return { matches: [], count: 0 };
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
    if (match[0].length === 0) regex.lastIndex += 1;
  }
  return { matches, count: matches.length };
}

export function buildExampleProject() {
  const versionId = 'example-v1';
  const scriptText = [
    '【主播】',
    '各位叔叔阿姨，大家晚上好。今天咱们不催单、不卖货，就坐下来聊一件过年家家户户都绕不开的事——孩子说工作忙，今年春节又不回来了。我知道，一说到这儿，好多当父母的人心里头就不是滋味，嘴上说着没事、工作要紧，可挂了电话，一个人坐在屋里半天都缓不过神来。咱们当爹妈的，忙忙碌碌一辈子，到老了其实图的不多，就图逢年过节能一家人坐一块儿，吃上一顿热乎饭，听孩子亲口叫一声妈。今天我把李阿姨请到了直播间，李阿姨家孩子也在外地，一年到头就过年能回来一趟，她最有体会。李阿姨，您跟大伙儿说说，是不是这个理儿？',
    '【李阿姨】',
    '张姐，你这话可真是说到我心坎里去了。我儿子在省城上班，平时打电话总说忙，我也理解，年轻人打拼不容易，可一到腊月二十几，我就天天数着日子，把冰箱塞得满满当当，他爱吃的腊肠、我腌的咸菜，一样一样都给他留着。去年他说要回来，我高兴得一宿没睡好，结果临到跟前又说单位要值班，回不来了。我嘴上说行，你忙你的，可挂了电话，眼泪就止不住地往下掉，还不敢让他知道，怕他分心。有时候我就想，做父母的不是非要孩子多有钱、多体面，就盼着他平平安安，有空回来坐坐，哪怕就吃一顿我做的饭，跟我说几句体己话，我这心里就踏实了。所以张姐，今天这个题目真该好好聊聊，也让年轻人听听咱们当爹妈的心声。',
  ].join('\n');

  return {
    schemaVersion: 1,
    title: '春节回家示例项目',
    mode: 'live',
    deliverable: 'script',
    topic: '春节回家：母亲盼儿子回来，儿子因工作推脱，连麦时把多年的隔阂说开',
    notes: '示例项目，展示创作简报、人物卡、样稿、成稿和审稿记录的关系。',
    draft: '',
    videoPath: '',
    sessionId: '',
    autoRepair: false,
    videoEvidence: '',
    fingerprint: '',
    outline: '',
    persona: '张姐，45岁，直播情感主播，说话亲切，爱用家常比喻，擅长把家长里短聊到人心坎里。',
    personaDraft: '',
    characterDraft: null,
    brief: {
      relationship: '母亲李阿姨与在外地工作的儿子小军',
      conflict: '儿子说今年春节值班回不来，母亲嘴上理解心里委屈',
      goals: '母亲想见儿子、听一句体己话；儿子想让母亲放心，又放不下工作',
      ending: '儿子答应视频陪母亲吃年夜饭，并约定正月抽空回家',
      lockedFacts: '儿子在省城工作；去年也因值班没回家',
      protectedLines: '妈，我在呢，今年一定回来看您',
    },
    intensity: 'light',
    characters: [
      { id: 'example-c1', name: '主播张姐', relationship: '主播', goal: '引导母亲说出委屈，帮母子搭话', knowledge: '知道李阿姨儿子在外地、去年没回家', voice: '亲切、口语、爱重复关键信息', state: '开场问好，引出春节回家话题' },
      { id: 'example-c2', name: '李阿姨', relationship: '母亲', goal: '想让儿子知道自己的想念，又不想给儿子压力', knowledge: '知道儿子工作忙、去年没回家', voice: '慢、朴实、说到动情处会停顿', state: '嘴上说理解，心里一直惦记' },
    ],
    samples: [
      {
        id: 'example-s1', title: '春节亲情开场示例', mode: 'live',
        text: '【主播】\n张姐我总跟直播间的叔叔阿姨说，钱多钱少，够用就行，可心里头那份惦记，是多少钱都买不来的。\n【李姐】\n张姐这话说到点子上了，我们这代人苦日子过来的，图的就是一家人齐齐整整。\n',
        notes: '开场用家常话点题，再用对方的话自然接住。', tags: ['春节', '亲情'],
      },
    ],
    selectedSampleIds: ['example-s1'],
    versions: [
      { id: versionId, text: scriptText, phase: 'full', mode: 'live', artifactKind: 'script', createdAt: '2026-01-25T20:00:00.000Z' },
    ],
    reports: [
      {
        id: 'example-r1', text: '本稿整体清晰，母亲的情绪递进自然。建议：一是儿子只在电话里出现，可在主播收口处补一句儿子的回应；二是结尾的「正月回来」可以再给一个具体的小动作，让承诺更可信。其余人物动机和因果未见冲突。',
        sourceVersionId: versionId, artifactKind: 'report', reportKind: 'audit', createdAt: '2026-01-25T20:05:00.000Z',
      },
    ],
    materials: [],
    editBuffers: {},
    currentVersionId: versionId,
    pending: null,
    retry: null,
  };
}
