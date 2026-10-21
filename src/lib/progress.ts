/**
 * Per-browser progress saved in localStorage. Every access is guarded:
 * storage can be unavailable (private windows, blocked site data).
 */

const KEY = "bludoku:v1";

export interface DailyResult {
  /** Seconds taken. */
  t: number;
  /** Stars earned (1–3). */
  s: number;
}

export interface Progress {
  /** Level id → best time in seconds. */
  completed: Record<number, number>;
  /**
   * Save key (a level id, or "daily-YYYY-MM-DD") → in-progress board: one digit per cell
   * ("0" empty, "1" X, "2" cat, "3" strike), seconds played, and a puzzle fingerprint.
   */
  boards: Record<string, { m: string; t: number; s?: string }>;
  /** Level id → best star rating (1–3). */
  stars: Record<number, number>;
  /** Daily puzzle results by local date "YYYY-MM-DD". */
  daily: Record<string, DailyResult>;
  /** Achievement id → when it was earned (ms since epoch). */
  achievements: Record<string, number>;
  stats: { catsFound: number; randomSolved: number };
  /** Chosen cat breed id. */
  cat: string;
  /** Cats whose unlock has already been announced. */
  seenCats: string[];
  sound: boolean;
  music: boolean;
  showTimer: boolean;
}

const empty = (): Progress => ({
  completed: {},
  boards: {},
  stars: {},
  daily: {},
  achievements: {},
  stats: { catsFound: 0, randomSolved: 0 },
  cat: "blu",
  seenCats: [],
  sound: true,
  music: true,
  showTimer: true,
});

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const saved = JSON.parse(raw);
    const base = empty();
    return { ...base, ...saved, stats: { ...base.stats, ...saved.stats } };
  } catch {
    return empty();
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress just won't persist */
  }
}

export function updateProgress(fn: (p: Progress) => void): Progress {
  const p = loadProgress();
  fn(p);
  save(p);
  return p;
}

/** Stars for a win: 3 with no wrong guesses, one fewer per wrong guess. */
export function starsFor(strikes: number): number {
  return Math.max(1, 3 - strikes);
}

/** Short fingerprint of a puzzle, so a saved board is never loaded onto a changed level. */
export function puzzleSignature(regions: number[], solution: number[]): string {
  let h = 5381;
  for (const v of [...regions, -1, ...solution]) h = (Math.imul(h, 33) ^ (v + 7)) >>> 0;
  return h.toString(36);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
