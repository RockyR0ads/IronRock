import { describe, it, expect } from 'vitest';
import { parseStrong, resolveExercise, movementKey, StrongImportError } from './strongImport';

const HEADER =
  '"Date","Workout Name","Duration","Exercise Name","Set Order","Weight","Reps","Distance","Seconds","Notes","Workout Notes","RPE"';

function row(
  date: string,
  workout: string,
  ex: string,
  order: string,
  weight: string,
  reps: string,
  note = '',
  rpe = '',
) {
  return `"${date}","${workout}","1h","${ex}","${order}","${weight}","${reps}","0","0","${note}","","${rpe}"`;
}

describe('movementKey', () => {
  it('collapses equipment placement and word order', () => {
    expect(movementKey('Bench Press (Barbell)')).toBe(movementKey('Barbell Bench Press'));
  });
  it('folds db/side synonyms and plurals', () => {
    expect(movementKey('DB Lateral Raises')).toBe(movementKey('Dumbbell Side Raise'));
  });
  it('keeps distinct movements apart', () => {
    expect(movementKey('Incline Bench Press (Barbell)')).not.toBe(movementKey('Bench Press (Barbell)'));
  });
});

describe('resolveExercise', () => {
  it('maps a known Strong name to a curated lift id', () => {
    expect(resolveExercise('Squat (Barbell)').liftId).toBe('squat');
    expect(resolveExercise('Bench Press (Barbell)').liftId).toBe('bench');
    expect(resolveExercise('Lateral Raise (Dumbbell)').liftId).toBe('latraise');
  });
  it('preserves an unknown exercise as a custom lift, not dropped', () => {
    const r = resolveExercise('Kneeling Cable Woodchop (Cable)');
    expect(r.custom).toBeTruthy();
    expect(r.name).toBe('Kneeling Cable Woodchop (Cable)');
    expect(r.liftId).toMatch(/^strong-/);
    expect(r.custom?.unit).toBe('kg');
  });
});

describe('parseStrong', () => {
  it('groups rows into sessions and marks sets done', () => {
    const csv = [
      HEADER,
      row('2024-01-02 18:00:00', 'Push', 'Bench Press (Barbell)', '1', '80', '5'),
      row('2024-01-02 18:00:00', 'Push', 'Bench Press (Barbell)', '2', '80', '5'),
      row('2024-01-02 18:00:00', 'Push', 'Overhead Press (Barbell)', '1', '50', '6'),
      row('2024-01-04 18:00:00', 'Pull', 'Bent Over Row (Barbell)', '1', '70', '8'),
    ].join('\n');

    const res = parseStrong(csv);
    expect(res.workouts).toBe(2);
    expect(res.sets).toBe(4);
    // newest first
    expect(res.sessions[0].title).toBe('Pull');
    const push = res.sessions[1];
    expect(push.exercises).toHaveLength(2);
    expect(push.exercises[0].liftId).toBe('bench');
    expect(push.exercises[0].sets).toHaveLength(2);
    expect(push.exercises[0].sets.every((s) => s.done)).toBe(true);
    expect(push.exercises[0].sets[0].w).toBe('80');
  });

  it('is idempotent by session id (same file → same ids)', () => {
    const csv = [HEADER, row('2024-01-02 18:00:00', 'Push', 'Squat (Barbell)', '1', '100', '5')].join('\n');
    const a = parseStrong(csv);
    const b = parseStrong(csv);
    expect(a.sessions[0].id).toBe(b.sessions[0].id);
  });

  it('converts pounds to kilograms when the header says so', () => {
    const csv = [
      HEADER.replace('"Weight"', '"Weight (lb)"'),
      row('2024-01-02 18:00:00', 'Push', 'Bench Press (Barbell)', '1', '225', '5'),
    ].join('\n');
    const res = parseStrong(csv);
    expect(res.unit).toBe('lb');
    expect(Number(res.sessions[0].exercises[0].sets[0].w)).toBeCloseTo(102.06, 1);
  });

  it('reads warm-up markers, notes and rpe', () => {
    const csv = [
      HEADER,
      row('2024-01-02 18:00:00', 'Push', 'Bench Press (Barbell)', 'W', '40', '10'),
      row('2024-01-02 18:00:00', 'Push', 'Bench Press (Barbell)', '1', '80', '5', 'felt heavy', '8'),
    ].join('\n');
    const sets = parseStrong(csv).sessions[0].exercises[0].sets;
    expect(sets[0].warmup).toBe(true);
    expect(sets[1].warmup).toBeUndefined();
    expect(sets[1].note).toBe('felt heavy');
    expect(sets[1].rpe).toBe('8');
  });

  it('parses the older semicolon-delimited export', () => {
    const csv = [
      'Date;Workout Name;Duration;Exercise Name;Set Order;Weight;Reps;Distance;Seconds;Notes',
      '2019-05-01 08:00:00;Legs;45m;Squat (Barbell);1;120;3;0;0;',
    ].join('\n');
    const res = parseStrong(csv);
    expect(res.workouts).toBe(1);
    expect(res.sessions[0].exercises[0].liftId).toBe('squat');
    expect(res.sessions[0].exercises[0].sets[0].w).toBe('120');
  });

  it('drops cardio / empty rows and rejects a non-Strong file', () => {
    const csv = [
      HEADER,
      row('2024-01-02 18:00:00', 'Run', 'Running', '1', '0', '0'),
    ].join('\n');
    expect(() => parseStrong(csv)).toThrow(StrongImportError);
    expect(() => parseStrong('a,b,c\n1,2,3')).toThrow(StrongImportError);
  });
});
