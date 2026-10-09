import { useEffect, useState } from 'react';
import { C, bounds, fmt, gridLines, smoothPath, xFractions, type Pt } from './chartUtils';

const W = 340;
const H = 184;
const P = { t: 16, r: 34, b: 24, l: 14 };
const IW = W - P.l - P.r;
const IH = H - P.t - P.b;

export interface LinePoint {
  value: number;
  at: number;
  label: string;
}

/**
 * A touch-first trend line: tap/hover to pin a point and read its value, date
 * and change from the start. Points are placed on a real time axis via `ats`.
 */
export function InteractiveLineChart({
  points,
  color,
  unit = '',
}: {
  points: LinePoint[];
  color: string;
  unit?: string;
}) {
  const n = points.length;
  const [sel, setSel] = useState(n - 1);
  useEffect(() => setSel(n - 1), [n]);

  if (n === 0) return null;
  const values = points.map((p) => p.value);
  const { lo, hi } = bounds(values);
  const range = hi - lo || 1;
  const fr = xFractions(n, points.map((p) => p.at));
  const baseY = P.t + IH;
  const pts: Pt[] = values.map((v, k) => ({
    x: P.l + (n === 1 ? IW / 2 : fr[k] * IW),
    y: P.t + IH * (1 - (v - lo) / range),
    v,
    i: k,
  }));
  const i = Math.min(Math.max(sel, 0), n - 1);
  const active = points[i];
  const ap = pts[i];
  const change = Math.round((active.value - values[0]) * 10) / 10;
  const area = smoothPath(pts) + ` L ${pts[n - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-display text-[20px] font-black tabular-nums leading-none text-ink">
          {fmt(active.value)}
          {unit && <span className="ml-0.5 text-[12px] font-bold text-muted-2">{unit}</span>}
        </span>
        <span className="text-right font-mono text-[11px] leading-tight text-muted-2">
          {active.label}
          {n > 1 && (
            <span className="block" style={{ color: change > 0 ? C.green : change < 0 ? C.accent : C.muted2 }}>
              {change > 0 ? '+' : ''}
              {change}
              {unit} since start
            </span>
          )}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img">
        {gridLines(lo, hi, 3).map((v, k) => {
          const y = P.t + IH * (1 - (v - lo) / range);
          return (
            <g key={k}>
              <line x1={P.l} y1={y} x2={P.l + IW} y2={y} stroke={C.line} strokeWidth="1" />
              <text x={P.l + IW + 4} y={y + 3} fill={C.muted2} fontSize="8.5" fontFamily="monospace">
                {fmt(v)}
              </text>
            </g>
          );
        })}

        <path d={area} fill={color} opacity="0.1" />
        <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* selection guide + dot */}
        <line x1={ap.x} y1={P.t - 4} x2={ap.x} y2={baseY} stroke={color} strokeWidth="1" opacity="0.4" />
        <circle cx={ap.x} cy={ap.y} r="4" fill={color} />
        <circle cx={ap.x} cy={ap.y} r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />

        {/* hit targets */}
        {pts.map((p, k) => {
          const left = k === 0 ? P.l : (pts[k - 1].x + p.x) / 2;
          const right = k === n - 1 ? P.l + IW : (p.x + pts[k + 1].x) / 2;
          return (
            <rect
              key={k}
              x={left}
              y={P.t - 6}
              width={Math.max(1, right - left)}
              height={IH + 12}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onPointerEnter={() => setSel(k)}
              onPointerDown={() => setSel(k)}
            />
          );
        })}
      </svg>
    </div>
  );
}
