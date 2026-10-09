import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { ChevronLeft } from './components/common/icons';
import { ReferenceLifts } from './components/ReferenceLifts/ReferenceLifts';
import { FreestyleWorkout } from './components/FreestyleWorkout';
import { WorkoutHistory } from './components/WorkoutHistory';
import { ExerciseSelector } from './components/ExerciseProgress/ExerciseSelector';
import { ExerciseDetail } from './components/ExerciseProgress/ExerciseDetail';
import { ExercisePage } from './components/ExerciseHub/ExercisePage';
import { ProgramInfo } from './components/ProgramInfo/ProgramInfo';
import { ProgramMenu } from './components/ProgramInfo/ProgramMenu';
import { Home, type HomeDest } from './components/Home';
import { TrainWeek } from './components/TrainWeek';
import { Wendler531 } from './components/Wendler531/Wendler531';
import { WeightTracker } from './components/WeightTracker/WeightTracker';
import { Settings } from './components/Settings/Settings';
import { ActiveWorkoutBar } from './components/ActiveWorkoutBar';
import { DataBanner } from './components/DataBanner';
import { StretchSection } from './components/Stretch/StretchSection';
import { OverviewDashboard } from './components/Overview/OverviewDashboard';
import { activeWorkout } from './state/selectors';
import { useStore } from './state/StoreContext';
import { runAutoBackupIfDue } from './domain/cloudBackup';

/** One screen in the navigation stack. */
type Loc =
  | { p: 'home' }
  | { p: 'week' }
  | { p: 'reference' }
  | { p: 'freestyle' }
  | { p: 'history' }
  | { p: 'weight' }
  | { p: 'stretch' }
  | { p: 'overview' }
  | { p: 'settings' }
  | { p: 'programMenu' }
  | { p: 'programDetails'; id: string }
  | { p: 'progressSelector' }
  | { p: 'progressDetail'; liftId: string }
  | { p: 'exerciseSelector' }
  | { p: 'exercisePage'; liftId: string };

/** Home tile → the screen it opens. */
const HOME_DEST: Record<HomeDest, Loc> = {
  week: { p: 'week' },
  freestyle: { p: 'freestyle' },
  history: { p: 'history' },
  progress: { p: 'progressSelector' },
  program: { p: 'programMenu' },
  reference: { p: 'reference' },
  exercises: { p: 'exerciseSelector' },
  weight: { p: 'weight' },
  stretch: { p: 'stretch' },
  overview: { p: 'overview' },
  settings: { p: 'settings' },
};

export default function App() {
  const { state } = useStore();
  // Navigation is a stack whose top is the current screen. Each forward move
  // also pushes a browser-history entry so the phone's back button pops a
  // screen instead of exiting; popstate (hardware or in-app back) unwinds it.
  const [stack, setStack] = useState<Loc[]>([{ p: 'home' }]);
  const loc = stack[stack.length - 1];

  const push = useCallback((next: Loc) => {
    setStack((s) => [...s, next]);
    window.history.pushState(null, '');
  }, []);

  /** Go back one screen — routed through history so hardware + UI back agree. */
  const back = useCallback(() => window.history.back(), []);

  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Android hardware/gesture back button → navigate the app's own stack (via
  // history, so popstate unwinds it), and only exit when we're at the home root.
  const stackRef = useRef(stack);
  stackRef.current = stack;
  useEffect(() => {
    let remove: (() => void) | undefined;
    CapApp.addListener('backButton', () => {
      if (stackRef.current.length > 1) window.history.back();
      else CapApp.exitApp();
    })
      .then((handle) => {
        remove = () => handle.remove();
      })
      .catch(() => {
        /* not on a native platform — the web browser handles back itself */
      });
    return () => remove?.();
  }, []);

  // Once a month, if cloud backup is set up and auto is on, push a backup on
  // launch — so a lost phone is never more than ~30 days stale. Fire-and-forget:
  // a failure (offline, server down) just retries on the next launch.
  useEffect(() => {
    runAutoBackupIfDue(state.sessions.length).catch(() => {
      /* offline or server unreachable — try again next launch */
    });
    // run once per app launch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // resume banner: shown app-wide while a workout is unfinished, except on the
  // workout page itself (where you're already logging it)
  const workout = activeWorkout(state);
  const onWorkoutPage = loc.p === 'week' || loc.p === 'freestyle';

  return (
    <>
      <DataBanner onOpenSettings={() => push({ p: 'settings' })} />
      {workout && !onWorkoutPage && (
        <ActiveWorkoutBar
          workout={workout}
          onResume={() => push(workout.freestyle ? { p: 'freestyle' } : { p: 'week' })}
        />
      )}
      {renderScreen()}
    </>
  );

  function renderScreen() {
    switch (loc.p) {
    case 'week':
      return state.activeProgram === 'wendler-531' ? (
        <Wendler531
          onBack={back}
          onOpenExercise={(liftId) => push({ p: 'exercisePage', liftId })}
          onOpenReference={() => push({ p: 'reference' })}
        />
      ) : (
        <TrainWeek onBack={back} onOpenExercise={(liftId) => push({ p: 'exercisePage', liftId })} />
      );
    case 'reference':
      return <ReferencePage onBack={back} />;
    case 'freestyle':
      return (
        <FreestyleWorkout onBack={back} onOpenExercise={(liftId) => push({ p: 'exercisePage', liftId })} />
      );
    case 'history':
      return <WorkoutHistory onBack={back} />;
    case 'weight':
      return <WeightTracker onBack={back} onOpenSettings={() => push({ p: 'settings' })} />;
    case 'stretch':
      return <StretchSection onBack={back} />;
    case 'overview':
      return <OverviewDashboard onBack={back} />;
    case 'settings':
      return <Settings onBack={back} />;
    case 'programMenu':
      return <ProgramMenu onBack={back} onOpen={(id) => push({ p: 'programDetails', id })} />;
    case 'programDetails':
      return <ProgramInfo programId={loc.id} onBack={back} />;
    case 'progressSelector':
      return <ExerciseSelector onPick={(liftId) => push({ p: 'progressDetail', liftId })} onBack={back} />;
    case 'progressDetail':
      return <ExerciseDetail liftId={loc.liftId} onBack={back} />;
    case 'exerciseSelector':
      return (
        <ExerciseSelector
          onPick={(liftId) => push({ p: 'exercisePage', liftId })}
          onBack={back}
          title="Exercises"
          subtitle="Tune each lift"
          blurb="Pick an exercise to see its history and records, and to set how it's trained — rest between sets, the bar it's loaded on, and more."
        />
      );
    case 'exercisePage':
      return <ExercisePage liftId={loc.liftId} onBack={back} />;
    default:
      return <Home onGo={(dest: HomeDest) => push(HOME_DEST[dest])} />;
    }
  }
}

function ReferencePage({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-16 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-secondary/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="leading-none">
          <div className="font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            Reference lifts
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-2">
            Your estimated maxes
          </div>
        </div>
      </header>

      <p className="mb-5 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        One all-out set each — a weight, and the most reps you could manage with it. Taken to
        failure, that's all it takes to estimate your 1RM and set the target loads on every working
        set in the week.
      </p>

      <ReferenceLifts />

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </div>
  );
}
