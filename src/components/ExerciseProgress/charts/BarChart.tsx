import { C, fmt } from './chartUtils';

const W = 340;
const H = 170;
const P = { t: 14, r: 14, b: 22, l: 14 };
const IW = W - P.l - P.r;
const IH = H - P.t - P.b;

/**
 * A plain vertical bar chart for bucketed series (weekly/monthly volume,
 * workouts per period). Bars scale to the series max; a few x labels are shown
 * so a long run of bars stays readable.
 */
export function BarChart({
  values,
  labels,
  color,
  unit = '',
}: {
  values: number[];
  labels: string[];
  color: string;
  unit?: string;
}) {
  const n = values.length;
  if (n === 0) return null;
  const max = Math.max(1, ...values);
  const slot = IW / n;
  const bw = Math.max(1, Math.min(slot * 0.7, 22));
  const baseY = P.t + IH;
  const showX = (i: number) => n <= 6 || i === 0 || i === n - 1 || i === Math.floor((n - 1) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {/* top gridline = max */}
      <line x1={P.l} y1={P.t} x2={P.l + IW} y2={P.t} stroke={C.line} strokeWidth="1" />
      <text x={P.l + IW} y={P.t - 3} fill={C.muted2} fontSize="9" textAnchor="end" fontFamily="monospace">
        {fmt(max)}
        {unit}
      </text>

      {values.map((v, i) => {
        const h = (v / max) * IH;
        const x = P.l + i * slot + (slot - bw) / 2;
        const y = baseY - h;
        const last = i === n - 1;
        return (
          <g key={i}>
            {v > 0 && (
              <rect
                x={x}
                y={y}
                width={bw}
                height={Math.max(1, h)}
                rx={Math.min(3, bw / 2)}
                fill={color}
                opacity={last ? 1 : 0.55}
              />
            )}
            {showX(i) && (
              <text
                x={x + bw / 2}
                y={H - 7}
                fill={C.muted2}
                fontSize="8.5"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
