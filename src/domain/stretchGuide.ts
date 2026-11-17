import { LIBRARY_BY_ID, type LibraryExercise } from './library';
import { stretchById } from './stretches';

/**
 * The how-to for a stretch, shaped as a library exercise so the shared
 * ExerciseGuide can render it: library photos where the stretch has a match,
 * hand-written steps where it has them (they win over the library's).
 */
export function stretchGuide(id: string): LibraryExercise {
  const st = stretchById(id);
  const lib = st.lib ? LIBRARY_BY_ID[st.lib] : undefined;
  return {
    id: lib?.id ?? `stretch-${id}`,
    name: st.name,
    equipment: lib?.equipment ?? null,
    muscles: lib?.muscles ?? [],
    images: lib?.images ?? [],
    instructions: st.steps ?? lib?.instructions ?? (st.cue ? [st.cue] : []),
  } as LibraryExercise;
}

/** A YouTube search for the stretch, for when photos aren't enough. */
export function stretchVideoUrl(id: string): string {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${stretchById(id).name} stretch how to`);
}
