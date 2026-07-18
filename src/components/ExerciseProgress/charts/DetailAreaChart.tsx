import { useId } from 'react';
import { C, bounds, fmt, gridLines, smoothPath, type ChartProps, type Pt } from './chartUtils';

// A larger, richer take on the area line for the drill-down view: taller box,
// right-hand value axis, per-point dots, and the peak and latest points called
// out. Uses its own geometry so it can breathe more than the inline charts.
const W = 360;
const H = 244;
const P = { t: 24, r: 46, b: 32, l: 18 };
const IW = W - P.l - P.r;
const IH = H - P.t - P.b;

export function DetailAreaChart({ values, labels, color, unit }: ChartProps) {
  const gid = useId();
  const { lo, hi } = bounds(values);
  const range = hi - lo || 1;
  const n = values.length;
  const baseY = P.t + IH;

  const yAt = (v: number) => P.t + IH * (1 - (v - lo) / range);
  const pts: Pt[] = values.map((v, i) => ({
    x: P.l + (n === 1 ? IW / 2 : (i / (n - 1)) * IW),
    y: yAt(v),
    v,
    i,
  }));
  const last = pts[n - 1];

  let peak = 0;
  for (let i = 1; i < n; i++) if (values[i] > values[peak]) peak = i;
  const peakPt = pts[peak];
  const peakIsLast = peak === n - 1;

  const area = smoothPath(pts) + ` L ${last.x} ${baseY} L ${pts[0].x} ${baseY} Z`;
  const showX = (i: number) => n <= 8 || i === 0 || i === n - 1 || i === Math.floor((n - 1) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      <defs>
        <linearGradient id={`dfill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines(lo, hi, 4).map((v, i) => {
        const y = yAt(v);
        return (
          <g key={i}>
            <line x1={P.l} y1={y} x2={P.l + IW} y2={y} stroke={C.line} strokeWidth="1" />
            <text x={P.l + IW + 6} y={y + 3} fill={C.muted2} fontSize="9" fontFamily="monospace">
              {fmt(v)}
            </text>
          </g>
        );
      })}

      <path d={area} fill={`url(#dfill-${gid})`} />
      <path
        d={smoothPath(pts)}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p) => (
        <g key={p.i}>
          <circle cx={p.x} cy={p.y} r="2.8" fill={C.surface2} stroke={color} strokeWidth="1.6" />
          {showX(p.i) && (
            <text x={p.x} y={H - 8} fill={C.muted2} fontSize="9" textAnchor="middle" fontFamily="monospace">
              {labels[p.i]}
            </text>
          )}
        </g>
      ))}

      {/* peak marker (skipped when the peak is also the latest point) */}
      {!peakIsLast && n > 1 && (
        <g>
          <path
            d={`M ${peakPt.x} ${peakPt.y - 5} L ${peakPt.x + 5} ${peakPt.y} L ${peakPt.x} ${peakPt.y + 5} L ${peakPt.x - 5} ${peakPt.y} Z`}
            fill={C.yellow}
          />
          <text
            x={peakPt.x}
            y={peakPt.y - 10}
            fill={C.yellow}
            fontSize="8.5"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="monospace"
          >
            PEAK {fmt(peakPt.v)}
          </text>
        </g>
      )}

      {/* latest point emphasised */}
      <circle cx={last.x} cy={last.y} r="5" fill={color} />
      <circle cx={last.x} cy={last.y} r="9.5" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
      <text
        x={Math.min(last.x, W - P.r - 6)}
        y={Math.max(last.y - 12, 12)}
        fill={C.ink}
        fontSize="12.5"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="'Archivo', sans-serif"
      >
        {fmt(last.v)}
        {unit}
      </text>
    </svg>
  );
}
