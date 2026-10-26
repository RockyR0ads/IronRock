import { formatNotes } from './DevNotes';

describe('dev notes clipboard format', () => {
  it('heads with app and build, then one line per note, oldest first', () => {
    const at = (h: number) => new Date(2026, 9, 24, h, 5).toISOString();
    const out = formatNotes(
      [
        { id: 'b', kind: 'idea', text: 'Remember\nlast program', at: at(17), screen: '/settings', version: 'x' },
        { id: 'a', kind: 'issue', text: 'Week label wrong', at: at(8), screen: '/week', version: 'x' },
      ],
      new Date(2026, 9, 25, 11, 20)
    );
    const lines = out.split('\n');
    expect(lines[0]).toBe('# IronRock dev notes');
    expect(lines[1]).toMatch(/^Version .+ \(.+\) · copied 2026-10-25 11:20$/);
    expect(lines[3]).toBe('- [issue] 2026-10-24 08:05 · /week · Week label wrong');
    expect(lines[4]).toBe('- [idea] 2026-10-24 17:05 · /settings · Remember last program');
  });
});
