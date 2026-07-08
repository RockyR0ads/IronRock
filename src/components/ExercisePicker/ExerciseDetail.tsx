import { useEffect, useState } from 'react';
import { LIBRARY_BY_ID, imageUrl } from '../../domain/library';
import { ChevronLeft, PlusIcon } from '../common/icons';
import sketchManifest from '../../data/sketches.json';

/** Exercise id → number of hand-drawn illustration frames available. */
const SKETCH_FRAMES = sketchManifest as Record<string, number>;
const sketchSrc = (id: string, i: number) =>
  `${import.meta.env.BASE_URL}sketches/${id}/${i}.webp`;

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Preview a library exercise: its start/finish photos auto-flip (a pseudo-gif)
 * over the step-by-step instructions.
 */
export function ExerciseDetail({
  id,
  isCurrent,
  onBack,
  onSelect,
}: {
  id: string;
  isCurrent: boolean;
  onBack: () => void;
  onSelect: () => void;
}) {
  const ex = LIBRARY_BY_ID[id];
  const [frame, setFrame] = useState(0);
  const [broken, setBroken] = useState(false);
  const [sketchBroken, setSketchBroken] = useState(false);

  const sketchCount = ex ? (SKETCH_FRAMES[ex.id] ?? 0) : 0;
  const useSketch = sketchCount > 0 && !sketchBroken;
  const frameCount = useSketch ? sketchCount : (ex?.images.length ?? 0);

  // reset when switching exercises
  useEffect(() => {
    setFrame(0);
    setBroken(false);
    setSketchBroken(false);
  }, [ex]);

  // auto-flip between the available frames (illustration or photos)
  useEffect(() => {
    if (frameCount < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % frameCount), 1100);
    return () => clearInterval(t);
  }, [frameCount]);

  if (!ex) return null;
  const idx = frameCount > 0 ? frame % frameCount : 0;
  const src = useSketch
    ? sketchSrc(ex.id, idx)
    : ex.images.length > 0 && !broken
      ? imageUrl(ex.images[idx])
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-5 pb-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to list"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="m-0 min-w-0 flex-1 truncate font-display text-[16px] font-bold tracking-[-0.01em]">
          {ex.name}
        </h3>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2">
          {src ? (
            <img
              src={src}
              alt={`${ex.name} ${useSketch ? 'illustration' : 'demonstration'}`}
              onError={() => (useSketch ? setSketchBroken(true) : setBroken(true))}
              className="aspect-[4/3] w-full object-cover"
              style={useSketch ? { backgroundColor: '#f4efe3' } : undefined}
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-[12px] text-muted-2">
              No photo available
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-2">
          {ex.equipment && (
            <span className="rounded-md bg-surface-2 px-2 py-1 font-mono uppercase tracking-wide">
              {cap(ex.equipment)}
            </span>
          )}
          {ex.muscles.map((m) => (
            <span key={m} className="rounded-md bg-surface-2 px-2 py-1 font-mono uppercase tracking-wide">
              {cap(m)}
            </span>
          ))}
        </div>

        {ex.instructions.length > 0 && (
          <ol className="mt-4 space-y-2 pl-0 text-[13px] leading-relaxed text-muted">
            {ex.instructions.map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[10px] font-bold text-muted-2">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="border-t border-line px-5 py-3 pb-safe">
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent py-3 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99]"
        >
          <PlusIcon className="h-4 w-4" /> {isCurrent ? 'Keep this exercise' : 'Add this exercise'}
        </button>
      </div>
    </div>
  );
}
