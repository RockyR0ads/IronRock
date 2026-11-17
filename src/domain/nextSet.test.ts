import { describe, expect, it } from 'vitest';
import { predictNext } from './nextSet';
import type { Block, LoggedSet, Session } from './types';

const block = (extra: Partial<Block> = {}): Block => ({
  lift: 'bench',
  sets: 4,
  reps: [3, 5],
  rpe: 8,
  cls: 'r-hi',
  cat: 'hpress',
  ...extra,
});
const set = (w: string, reps: string, extra: Partial<LoggedSet> = {}): LoggedSet => ({ w, reps, rpe: '', done: true, ...extra });
const session = (sets: LoggedSet[]): Session =>
  ({ id: 's1', at: '2026-10-29T10:00:00Z', title: 'Push', exercises: [{ liftId: 'bench', name: 'Bench', sets }] }) as unknown as Session;

describe('next-set prediction', () => {
  it('drops the first back-off to the programmed % of the top set', () => {
    const b = block({ backoff: { pct: 0.9, reps: [5, 6] } });
    expect(predictNext(b, [set('100', '4')], [], 2.5)).toEqual({ w: '90', reps: '5' });
    expect(predictNext(b, [set('102.5', '4')], [], 2.5)?.w).toBe('92.5');
  });

  it('ignores warm-ups', () => {
    const b = block({ backoff: { pct: 0.9, reps: 5 } });
    expect(predictNext(b, [set('60', '5', { warmup: true })], [], 2.5)).toBeNull();
    expect(predictNext(b, [set('60', '5', { warmup: true }), set('100', '4')], [], 2.5)).toEqual({ w: '90', reps: '5' });
  });

  it('replays a learned top-set drop', () => {
    const hist = [session([set('100', '4'), set('85', '6'), set('85', '6')])];
    expect(predictNext(block(), [set('105', '3')], hist, 2.5)).toEqual({ w: '90', reps: '5' });
  });

  it('replays fading reps on straight sets', () => {
    const hist = [session([set('20', '12'), set('20', '10'), set('20', '9')])];
    expect(predictNext(block({ lift: 'bench' }), [set('22.5', '12')], hist, 2.5)).toEqual({ w: '22.5', reps: '10' });
    expect(predictNext(block(), [set('22.5', '12'), set('22.5', '11')], hist, 2.5)).toEqual({ w: '22.5', reps: '10' });
  });

  it('falls back (null) beyond last session’s set count or with no history', () => {
    const hist = [session([set('100', '5'), set('100', '5')])];
    expect(predictNext(block(), [set('100', '5'), set('100', '5')], hist, 2.5)).toBeNull();
    expect(predictNext(block(), [set('100', '5')], [], 2.5)).toBeNull();
  });
});
