/**
 * Per-browser progress saved in localStorage. Every access is guarded:
 * storage can be unavailable (private windows, blocked site data).
 */

const KEY = "bludoku:v1";

export interface Progress {
  /** Level id → best time in seconds. */
  completed: Record<number, number>;
  /** Level id → in-progress board: one digit per cell ("0" empty, "1" X, "2" cat, "3" strike) and seconds played. */
  boards: Record<number, { m: string; t: number }>;
  autoX: boolean;
  /** Level id → best star rating (1–3). */
  stars: Record<number, number>;
}

const empty = (): Progress => ({ completed: {}, boards: {}, autoX: true, stars: {} });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
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

export function updateProgress(fn: (p: Progress) => void) {
  const p = loadProgress();
  fn(p);
  save(p);
}

/** Stars for a win: 3 with no wrong guesses, one fewer per wrong guess. */
export function starsFor(strikes: number): number {
  return Math.max(1, 3 - strikes);
}

export function recordWin(levelId: number, seconds: number, stars: number) {
  updateProgress((p) => {
    const prev = p.completed[levelId];
    p.completed[levelId] = prev === undefined ? seconds : Math.min(prev, seconds);
    p.stars[levelId] = Math.max(p.stars[levelId] ?? 0, stars);
    delete p.boards[levelId];
  });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
