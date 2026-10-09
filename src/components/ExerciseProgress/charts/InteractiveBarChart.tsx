import { useEffect, useState } from 'react';
import { C, fmt, gridLines } from './chartUtils';

const W = 340;
const H = 184;
const P = { t: 16, r: 34, b: 24, l: 14 };
const IW = W - P.l - P.r;
const IH = H - P.t - P.b;

export interface BarPoint {
  label: string;
  value: number;
  /** Optional secondary line shown in the readout, e.g. a date or count. */
  sub?: string;
}

/**
 * A touch-first bar chart: tap (or hover) any bar to pin a readout of its exact
 * value, date and anything extra. A full-height invisible hit target per slot
 * makes even thin bars easy to hit. Y gridlines give the bars a real scale.
 */
export function InteractiveBarChart({
  points,
  color,
  unit = '',
  formatValue = (n) => fmt(n),
}: {
  points: BarPoint[];
  color: string;
  unit?: string;
  formatValue?: (n: number) => string;
}) {
  const n = points.length;
  const [sel, setSel] = useState(n - 1);
  // keep the selection valid when the series length changes (range switch)
  useEffect(() => setSel(n - 1), [n]);

  if (n === 0) return null;
  const max = Math.max(1, ...points.map((p) => p.value));
  const slot = IW / n;
  const bw = Math.max(1.5, Math.min(slot * 0.72, 24));
  const baseY = P.t + IH;
  const i = Math.min(Math.max(sel, 0), n - 1);
  const active = points[i];
  const showX = (k: number) => n <= 6 || k === 0 || k === n - 1 || k === Math.floor((n - 1) / 2);
  const selX = P.l + i * slot + slot / 2;

  return (
    <div>
      {/* pinned readout */}
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-display text-[20px] font-black tabular-nums leading-none text-ink">
          {formatValue(active.value)}
          {unit && <span className="ml-0.5 text-[12px] font-bold text-muted-2">{unit}</span>}
        </span>
        <span className="text-right font-mono text-[11px] leading-tight text-muted-2">
          {active.label}
          {active.sub && <span className="block text-muted-2/80">{active.sub}</span>}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img">
        {gridLines(0, max, 3).map((v, k) => {
          const y = baseY - (v / max) * IH;
          return (
            <g key={k}>
              <line x1={P.l} y1={y} x2={P.l + IW} y2={y} stroke={C.line} strokeWidth="1" />
              <text x={P.l + IW + 4} y={y + 3} fill={C.muted2} fontSize="8.5" fontFamily="monospace">
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {/* selection guide */}
        <line x1={selX} y1={P.t - 4} x2={selX} y2={baseY} stroke={color} strokeWidth="1" opacity="0.35" />

        {points.map((p, k) => {
          const h = (p.value / max) * IH;
          const x = P.l + k * slot + (slot - bw) / 2;
          const y = baseY - h;
          const on = k === i;
          return (
            <g key={k}>
              {p.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={bw}
                  height={Math.max(1.5, h)}
                  rx={Math.min(3, bw / 2)}
                  fill={color}
                  opacity={on ? 1 : 0.4}
                />
              )}
              {showX(k) && (
                <text
                  x={x + bw / 2}
                  y={H - 7}
                  fill={on ? C.muted : C.muted2}
                  fontSize="8.5"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {p.label}
                </text>
              )}
              {/* easy-tap full-height hit target */}
              <rect
                x={P.l + k * slot}
                y={P.t - 6}
                width={slot}
                height={IH + 12}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerEnter={() => setSel(k)}
                onPointerDown={() => setSel(k)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
