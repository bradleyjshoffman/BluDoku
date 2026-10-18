import type { Difficulty, Level, StoredLevel } from "./types";

export const LEVEL_COUNT = 200;

/**
 * The level plan. Levels come in blocks of five:
 *   1st = easy (a breather), 2nd–4th = medium, 5th = hard.
 * Board size grows as you progress; easy levels are a size smaller and
 * every other hard level is a size bigger.
 */
export function levelPlan(id: number): { size: number; difficulty: Difficulty } {
  const pos = (id - 1) % 5;
  const block = Math.floor((id - 1) / 5);
  const base =
    id <= 10 ? 5 : id <= 30 ? 6 : id <= 60 ? 7 : id <= 100 ? 8 : id <= 140 ? 9 : id <= 175 ? 10 : 11;
  if (pos === 0) return { size: Math.max(5, base - 1), difficulty: "easy" };
  if (pos === 4) return { size: Math.min(11, base + (block % 2)), difficulty: "hard" };
  return { size: base, difficulty: "medium" };
}

export function levelSeed(id: number): number {
  return 0x6d656f77 ^ Math.imul(id, 2654435761);
}

export function encodeLevel(l: Level): StoredLevel {
  return {
    id: l.id,
    size: l.size,
    difficulty: l.difficulty,
    regions: l.regions.map((g) => String.fromCharCode(97 + g)).join(""),
    solution: l.solution.map((c) => c.toString(36)).join(""),
  };
}

export function decodeLevel(s: StoredLevel): Level {
  return {
    id: s.id,
    size: s.size,
    difficulty: s.difficulty,
    regions: [...s.regions].map((ch) => ch.charCodeAt(0) - 97),
    solution: [...s.solution].map((ch) => parseInt(ch, 36)),
  };
}
