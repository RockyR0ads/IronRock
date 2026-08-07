import { describe, it, expect } from 'vitest';
import { searchLibrary, libraryInGroup, LIBRARY_BY_ID } from './library';

describe('searchLibrary', () => {
  it('is plural-tolerant: "raises" finds a "Raise"', () => {
    const names = searchLibrary('cable lateral raises').map((e) => e.name);
    expect(names).toContain('Cable Seated Lateral Raise');
  });

  it('still matches singular queries', () => {
    const names = searchLibrary('cable lateral raise').map((e) => e.name);
    expect(names).toContain('Cable Seated Lateral Raise');
  });

  it('keeps double-s words intact ("press" ≠ "pres")', () => {
    const names = searchLibrary('bench press').map((e) => e.name.toLowerCase());
    expect(names.every((n) => n.includes('press'))).toBe(true);
    expect(names.length).toBeGreaterThan(0);
  });

  it('requires every term to match', () => {
    expect(searchLibrary('zzzzz lateral')).toHaveLength(0);
  });

  it('treats "standing" as filler and side↔lateral as synonyms', () => {
    const names = searchLibrary('standing lateral raise').map((e) => e.name);
    expect(names).toContain('Side Lateral Raise');
  });

  it('maps db → dumbbell', () => {
    const names = searchLibrary('db lateral raise').map((e) => e.name.toLowerCase());
    expect(names.some((n) => n.includes('dumbbell'))).toBe(true);
  });

  it('filters search results by equipment', () => {
    const all = searchLibrary('press');
    const cable = searchLibrary('press', 'Cable');
    expect(cable.length).toBeGreaterThan(0);
    expect(cable.length).toBeLessThan(all.length);
    expect(cable.every((e) => e.equipment === 'cable')).toBe(true);
  });

  it('filters a muscle group by equipment', () => {
    const dumbbell = libraryInGroup('Shoulders', 'Dumbbell');
    expect(dumbbell.length).toBeGreaterThan(0);
    expect(dumbbell.every((e) => e.equipment === 'dumbbell')).toBe(true);
  });

  it('resolves the "skullcrusher" nickname to a lying triceps extension', () => {
    const names = searchLibrary('dumbbell skullcrusher').map((e) => e.name);
    expect(names).toContain('Lying Dumbbell Tricep Extension');
  });

  it('resolves "rdl" to romanian deadlift', () => {
    const names = searchLibrary('rdl').map((e) => e.name.toLowerCase());
    expect(names.some((n) => n.includes('romanian'))).toBe(true);
  });

  it('Barbell bucket includes e-z curl bar', () => {
    const barbell = libraryInGroup('Arms', 'Barbell');
    const equipments = new Set(barbell.map((e) => LIBRARY_BY_ID[e.id].equipment));
    expect([...equipments].every((eq) => eq === 'barbell' || eq === 'e-z curl bar')).toBe(true);
  });
});
