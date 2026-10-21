import type { Progress } from "@/lib/progress";

/** A fresh player's progress, with optional overrides. */
export function makeProgress(over: Partial<Progress> = {}): Progress {
  return {
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
    ...over,
  };
}

/** Marks levels from..to (inclusive) solved with the given stars. */
export function solveLevels(p: Progress, from: number, to: number, stars = 3): Progress {
  for (let id = from; id <= to; id++) {
    p.completed[id] = 60;
    p.stars[id] = stars;
  }
  return p;
}
