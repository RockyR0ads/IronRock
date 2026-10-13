/**
 * A short "rest is up" chime via Web Audio. The context must be created/resumed
 * from a user gesture, so `primeBeep` is called when a rest starts (a set tap)
 * and `playBeep` when it elapses. Best-effort and silent on failure.
 */

let ctx: AudioContext | null = null;

export function primeBeep(): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* no audio */
  }
}

export function playBeep(): void {
  try {
    if (!ctx) return;
    const now = ctx.currentTime;
    // two short rising tones
    for (const [i, freq] of [660, 990].entries()) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const t = now + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.start(t);
      o.stop(t + 0.17);
    }
  } catch {
    /* no audio */
  }
}
