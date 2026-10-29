import Model, { type IExerciseData, type Muscle } from 'react-body-highlighter';
import type { BodyPart } from '../domain/attachments';

/**
 * Anatomical muscle map for the attachment picker's first step — front view,
 * or rear view for Back — with the body part's muscles in the accent colour.
 */
const TARGET: Record<BodyPart, { type: 'anterior' | 'posterior'; muscles: Muscle[] }> = {
  Arms: { type: 'anterior', muscles: ['biceps', 'triceps', 'forearm'] },
  Back: { type: 'posterior', muscles: ['trapezius', 'upper-back', 'lower-back'] },
  Shoulders: { type: 'anterior', muscles: ['front-deltoids', 'back-deltoids'] },
  Chest: { type: 'anterior', muscles: ['chest'] },
  Legs: { type: 'anterior', muscles: ['quadriceps', 'adductor', 'abductors', 'calves'] },
  Core: { type: 'anterior', muscles: ['abs', 'obliques'] },
};

export function BodyPartIcon({ part, className }: { part: BodyPart; className?: string }) {
  const { type, muscles } = TARGET[part];
  const data: IExerciseData[] = [{ name: part, muscles }];
  return (
    <div className={className} aria-hidden>
      <Model
        type={type}
        data={data}
        bodyColor="#4A505A"
        highlightedColors={['rgb(var(--accent))']}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}
