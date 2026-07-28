import { useState } from 'react';
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
import { useStore } from './state/StoreContext';

type Page =
  | 'home'
  | 'week'
  | 'reference'
  | 'freestyle'
  | 'history'
  | 'progress'
  | 'program'
  | 'exercises';

export default function App() {
  const { state } = useStore();
  const [page, setPage] = useState<Page>('home');
  /** Lift whose charts are open, when on the progress page. */
  const [chartLift, setChartLift] = useState<string | null>(null);
  /** Lift whose exercise page is open, when on the exercises hub. */
  const [exerciseLift, setExerciseLift] = useState<string | null>(null);
  /** Program whose details are open, when on the program menu. */
  const [programView, setProgramView] = useState<string | null>(null);

  const home = () => setPage('home');

  // An open exercise page overlays any page, so tapping a lift from the week or
  // freestyle and then going Back returns you to that workout — not the hub.
  if (exerciseLift) {
    return <ExercisePage liftId={exerciseLift} onBack={() => setExerciseLift(null)} />;
  }

  if (page === 'week')
    return state.activeProgram === 'wendler-531' ? (
      <Wendler531
        onBack={home}
        onOpenExercise={setExerciseLift}
        onOpenReference={() => setPage('reference')}
      />
    ) : (
      <TrainWeek onBack={home} onOpenExercise={setExerciseLift} />
    );
  if (page === 'reference') return <ReferencePage onBack={home} />;
  if (page === 'freestyle') return <FreestyleWorkout onBack={home} onOpenExercise={setExerciseLift} />;
  if (page === 'history') return <WorkoutHistory onBack={home} />;
  if (page === 'program') {
    return programView ? (
      <ProgramInfo onBack={() => setProgramView(null)} />
    ) : (
      <ProgramMenu onBack={home} onOpen={setProgramView} />
    );
  }
  if (page === 'progress') {
    return chartLift ? (
      <ExerciseDetail liftId={chartLift} onBack={() => setChartLift(null)} />
    ) : (
      <ExerciseSelector onPick={setChartLift} onBack={home} />
    );
  }
  if (page === 'exercises') {
    return (
      <ExerciseSelector
        onPick={setExerciseLift}
        onBack={home}
        title="Exercises"
        subtitle="Tune each lift"
        blurb="Pick an exercise to see its history and records, and to set how it's trained — rest between sets, the bar it's loaded on, and more."
      />
    );
  }

  return (
    <Home
      onGo={(dest: HomeDest) => {
        if (dest === 'progress') setChartLift(null);
        if (dest === 'exercises') setExerciseLift(null);
        if (dest === 'program') setProgramView(null);
        setPage(dest);
      }}
    />
  );
}

function ReferencePage({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-16 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back home"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
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
          <ChevronLeft className="h-4 w-4" /> Back home
        </button>
      </div>
    </div>
  );
}
