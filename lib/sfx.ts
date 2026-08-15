// Short UI sound cues, synthesized with the Web Audio API rather than
// shipped as audio files — nothing to source, license, or fetch. Only
// meant for the shared TV screen's takeover moments (a pick landing, the
// champion being crowned); gated behind unlockAudio() having been called
// from a real click, same as TrailerEmbed's mute policy — see TVView.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

// Must be called synchronously from within a real click handler — browsers
// only let an AudioContext start/resume in direct response to user
// interaction, so this is what actually unlocks sound for the rest of the
// session's chime/fanfare calls.
export function unlockAudio(): void {
  const context = getContext();
  if (context?.state === "suspended") {
    void context.resume();
  }
}

function playTone(context: AudioContext, freq: number, startTime: number, duration: number, peakGain: number): void {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const start = context.currentTime + startTime;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// Two-note rising chime — a pick just landed.
export function playPickChime(): void {
  const context = getContext();
  if (!context) return;
  playTone(context, 659.25, 0, 0.18, 0.15); // E5
  playTone(context, 987.77, 0.1, 0.25, 0.15); // B5
}

// Four-note ascending run — the champion is crowned.
export function playWinnerFanfare(): void {
  const context = getContext();
  if (!context) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => playTone(context, freq, i * 0.12, 0.3, 0.18));
}
