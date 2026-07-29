import { describe, it, expect } from 'vitest';
import {
  bmrMifflin,
  calorieTarget,
  deficitForRate,
  profileComplete,
  type Profile,
} from './calories';

const full: Profile = { heightCm: '180', age: '30', sex: 'male', activity: 'moderate' };

describe('calories', () => {
  it('detects a complete profile', () => {
    expect(profileComplete(full)).toBe(true);
    expect(profileComplete({ ...full, sex: undefined })).toBe(false);
    expect(profileComplete({ ...full, heightCm: '' })).toBe(false);
  });

  it('computes Mifflin–St Jeor BMR by sex', () => {
    // 10*90 + 6.25*180 - 5*30 = 1875; male +5, female -161
    expect(bmrMifflin('male', 90, 180, 30)).toBe(1880);
    expect(bmrMifflin('female', 90, 180, 30)).toBe(1714);
  });

  it('converts a weekly loss rate to a daily deficit', () => {
    expect(deficitForRate(1)).toBeCloseTo(1100, 0); // 7700/7
    expect(deficitForRate(0.5)).toBeCloseTo(550, 0);
  });

  it('builds maintenance and a daily target', () => {
    // BMR 1880 × 1.55 moderate = 2914 maintenance; deficit ~1100 → ~1814 target
    const c = calorieTarget(full, 90, deficitForRate(1))!;
    expect(c.bmr).toBe(1880);
    expect(c.maintenance).toBe(2914);
    expect(c.deficit).toBe(1100);
    expect(c.target).toBe(1814);
  });

  it('returns null when incomplete or weightless', () => {
    expect(calorieTarget({ ...full, age: '' }, 90, 500)).toBeNull();
    expect(calorieTarget(full, 0, 500)).toBeNull();
  });
});
