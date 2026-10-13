import { describe, expect, it } from 'vitest';
import { suggestNext } from './progression';
import type { Block } from './types';

const push = (reps: Block['reps']): Block => ({
  lift: 'cablecurl',
  sets: 3,
  reps,
  rpe: 9,
  cls: 'r-iso',
  cat: 'biceps',
  prog: 'push',
});
const hold = (reps: Block['reps'], cat: Block['cat'] = 'hpress'): Block => ({
  lift: 'bench',
  sets: 4,
  reps,
  rpe: 8,
  cls: 'r-hi',
  cat,
  prog: 'hold',
});

describe('suggestNext', () => {
  it('returns null without usable history', () => {
    expect(suggestNext(push([10, 12]), undefined, 2.5)).toBeNull();
    expect(suggestNext(push([10, 12]), { w: '', reps: '', rpe: '' }, 2.5)).toBeNull();
  });

  it('push: adds the step and resets to the bottom once top reps are hit', () => {
    const s = suggestNext(push([10, 12]), { w: '20', reps: '12', rpe: '9' }, 2.5)!;
    expect(s).toMatchObject({ w: 22.5, reps: 10, bumped: true });
  });

  it('push: holds weight and nudges you to beat the reps below the top', () => {
    const s = suggestNext(push([10, 12]), { w: '20', reps: '10', rpe: '9' }, 2.5)!;
    expect(s).toMatchObject({ w: 20, reps: 10, bumped: false });
  });

  it('hold: adds load only when top reps come in at/under the target RPE', () => {
    expect(suggestNext(hold([3, 5]), { w: '100', reps: '5', rpe: '8' }, 2.5)).toMatchObject({
      w: 102.5,
      reps: 3,
      bumped: true,
    });
    // top reps but RPE too high → hold
    expect(suggestNext(hold([3, 5]), { w: '100', reps: '5', rpe: '9' }, 2.5)).toMatchObject({
      bumped: false,
    });
  });

  it('steps squats/deadlifts by 5 kg', () => {
    expect(suggestNext(hold(5, 'squat'), { w: '140', reps: '5', rpe: '8' }, 2.5)).toMatchObject({
      w: 145,
      bumped: true,
    });
  });
});
