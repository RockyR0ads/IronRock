import { useEffect, useState } from 'react';
import { imageUrl, type LibraryExercise } from '../../domain/library';
import sketchManifest from '../../data/sketches.json';

/** Exercise id → number of hand-drawn illustration frames available. */
const SKETCH_FRAMES = sketchManifest as Record<string, number>;
const sketchSrc = (id: string, i: number) => `${import.meta.env.BASE_URL}sketches/${id}/${i}.webp`;

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Shown when an exercise has neither a sketch nor CDN photos: a hand-authored
 * line drawing of the movement if one exists, otherwise a generic dumbbell.
 */
function NoPhoto({ name }: { name: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-surface-2 to-surface px-6 text-center">
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 text-muted-2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* a stylised dumbbell */}
        <path d="M6 24h4M38 24h4" />
        <rect x="10" y="18" width="5" height="12" rx="1.5" />
        <rect x="33" y="18" width="5" height="12" rx="1.5" />
        <path d="M15 24h18" />
      </svg>
      <span className="text-[12px] font-medium text-muted-2">Illustration coming soon</span>
      <span className="max-w-[80%] truncate font-display text-[13px] font-bold tracking-[-0.01em] text-muted">
        {name}
      </span>
    </div>
  );
}

/**
 * The how-to body for a library exercise: an auto-flipping illustration/photo
 * (a pseudo-gif), equipment/muscle tags, and the step-by-step instructions.
 * Presentational only — shared by the swap picker and the exercise page's
 * About tab so both read identically.
 */
export function ExerciseGuide({ ex }: { ex: LibraryExercise }) {
  const [frame, setFrame] = useState(0);
  const [broken, setBroken] = useState(false);
  const [sketchBroken, setSketchBroken] = useState(false);

  const sketchCount = SKETCH_FRAMES[ex.id] ?? 0;
  const useSketch = sketchCount > 0 && !sketchBroken;
  const frameCount = useSketch ? sketchCount : ex.images.length;

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

  const idx = frameCount > 0 ? frame % frameCount : 0;
  const src = useSketch
    ? sketchSrc(ex.id, idx)
    : ex.images.length > 0 && !broken
      ? imageUrl(ex.images[idx])
      : null;

  return (
    <>
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
          <NoPhoto name={ex.name} />
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
    </>
  );
}
