import { useState } from 'react';
import type { DayCell } from '../../domain/overview';
import { C } from '../ExerciseProgress/charts/chartUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 0–4 shade step for a day's volume against the window's busiest day. */
function level(volume: number, max: number): number {
  if (volume <= 0) return 0;
  if (max <= 0) return 1;
  return Math.min(4, 1 + Math.floor((volume / max) * 3.999));
}

const SHADE = ['transparent', `${C.green}33`, `${C.green}66`, `${C.green}aa`, C.green];

/**
 * A contribution-style training heatmap: columns are weeks (Mon→Sun down each
 * column), shaded by that day's volume. Tap a cell to read its date and volume.
 */
export function ConsistencyHeatmap({ cells }: { cells: DayCell[] }) {
  const [sel, setSel] = useState<DayCell | null>(null);
  if (cells.length === 0) return null;

  const max = Math.max(...cells.map((c) => c.volume));
  // chunk into weeks of 7 (cells already start on a Monday)
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // month labels above the first column that begins each month
  const monthMarks = weeks.map((w, i) => {
    const first = w[0];
    const d = new Date(first.date);
    const prev = i > 0 ? new Date(weeks[i - 1][0].date).getMonth() : -1;
    return d.getMonth() !== prev ? MONTHS[d.getMonth()] : '';
  });

  const active = cells.filter((c) => c.count > 0).length;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-muted-2">
          {sel
            ? `${new Date(sel.date).getDate()} ${MONTHS[new Date(sel.date).getMonth()]} · ${
                sel.count > 0 ? `${sel.volume.toLocaleString()} kg` : 'rest'
              }`
            : `${active} training days`}
        </span>
      </div>
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-[3px]">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              <span className="mb-0.5 h-3 font-mono text-[8px] text-muted-2">{monthMarks[wi]}</span>
              {w.map((cell) => {
                const lv = level(cell.volume, max);
                const on = sel?.date === cell.date;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setSel(on ? null : cell)}
                    aria-label={`${new Date(cell.date).toDateString()}: ${cell.count} workouts`}
                    className="h-3 w-3 rounded-[3px] border transition-transform active:scale-90"
                    style={{
                      backgroundColor: SHADE[lv],
                      borderColor: on ? C.ink : lv === 0 ? C.line2 : 'transparent',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 font-mono text-[9px] text-muted-2">
        <span>less</span>
        {SHADE.map((s, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-[2px] border"
            style={{ backgroundColor: s, borderColor: i === 0 ? C.line2 : 'transparent' }}
          />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
