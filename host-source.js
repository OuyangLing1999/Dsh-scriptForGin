import { z } from 'zod';
import { initResultState, reduceResult } from './result-projection.js';
export const inject = ['sessionProjections'];
export function apply(ctx) {
  const schema = z.object({
    taskId: z.string(), text: z.string(), done: z.boolean(), error: z.string(),
    seq: z.number().int(), turn: z.number().int(), phase: z.string(),
  });
  ctx.sessionProjections.register({
    key: 'scriptWorkbench', stateSchema: schema, stateVersion: 2,
    init: initResultState, apply: reduceResult,
    wire: { viewSchema: schema, view: (state) => state },
  });
}
