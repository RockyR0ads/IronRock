// Share a finished workout as a summary card image. Drawn on a canvas, then
// handed to the native share sheet (Capacitor) or the Web Share API, falling
// back to a download where neither can take a file.

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { volumeLabel, type WorkoutStats } from './stats';
import type { Session } from './types';

const W = 1080;
const H = 1350;

/** Best working set per exercise, as "100 kg × 5". */
function topSets(session: Session): { name: string; line: string }[] {
  return session.exercises.map((ex) => {
    const work = ex.sets.filter((s) => s.done && !s.warmup);
    const best = work.reduce<(typeof work)[number] | null>((b, s) => {
      const w = parseFloat(s.w) || 0;
      return !b || w > (parseFloat(b.w) || 0) ? s : b;
    }, null);
    const line = best
      ? best.secs && !best.reps
        ? `${work.length} × ${best.secs}s`
        : `${work.length} sets · top ${best.w || 0} kg × ${best.reps || 0}`
      : `${ex.sets.length} sets`;
    return { name: ex.name, line };
  });
}

export function drawWorkoutCard(session: Session, stats: WorkoutStats, accent: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0E0F12';
  g.fillRect(0, 0, W, H);
  g.fillStyle = accent;
  g.fillRect(0, 0, W, 16);

  const font = (px: number, weight = 700) => `${weight} ${px}px Archivo, system-ui, sans-serif`;
  g.fillStyle = accent;
  g.font = font(34, 800);
  g.fillText('IRONROCK', 72, 110);
  g.fillStyle = '#8A8F98';
  g.font = font(30, 500);
  g.fillText(new Date(session.at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 72, 160);

  g.fillStyle = '#F2F1EC';
  g.font = font(88, 900);
  g.fillText(session.title.toUpperCase(), 72, 270);

  // headline numbers
  const boxes = [
    [String(stats.exercises.length), 'LIFTS'],
    [String(stats.sets), 'SETS'],
    [String(stats.reps), 'REPS'],
    [volumeLabel(stats.volume), 'VOLUME'],
  ];
  boxes.forEach(([v, l], i) => {
    const x = 72 + i * 240;
    g.fillStyle = '#17191E';
    g.fillRect(x, 320, 216, 150);
    g.fillStyle = '#F2F1EC';
    g.font = font(54, 900);
    g.fillText(v, x + 24, 400);
    g.fillStyle = '#8A8F98';
    g.font = font(22, 600);
    g.fillText(l, x + 24, 445);
  });

  // exercise list
  let y = 560;
  for (const { name, line } of topSets(session)) {
    if (y > H - 140) {
      g.fillStyle = '#8A8F98';
      g.font = font(28, 500);
      g.fillText('…', 72, y);
      break;
    }
    g.fillStyle = '#F2F1EC';
    g.font = font(38, 700);
    g.fillText(name, 72, y);
    g.fillStyle = '#8A8F98';
    g.font = font(28, 500);
    g.fillText(line, 72, y + 42);
    y += 104;
  }

  if (session.durationSec) {
    g.fillStyle = '#8A8F98';
    g.font = font(28, 500);
    g.fillText(`${Math.round(session.durationSec / 60)} min`, 72, H - 72);
  }
  return c;
}

/** Open the share sheet with the card image (download it where sharing isn't possible). */
export async function shareWorkout(session: Session, stats: WorkoutStats, accent: string): Promise<void> {
  const canvas = drawWorkoutCard(session, stats, accent);
  const fileName = `ironrock-${session.at.slice(0, 10)}.png`;
  const title = `${session.title} · ${new Date(session.at).toLocaleDateString()}`;

  if (Capacitor.isNativePlatform()) {
    const data = canvas.toDataURL('image/png').split(',')[1];
    const file = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
    await Share.share({ title, files: [file.uri] });
    return;
  }

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return;
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
