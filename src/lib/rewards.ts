import { awardAchievements, type Achievement, type WinResult } from "./achievements";
import { isUnlocked, BREEDS, type Breed } from "./cats";
import { updateProgress, type Progress } from "./progress";

export interface Unlocks {
  achievements: Achievement[];
  cats: Breed[];
}

function withUnlocks(change: (p: Progress) => void, win?: WinResult): { p: Progress; unlocks: Unlocks } {
  let unlocks: Unlocks = { achievements: [], cats: [] };
  const p = updateProgress((p) => {
    const catsBefore = new Set(BREEDS.filter((b) => isUnlocked(b, p)).map((b) => b.id));
    change(p);
    const achievements = awardAchievements(p, win);
    // Some cats unlock by trophy count, so check cats after awarding.
    const cats = BREEDS.filter((b) => !catsBefore.has(b.id) && isUnlocked(b, p));
    for (const c of cats) if (!p.seenCats.includes(c.id)) p.seenCats.push(c.id);
    unlocks = { achievements, cats };
  });
  return { p, unlocks };
}

/** A cat was found anywhere: count it and check the cat-count trophies. */
export function recordFind(): Unlocks {
  return withUnlocks((p) => {
    p.stats.catsFound++;
  }).unlocks;
}

export type WinTarget = { kind: "level"; id: number } | { kind: "daily"; date: string } | { kind: "random" };

export interface WinRecord extends Unlocks {
  /** Best time for this level/daily before this win, if any. */
  previousBest?: number;
}

export function recordWin(target: WinTarget, result: WinResult, stars: number, saveKey?: string): WinRecord {
  let previousBest: number | undefined;
  const { unlocks } = withUnlocks((p) => {
    if (target.kind === "level") {
      previousBest = p.completed[target.id];
      p.completed[target.id] = previousBest === undefined ? result.time : Math.min(previousBest, result.time);
      p.stars[target.id] = Math.max(p.stars[target.id] ?? 0, stars);
    } else if (target.kind === "daily") {
      const prev = p.daily[target.date];
      previousBest = prev?.t;
      p.daily[target.date] = prev
        ? { t: Math.min(prev.t, result.time), s: Math.max(prev.s, stars) }
        : { t: result.time, s: stars };
    } else {
      p.stats.randomSolved++;
    }
    if (saveKey) delete p.boards[saveKey];
  }, result);
  return { ...unlocks, previousBest };
}

/**
 * Progress made before trophies and cats existed (or on another version) earns them
 * retroactively: award state-based trophies and list cats not yet announced.
 * Mutates `p`; returns what's newly unlocked.
 */
export function catchUpProgress(p: Progress): Unlocks {
  const achievements = awardAchievements(p);
  const cats = BREEDS.filter((b) => b.unlock.kind !== "start" && isUnlocked(b, p) && !p.seenCats.includes(b.id));
  for (const c of cats) p.seenCats.push(c.id);
  return { achievements, cats };
}

/** Runs the catch-up against saved progress. */
export function catchUp(): Unlocks {
  let unlocks: Unlocks = { achievements: [], cats: [] };
  updateProgress((p) => {
    unlocks = catchUpProgress(p);
  });
  return unlocks;
}
