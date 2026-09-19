/** Short beep patterns generated with Web Audio (no audio file to download). Shared by the alarm and stopwatch. */

export function createBeepContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  try {
    return Ctx ? new Ctx() : null;
  } catch {
    return null;
  }
}

/** Alternating 880/988 Hz beeps, `repeats` × 0.5 s. Same pattern as the countdown timer. */
export function playBeepPattern(context: AudioContext | null, repeats = 6): void {
  if (!context) return;
  if (context.state === 'suspended') void context.resume();
  const start = context.currentTime + 0.05;
  for (let i = 0; i < repeats; i++) {
    const t = start + i * 0.5;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = i % 2 === 0 ? 880 : 988;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.4);
  }
}
