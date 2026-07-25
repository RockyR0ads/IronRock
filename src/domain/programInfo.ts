// The written reference behind the program — the philosophy, rules and
// protocols from the source plan. Kept as structured data so the Program info
// page can render it, and so it lives in one place. The day-by-day prescription
// is NOT duplicated here: that renders live from `program.ts`.

/** The lifter and the aim of the block. */
export const PROGRAM_PROFILE = {
  tagline: 'PPL — maintain strength & size on a cut, arm priority',
  points: [
    '12 years training · 90kg → 80kg · home gym (bench, cage w/ pull-up bar, dumbbells, EZ bar)',
    'Maintain overall strength & size through the cut',
    'Grow the arms — direct volume, 4× per week',
    'Legs stronger, not bigger — heavy and low-rep',
  ],
} as const;

/** RPE, read as reps left in the tank. */
export interface RpeRow {
  rpe: string;
  meaning: string;
}
export const RPE_TABLE: RpeRow[] = [
  { rpe: '10', meaning: 'True failure — 0 reps left' },
  { rpe: '9', meaning: '1 rep left' },
  { rpe: '8', meaning: '2 reps left' },
  { rpe: '7', meaning: '3 reps left' },
  { rpe: '6', meaning: '4 reps left' },
];

/** A titled rule or note with a short body. */
export interface InfoRule {
  title: string;
  body: string;
}

/** The two rules that make the plan work on a cut. */
export const CORE_RULES: InfoRule[] = [
  {
    title: 'Keep the loads heavy. Trim volume, not intensity.',
    body: "Heavy weight is the signal that tells your body to keep the muscle while you're eating less. Success = the same weights for the same reps as the scale drops — not PRs.",
  },
  {
    title: 'Live at RPE 7–8 on compounds.',
    body: 'Stop 2–3 reps shy of failure on the big lifts. Save RPE 9–10 for arm isolation work.',
  },
];

/** How the two priorities are trained differently. */
export const SPLIT_LOGIC: InfoRule[] = [
  {
    title: 'Legs — strength, not size',
    body: 'Heavy low-rep compounds at RPE 8, no high-rep work, never to failure. Strength at 3–5 reps is mostly neural, so they get stronger without the size.',
  },
  {
    title: 'Arms — where the growth goes',
    body: 'Direct volume in the 8–15 range at RPE 9–10, hit 4× per week. This is where the recovery freed up by easy legs gets spent.',
  },
];

/** Weekly structure. */
export const SCHEDULE = {
  sixDay: 'Push A · Pull A · Legs A · Push B · Pull B · Legs B · (rest)',
  fiveDay:
    'Run the rotation rolling and let a leg day be the one that occasionally drops — legs are lowest priority, arms keep full frequency.',
  leadNote:
    'The first lift on Push/Pull alternates heavy (A) and volume (B) across the two rotations. Legs are heavy both times.',
};

/** Anchoring starting loads off the RPE target. */
export const STARTING_LOADS: InfoRule[] = [
  {
    title: 'Heavy compounds (3–6 reps) @ RPE 8',
    body: 'Pick a weight where the last rep leaves 2 in the tank. A 4×5 bench @ RPE 8 should feel like a 7-rep max held back to 5.',
  },
  {
    title: 'Volume compounds (8–10) @ RPE 7→8',
    body: "Start the first set at RPE 7 and let it drift to RPE 8 by the last set as fatigue builds. Don't add load to chase the number — let accumulated fatigue do it.",
  },
  {
    title: 'Arm & isolation work @ RPE 9–10',
    body: 'Last 1–2 reps genuinely hard, occasionally to failure on the final set. This is the only place you push that far.',
  },
];

/** Progression rules — hold the line, push only the arms. */
export const PROGRESSION: InfoRule[] = [
  {
    title: 'Compounds — hold the line',
    body: 'Keep the same loads and reps week to week. If a top set comes in below its target RPE, add the smallest increment next time. As you lean out the same weight reads as a higher RPE — holding load steady while RPE creeps up is a win, not a stall.',
  },
  {
    title: 'Arms — double progression',
    body: 'Hit the top of the rep range on all sets at the target RPE, then add a small load and drop back to the bottom of the range. This is the one area to actively push.',
  },
];

/** When and how to deload. */
export const DELOAD = {
  when: 'Every 5–6 weeks, or sooner if you’re run down — poor sleep, achy joints, or weights reading 1–2 RPE higher than normal two sessions running (common in a deficit).',
  how: 'For one week: same exercises, halve the working sets, and cap everything at RPE 6. Loads stay roughly the same, effort drops hard. Then resume.',
};

/** Getting a session done inside an hour. */
export const HOUR_TIPS: string[] = [
  'Superset arm isolation with rear delts / lateral raises to save time without cutting work.',
  'Only the heavy first lift needs 3 min rest. Everything else: 60–90 sec.',
  'If a session runs long, the last isolation exercise is the one to drop — never the heavy compound.',
];
