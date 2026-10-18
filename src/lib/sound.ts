/**
 * Sound effects and over-the-top voice cheers.
 *
 * Everything plays through the Web Audio API with the audio session set to
 * "ambient", so on iPhone the ring/silent switch mutes it like any game.
 * (Browsers can't see Android's silent mode; the in-game toggle covers that.)
 */

const VOICE = {
  find: [
    ["find-1a", "find-1b", "find-1c", "find-1d"],
    ["find-2a", "find-2b", "find-2c", "find-2d"],
    ["find-3a", "find-3b", "find-3c", "find-3d"],
  ],
  win: ["win-a", "win-b", "win-c", "win-d"],
};

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
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    loadClips();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function loadClips() {
  const names = [...VOICE.find.flat(), ...VOICE.win];
  for (const name of names) {
    fetch(`/sounds/${name}.wav`)
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

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

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

/** A cat was found: a pop, a rising chime, and a cheer that gets more excited as you go. */
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
  if (foundSoFar < total) {
    const tier = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
    voice(pick(VOICE.find[tier]), 0.12);
  }
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
  const t = c.currentTime + 0.25;
  const fanfare = [523.25, 659.25, 783.99, 1046.5];
  fanfare.forEach((f, i) => tone(f, t + i * 0.11, 0.2, { volume: 0.24 }));
  // Big final chord.
  for (const f of [1046.5, 1318.51, 1567.98, 2093]) tone(f, t + 0.48, 0.9, { volume: 0.12 });
  // Sparkly glissando.
  for (let i = 0; i < 10; i++) tone(SCALE[i], t + 0.55 + i * 0.045, 0.18, { type: "sine", volume: 0.07 });
  voice(pick(VOICE.win), 0.9);
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
