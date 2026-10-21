// Regression: ISSUE-001 — sound stopped working after leaving the tab and coming back
// Found by /qa on 2026-10-20
// Report: .gstack/qa-reports/qa-report-localhost-2026-10-20.md
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Just enough of the Web Audio API to see what the game asks for. */
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: "running" | "suspended" | "interrupted" | "closed" = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  oscillators = 0;
  resumes = 0;
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  resume() {
    this.resumes++;
    this.state = "running";
    return Promise.resolve();
  }
  createGain() {
    return { gain: param(), connect: (n: unknown) => n, disconnect() {} };
  }
  createOscillator() {
    this.oscillators++;
    return { type: "", frequency: param(), connect: (n: unknown) => n, start() {}, stop() {} };
  }
  createBiquadFilter() {
    return { type: "", frequency: param(), connect: (n: unknown) => n };
  }
  createBuffer(_c: number, len: number) {
    return { getChannelData: () => new Float32Array(len) };
  }
  createBufferSource() {
    return { buffer: null, connect: (n: unknown) => n, start() {} };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
}
const param = () => ({
  value: 0,
  setValueAtTime() {},
  exponentialRampToValueAtTime() {},
  cancelScheduledValues() {},
});

async function loadSound() {
  vi.resetModules();
  FakeAudioContext.instances = [];
  const listeners: Record<string, () => void> = {};
  vi.stubGlobal("window", { AudioContext: FakeAudioContext, addEventListener() {} });
  vi.stubGlobal("navigator", {});
  vi.stubGlobal("document", {
    visibilityState: "visible",
    addEventListener: (type: string, fn: () => void) => (listeners[type] = fn),
  });
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline in tests")));
  const sound = await import("@/lib/sound");
  return { sound, listeners };
}

describe("sound after leaving the tab", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("resumes when iPhone marks audio 'interrupted', and still plays the waking tap's sound", async () => {
    const { sound } = await loadSound();
    sound.setMusicEnabled(false);
    sound.unlockAudio();
    const ac = FakeAudioContext.instances[0];
    ac.state = "interrupted"; // what iOS Safari reports after switching apps

    sound.unlockAudio(); // the next tap
    sound.playFind(1, 5); // that same tap finds a cat
    expect(ac.resumes).toBeGreaterThan(0);
    expect(ac.oscillators).toBeGreaterThan(0);
  });

  it("schedules sounds while suspended instead of dropping them", async () => {
    const { sound } = await loadSound();
    sound.setMusicEnabled(false);
    sound.unlockAudio();
    const ac = FakeAudioContext.instances[0];
    ac.state = "suspended";
    sound.playStrike();
    expect(ac.oscillators).toBeGreaterThan(0);
    expect(ac.resumes).toBe(1);
  });

  it("tries to wake audio when the tab becomes visible again", async () => {
    const { sound, listeners } = await loadSound();
    sound.unlockAudio();
    const ac = FakeAudioContext.instances[0];
    ac.state = "interrupted";
    listeners.visibilitychange();
    expect(ac.resumes).toBe(1);
  });

  it("starts a fresh audio engine if the old one was closed", async () => {
    const { sound } = await loadSound();
    sound.unlockAudio();
    FakeAudioContext.instances[0].state = "closed";
    sound.unlockAudio();
    expect(FakeAudioContext.instances).toHaveLength(2);
  });

  it("stays silent when sound effects are off", async () => {
    const { sound } = await loadSound();
    sound.setMusicEnabled(false);
    sound.setSoundEnabled(false);
    sound.unlockAudio();
    sound.playFind(1, 5);
    expect(FakeAudioContext.instances[0].oscillators).toBe(0);
  });
});
