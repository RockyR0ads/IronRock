import { C } from '../ExerciseProgress/charts/chartUtils';
import type { WeighIn } from '../../domain/weightTracker';

const VIEW = { w: 340, h: 200 };
const PAD = { t: 24, r: 44, b: 26, l: 30 };
const innerW = VIEW.w - PAD.l - PAD.r;
const innerH = VIEW.h - PAD.t - PAD.b;

const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * Weight-over-time chart: the straight-line plan from the first weigh-in to the
 * goal, your actual weigh-ins over it, and a target marker — so you can see the
 * trajectory to the goal at a glance.
 */
export function WeightChart({
  weighIns,
  targetKg,
  targetDate,
  onTrack,
  now = new Date(),
}: {
  weighIns: WeighIn[];
  targetKg: number;
  targetDate: string;
  onTrack: boolean;
  now?: Date;
}) {
  const pts = [...weighIns].sort((a, b) => a.at.localeCompare(b.at));
  const startMs = new Date(pts[0].at).getTime();
  const latestMs = new Date(pts[pts.length - 1].at).getTime();
  const targetMs = new Date(targetDate).getTime();
  const nowMs = now.getTime();

  const xMin = startMs;
  const xMax = Math.max(targetMs, latestMs);
  const kgs = [...pts.map((p) => p.kg), targetKg, pts[0].kg];
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const pad = (max - min || 1) * 0.14;
  const lo = min - pad;
  const hi = max + pad;

  const x = (ms: number) => PAD.l + (xMax === xMin ? innerW / 2 : ((ms - xMin) / (xMax - xMin)) * innerW);
  const y = (kg: number) => PAD.t + innerH * (1 - (kg - lo) / (hi - lo || 1));

  const actual = pts.map((p) => ({ x: x(new Date(p.at).getTime()), y: y(p.kg), kg: p.kg }));
  const actualPath = actual.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const stroke = onTrack ? C.green : C.yellow;

  const grid = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const showToday = nowMs >= xMin && nowMs <= xMax;

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="w-full" role="img" aria-label="Weight trajectory">
      {/* horizontal gridlines + kg labels */}
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={PAD.l + innerW} y1={y(g)} y2={y(g)} stroke={C.line} strokeWidth={1} />
          <text x={PAD.l - 6} y={y(g) + 3} textAnchor="end" fontSize={9} fill={C.muted2} fontFamily="monospace">
            {Math.round(g)}
          </text>
        </g>
      ))}

      {/* today marker */}
      {showToday && (
        <line x1={x(nowMs)} x2={x(nowMs)} y1={PAD.t} y2={PAD.t + innerH} stroke={C.line2} strokeWidth={1} strokeDasharray="2 3" />
      )}

      {/* straight-line plan: first weigh-in → target */}
      <line
        x1={x(startMs)}
        y1={y(pts[0].kg)}
        x2={x(targetMs)}
        y2={y(targetKg)}
        stroke={C.muted2}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />

      {/* target level + marker */}
      <line x1={PAD.l} x2={PAD.l + innerW} y1={y(targetKg)} y2={y(targetKg)} stroke={C.accent} strokeWidth={1} strokeDasharray="1 3" opacity={0.5} />
      <circle cx={x(targetMs)} cy={y(targetKg)} r={4} fill={C.accent} />
      <text x={x(targetMs)} y={y(targetKg) - 8} textAnchor="middle" fontSize={9} fill={C.accent} fontFamily="monospace">
        {targetKg}
      </text>

      {/* actual weigh-ins */}
      <path d={actualPath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {actual.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === actual.length - 1 ? 3.5 : 2.2} fill={stroke} />
      ))}
      {/* latest value label */}
      <text
        x={Math.min(actual[actual.length - 1].x + 6, VIEW.w - 4)}
        y={actual[actual.length - 1].y + 3}
        fontSize={9}
        fill={stroke}
        fontFamily="monospace"
      >
        {Math.round(pts[pts.length - 1].kg * 10) / 10}
      </text>

      {/* x-axis end labels */}
      <text x={PAD.l} y={VIEW.h - 8} textAnchor="start" fontSize={9} fill={C.muted2} fontFamily="monospace">
        {shortDate(startMs)}
      </text>
      <text x={PAD.l + innerW} y={VIEW.h - 8} textAnchor="end" fontSize={9} fill={C.muted2} fontFamily="monospace">
        {shortDate(targetMs)}
      </text>
    </svg>
  );
}
