let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let muted = false;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.gain.value = 0.28;
    master.gain.value = muted ? 0 : 0.7;
    sfx.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.02);
}

export function isMuted() {
  return muted;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.2, slide = 0) {
  if (!ctx || !sfx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(sfx);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function playMove() {
  beep(420, 0.04, "square", 0.05);
}
export function playRotate() {
  beep(520, 0.06, "triangle", 0.08, 80);
}
export function playDrop() {
  beep(140, 0.1, "square", 0.14, -80);
}
export function playLock() {
  beep(180, 0.07, "square", 0.08);
}
export function playClear(lines: number) {
  beep(320 + lines * 90, 0.18, "triangle", 0.16, 220);
  setTimeout(() => beep(480 + lines * 60, 0.12, "sine", 0.1), 60);
}
export function playSpecial() {
  beep(220, 0.22, "sawtooth", 0.1, 160);
}
export function playOver() {
  beep(200, 0.3, "sawtooth", 0.14, -120);
  setTimeout(() => beep(110, 0.4, "triangle", 0.12, -40), 120);
}
export function playHold() {
  beep(360, 0.08, "sine", 0.08);
}
export function playStart() {
  beep(300, 0.1, "triangle", 0.12, 200);
  setTimeout(() => beep(480, 0.12, "triangle", 0.1), 90);
}
