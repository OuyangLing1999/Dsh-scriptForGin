/** Pure Host session projection; schemas and registration belong to the caller. */
export function initResultState() {
  return { taskId: '', text: '', done: false, error: '', seq: -1, turn: -1, phase: '' };
}

function textContent(content) {
  if (!Array.isArray(content)) return '';
  return content.filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text).join('\n');
}

function endError(reason) {
  if (!reason || reason.kind === 'completed') return '';
  if (reason.kind === 'error') return reason.error?.message || reason.error?.code || 'error';
  if (reason.kind === 'aborted') return reason.reason?.reason || reason.reason?.kind || 'aborted';
  return typeof reason.kind === 'string' ? reason.kind : '';
}

/**
 * -1 is awaiting the task's turn; -2 detaches a task from later unrelated input.
 * Return identity for ignored events so the registry suppresses wire publication.
 */
export function reduceResult(state, event) {
  if (!event || !event.data) return state;
  const { data } = event;
  if (event.type === 'user/message') {
    const text = textContent(data.content);
    const task = /\[DSH_SCRIPT_TASK:([^\]\r\n]+)\]/.exec(text);
    if (task && task[1].trim()) {
      const phase = /\[DSH_SCRIPT_PHASE:([^\]\r\n]+)\]/.exec(text);
      return { ...initResultState(), taskId: task[1].trim(),
        phase: phase?.[1].trim() || '', seq: event.seq };
    }
    if (!state.taskId || state.turn === -2) return state;
    return { ...state, turn: -2 };
  }
  if (!state.taskId || state.done || state.turn === -2) return state;
  if (event.type === 'turn/start') {
    if (state.turn !== -1 || !Number.isInteger(data.turn)) return state;
    return { ...state, turn: data.turn, seq: event.seq };
  }
  if (event.type !== 'assistant/message' && event.type !== 'turn/end') return state;
  if (!Number.isInteger(data.turn) || (state.turn !== -1 && data.turn !== state.turn)) return state;
  if (event.type === 'assistant/message') {
    const text = textContent(data.message?.content);
    if (!text.trim()) return state;
    return { ...state, text, turn: data.turn, seq: event.seq };
  }
  return { ...state, done: true, error: endError(data.reason), turn: data.turn, seq: event.seq };
}
