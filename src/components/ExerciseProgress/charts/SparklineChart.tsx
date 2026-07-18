import { useId } from 'react';
import { C, PAD, VIEW, fmt, innerH, plot, seriesEnds, smoothPath, type ChartProps } from './chartUtils';

/**
 * Style 3 — Minimal. No axes, no gridlines: just a big current number, a thin
 * clean line over a whisper of fill, and a single dot at today. The "at a
 * glance" look.
 */
export function SparklineChart({ values, color, unit }: ChartProps) {
  const gid = useId();
  const { pts } = plot(values);
  const last = pts[pts.length - 1];
  const { first, latest } = seriesEnds(values);
  const up = latest >= first;
  const baseY = PAD.t + innerH;
  const area = smoothPath(pts) + ` L ${last.x} ${baseY} L ${pts[0].x} ${baseY} Z`;

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-auto w-full" role="img">
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* big current figure */}
      <text x={PAD.l} y={40} fill={C.ink} fontSize="34" fontWeight="800" fontFamily="'Archivo', sans-serif">
        {fmt(latest)}
        <tspan fontSize="15" fill={C.muted} dx="3">
          {unit}
        </tspan>
      </text>
      <text x={PAD.l} y={58} fill={up ? C.green : C.accent} fontSize="11" fontWeight="700" fontFamily="monospace">
        {up ? '▲' : '▼'} {fmt(Math.abs(latest - first))}
        {unit} since {fmt(first)}
      </text>

      <path d={area} fill={`url(#spark-${gid})`} />
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
      <circle cx={last.x} cy={last.y} r="6.5" fill={color} opacity="0.2" />
    </svg>
  );
}
