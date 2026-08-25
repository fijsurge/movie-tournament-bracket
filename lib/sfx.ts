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

function createNoiseBuffer(context: AudioContext, duration: number): AudioBuffer {
  const length = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// One "clap" — filtered white noise, band centered randomly per burst so a
// crowd of them doesn't sound like one sound repeated.
function playClap(context: AudioContext, startTime: number, peakGain: number): void {
  const duration = 0.12;
  const start = context.currentTime + startTime;
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context, duration);
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 2200;
  filter.Q.value = 0.8;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start(start);
  noise.stop(start + duration);
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

// A crowd's worth of overlapping claps, swelling in then tapering off —
// paired with playWinnerFanfare() for the champion reveal.
export function playApplause(): void {
  const context = getContext();
  if (!context) return;
  const totalDuration = 2.2;
  const clapCount = 45;
  for (let i = 0; i < clapCount; i++) {
    const t = Math.random() * totalDuration;
    const progress = t / totalDuration;
    const envelope = progress < 0.15 ? progress / 0.15 : progress > 0.75 ? Math.max(0, (1 - progress) / 0.25) : 1;
    playClap(context, t, 0.05 + envelope * 0.06);
  }
}

// A coin spinning down to a landing "ding" — paired with CoinFlipOverlay's
// reveal when a tie gets decided by chance. Ticks slow down (quadratic
// spacing) to sell the deceleration, alternating two close pitches so it
// reads as a physical spin rather than a repeated beep.
export function playCoinFlip(): void {
  const context = getContext();
  if (!context) return;
  const spinDuration = 1.4;
  const tickCount = 14;
  for (let i = 0; i < tickCount; i++) {
    const progress = i / (tickCount - 1);
    const t = progress * progress * spinDuration;
    playTone(context, i % 2 === 0 ? 1400 : 1100, t, 0.05, 0.08);
  }
  playTone(context, 1567.98, spinDuration + 0.05, 0.4, 0.2); // G6
  playTone(context, 2093.0, spinDuration + 0.05, 0.3, 0.12); // C7
}

// A rising filtered-noise sweep — the "whoosh" beat before a new round's
// title card, same beat trailers use for a scene transition.
export function playRoundWhoosh(): void {
  const context = getContext();
  if (!context) return;
  const duration = 0.6;
  const start = context.currentTime;
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context, duration);
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1;
  filter.frequency.setValueAtTime(200, start);
  filter.frequency.exponentialRampToValueAtTime(4000, start + duration);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.22, start + duration * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start(start);
  noise.stop(start + duration);
}
