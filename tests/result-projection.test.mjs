import test from 'node:test';
import assert from 'node:assert/strict';
import { initResultState, reduceResult } from '../result-projection.js';

const text = value => ({ type: 'text', text: value });
const event = (type, seq, data) => ({ type, seq, time: 1700000000000 + seq, data });
const user = (seq, value) => ({ ...event('user/message', seq, {
  id: `user-${seq}`, role: 'user', source: { kind: 'user' }, content: [text(value)],
}), surfaceOp: 'append' });
const assistant = (seq, turn, content, stream = []) => ({
  ...event('assistant/message', seq, { turn, step: 0, message: {
    id: `assistant-${seq}`, role: 'assistant', source: { kind: 'model', provider: 'fixture', model: 'fixture' }, content,
  }, stream }), surfaceOp: 'append',
});
const bind = () => reduceResult(initResultState(), user(1, '[DSH_SCRIPT_TASK:task-1]\n[DSH_SCRIPT_PHASE:draft]'));
const fold = events => events.reduce(reduceResult, initResultState());

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('initial state is fresh and exactly the wire-compatible result fields', () => {
  assert.deepEqual(initResultState(), { taskId: '', text: '', done: false, error: '', seq: -1, turn: -1, phase: '' });
  assert.notEqual(initResultState(), initResultState());
});

test('real user content binds task and optional phase then resets prior result', () => {
  assert.deepEqual(bind(), { taskId: 'task-1', phase: 'draft', text: '', done: false, error: '', seq: 1, turn: -1 });
  const previous = freeze({ ...bind(), text: 'old', done: true, error: 'old failure', turn: 2 });
  const input = freeze(user(10, 'prefix [DSH_SCRIPT_TASK:task-2] suffix'));
  assert.deepEqual(reduceResult(previous, input), { ...initResultState(), taskId: 'task-2', seq: 10 });
});

test('committed assistant text is authoritative over stream, reasoning and tool blocks', () => {
  const result = fold([
    user(1, '[DSH_SCRIPT_TASK:task-1]'), event('turn/start', 2, { turn: 3 }),
    assistant(3, 3, [{ type: 'reasoning', text: 'private' }, text('first'),
      { type: 'tool-call', id: 'call-1', name: 'tool', arguments: 'secret' }, text('second')],
    [{ type: 'text-chunks', time0: 0, index: 0, dt: [0], texts: ['stale stream'] }]),
  ]);
  assert.equal(result.text, 'first\nsecond');
  assert.equal(result.turn, 3);
  assert.equal(result.seq, 3);
  const latest = reduceResult(result, assistant(4, 3, [text('latest')]));
  assert.equal(latest.text, 'latest');
  assert.equal(reduceResult(latest, assistant(5, 3, [{ type: 'reasoning', text: 'hidden' }, text('  ')])), latest);
});

test('tool, attempt, unknown, malformed and unrelated turn events preserve reference', () => {
  const state = freeze(reduceResult(bind(), event('turn/start', 2, { turn: 7 })));
  for (const input of [null, {}, event('tool/call', 3, { turn: 7, name: 'tool' }),
    event('tool/result', 4, { turn: 7, message: { content: [text('tool output')] } }),
    event('assistant/attempt', 5, { turn: 7, stream: [{ texts: ['partial'] }] }),
    event('plugin:other', 6, {}), assistant(7, 8, [text('other turn')]),
    event('turn/end', 8, { turn: 8, reason: { kind: 'completed' } }),
    assistant(9, undefined, [text('missing turn')]),
  ]) assert.equal(reduceResult(state, freeze(input)), state);
});

test('turn completion retains latest text and maps real reason objects', () => {
  for (const [reason, error] of [
    [{ kind: 'completed' }, ''], [{ kind: 'error', error: { message: 'provider failed', code: 'E_PROVIDER' } }, 'provider failed'],
    [{ kind: 'aborted', reason: { kind: 'hook', reason: 'hook stopped' } }, 'hook stopped'],
    [{ kind: 'aborted', reason: { kind: 'user' } }, 'user'],
    [{ kind: 'max-tokens' }, 'max-tokens'], [{ kind: 'blocked' }, 'blocked'],
    [{ kind: 'interrupted' }, 'interrupted'], [{ kind: 'forked' }, 'forked'],
  ]) {
    const state = freeze(reduceResult(bind(), assistant(2, 4, [text('result')])));
    const result = reduceResult(state, freeze(event('turn/end', 3, { turn: 4, reason })));
    assert.equal(result.done, true);
    assert.equal(result.error, error);
    assert.equal(result.text, 'result');
    assert.equal(result.seq, 3);
    assert.equal(reduceResult(result, assistant(4, 4, [text('late')])), result);
  }
});

test('unmarked subsequent user turn detaches without replacing the result', () => {
  let state = reduceResult(bind(), assistant(2, 1, [text('owned result')]));
  state = reduceResult(state, user(3, 'unrelated followup'));
  assert.equal(state.text, 'owned result');
  assert.equal(state.done, false);
  assert.equal(reduceResult(state, event('turn/start', 4, { turn: 2 })), state);
  assert.equal(reduceResult(state, assistant(5, 2, [text('unrelated answer')])), state);
  assert.equal(reduceResult(state, event('turn/end', 6, { turn: 2, reason: { kind: 'completed' } })), state);
  const pending = reduceResult(bind(), user(2, 'unrelated before assistant'));
  assert.equal(reduceResult(pending, assistant(3, 1, [text('unrelated')])), pending);
  assert.equal(reduceResult(initResultState(), assistant(1, 1, [text('unbound')] )).taskId, '');
});

test('markers inside reasoning or tool content never bind and inputs stay immutable', () => {
  const state = freeze(initResultState());
  const input = freeze({ ...user(1, ''), data: { role: 'user', source: { kind: 'user' },
    content: [{ type: 'reasoning', text: '[DSH_SCRIPT_TASK:wrong]' }] } });
  assert.equal(reduceResult(state, input), state);
  const bound = freeze(bind());
  const output = reduceResult(bound, freeze(assistant(2, 0, [text('immutable')])));
  assert.notEqual(output, bound);
  assert.equal(bound.text, '');
  assert.equal(bound.turn, -1);
});
