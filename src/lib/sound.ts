/**
 * Sound effects and over-the-top voice cheers.
 *
 * Everything plays through the Web Audio API with the audio session set to
 * "ambient", so on iPhone the ring/silent switch mutes it like any game.
 * (Browsers can't see Android's silent mode; the in-game toggle covers that.)
 */

/**
 * Voice cheers are fixed by how many cats are left: "cheer-1" is always the
 * second-to-last cat, "cheer-2" the one before, and so on, so every level
 * escalates to the same climax. The last cat gets the "win" cheer.
 */
const MAX_CHEER = 10;
const CLIPS = [...Array.from({ length: MAX_CHEER }, (_, i) => `cheer-${i + 1}`), "win"];

/** Bump when the clips are re-recorded so phones don't keep playing cached copies. */
const VOICE_VERSION = "brad-1";

/** Pentatonic scale: each cat found chimes a little higher. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
const clips = new Map<string, AudioBuffer>();

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/** Call from a tap: browsers only allow audio to start after a user gesture. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    try {
      // Safari 16.4+: "ambient" respects the silent switch and mixes with other audio.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session) session.type = "ambient";
    } catch {
      /* not supported */
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      ctx = new Ctor();
    } catch {
      return; // audio blocked (e.g. a strict privacy mode): play silently
    }
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    loadClips();
  }
  if (ctx.state === "suspended") void ctx.resume().then(() => startMusic());
  else startMusic();
}

function loadClips() {
  for (const name of CLIPS) {
    fetch(`/sounds/${name}.wav?v=${VOICE_VERSION}`)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx!.decodeAudioData(data))
      .then((buf) => clips.set(name, buf))
      .catch(() => {
        /* a missing clip just means no voice for that cheer */
      });
  }
}

function ready(): AudioContext | null {
  if (!enabled || !ctx || !master || ctx.state !== "running") return null;
  return ctx;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  { type = "triangle", volume = 0.25, slideTo }: { type?: OscillatorType; volume?: number; slideTo?: number } = {},
) {
  const c = ctx!;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(master!);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function voice(name: string, delay: number, volume = 1) {
  const buf = clips.get(name);
  if (!buf) return;
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(master!);
  src.start(c.currentTime + delay);
}

/** A cat was found: a pop, a rising chime, and a cheer that gets more excited as the end nears. */
export function playFind(foundSoFar: number, total: number) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime;
  const progress = foundSoFar / total;
  const note = SCALE[Math.min(SCALE.length - 1, Math.round(progress * (SCALE.length - 3)))];
  tone(320, t, 0.08, { type: "sine", volume: 0.3, slideTo: 960 });
  tone(note, t + 0.04, 0.22, { volume: 0.22 });
  tone(note * 1.5, t + 0.1, 0.28, { volume: 0.16 });
  tone(note * 2, t + 0.16, 0.3, { type: "sine", volume: 0.1 });
  const left = total - foundSoFar;
  if (left > 0) voice(`cheer-${Math.min(left, MAX_CHEER)}`, 0.12);
}

/** A wrong guess: a sad little bonk and a hiss. */
export function playStrike() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime;
  tone(260, t, 0.22, { type: "square", volume: 0.12, slideTo: 90 });
  tone(180, t + 0.02, 0.2, { type: "sine", volume: 0.2, slideTo: 70 });
  // Hiss: filtered noise.
  const len = Math.floor(c.sampleRate * 0.35);
  const noise = c.createBuffer(1, len, c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = noise;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;
  const gain = c.createGain();
  gain.gain.value = 0.12;
  src.connect(filter).connect(gain).connect(master!);
  src.start(t + 0.12);
}

/** All cats found: a fanfare, a sparkly run, and a wildly enthusiastic cheer. */
export function playWin() {
  const c = ready();
  if (!c) return;
  // "INSANE!" right away, like every other cheer; the fanfare follows it.
  voice("win", 0.12);
  const t = c.currentTime + 0.7;
  const fanfare = [523.25, 659.25, 783.99, 1046.5];
  fanfare.forEach((f, i) => tone(f, t + i * 0.11, 0.2, { volume: 0.24 }));
  // Big final chord.
  for (const f of [1046.5, 1318.51, 1567.98, 2093]) tone(f, t + 0.48, 0.9, { volume: 0.12 });
  // Sparkly glissando.
  for (let i = 0; i < 10; i++) tone(SCALE[i], t + 0.55 + i * 0.045, 0.18, { type: "sine", volume: 0.07 });
}

/** One ding per star as they pop into the win popup. */
export function playStars(count: number, firstDelay: number, gap: number) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < count; i++) {
    const f = [1318.51, 1567.98, 2093][i];
    tone(f, t + firstDelay + i * gap, 0.35, { type: "sine", volume: 0.2 });
    tone(f * 2, t + firstDelay + i * gap + 0.02, 0.25, { type: "sine", volume: 0.06 });
  }
}

/* ---------- Background music ---------- */

/**
 * A cozy lo-fi loop composed in code: soft pads over a four-chord progression
 * (Fmaj7, Em7, Dm7, Cmaj7), a gentle bass, music-box plucks that wander a little
 * differently each time round, and a quiet brush on the off-beats.
 * It has its own volume, so muting sound effects doesn't mute it (and vice versa).
 */
const TEMPO = 72;
const EIGHTH = 60 / TEMPO / 2;
const CHORDS = [
  { bass: 41, pad: [53, 57, 60, 64] },
  { bass: 40, pad: [52, 55, 59, 62] },
  { bass: 38, pad: [50, 53, 57, 60] },
  { bass: 36, pad: [48, 52, 55, 59] },
];
const MELODY = [72, 74, 76, 79, 81, 84, 86, 88];
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

let musicWanted = false;
let musicOut: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextStepTime = 0;
let melodyAt = 3;

export function setMusicEnabled(on: boolean) {
  musicWanted = on;
  if (on) startMusic();
  else stopMusic();
}

function startMusic() {
  if (!musicWanted || !ctx || ctx.state !== "running" || musicTimer) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  musicOut = ctx.createGain();
  musicOut.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicOut.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 2);
  const warmth = ctx.createBiquadFilter();
  warmth.type = "lowpass";
  warmth.frequency.value = 2200;
  musicOut.connect(warmth).connect(ctx.destination);
  step = 0;
  nextStepTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(scheduleMusic, 60);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (ctx && musicOut) {
    const out = musicOut;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(() => out.disconnect(), 800);
  }
  musicOut = null;
}

/** Tiny deterministic random so each loop of the melody wanders differently. */
function noise01(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function musicNote(freq: number, start: number, dur: number, vol: number, type: OscillatorType, attack: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(musicOut!);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function scheduleMusic() {
  if (!ctx || !musicOut) return;
  while (nextStepTime < ctx.currentTime + 0.3) {
    const t = nextStepTime;
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const chord = CHORDS[bar % CHORDS.length];
    if (beat === 0) {
      const barLen = EIGHTH * 8;
      for (const n of chord.pad) {
        musicNote(midi(n), t, barLen + 0.8, 0.018, "triangle", 0.6);
        musicNote(midi(n) * 1.003, t, barLen + 0.8, 0.012, "sine", 0.7);
      }
    }
    if (beat === 0 || beat === 4 || (beat === 7 && noise01(bar) > 0.6)) {
      musicNote(midi(chord.bass), t, beat === 7 ? 0.35 : 0.9, 0.07, "triangle", 0.02);
    }
    // Music-box melody: a gentle random walk over the scale.
    const r = noise01(step * 1.7 + 3);
    if (r < (beat % 2 === 0 ? 0.42 : 0.18)) {
      melodyAt = Math.max(0, Math.min(MELODY.length - 1, melodyAt + Math.round((noise01(step + 99) - 0.5) * 4)));
      musicNote(midi(MELODY[melodyAt]), t, 1.1, 0.03, "sine", 0.006);
      musicNote(midi(MELODY[melodyAt]) * 2, t, 0.5, 0.006, "sine", 0.004);
    }
    // Brushed snare on beats 2 and 4.
    if (beat === 2 || beat === 6) {
      const len = Math.floor(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.value = 0.025;
      src.connect(hp).connect(g).connect(musicOut);
      src.start(t);
    }
    step++;
    nextStepTime += EIGHTH;
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stopMusic();
    else startMusic();
  });
}
