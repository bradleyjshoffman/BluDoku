import { chapterComplete, chapterPerfect } from "./cats";
import { CHAPTERS } from "./chapters";
import { bestStreak } from "./daily";
import type { Progress } from "./progress";

export interface WinResult {
  mode: "level" | "daily" | "random";
  size: number;
  /** Seconds taken. */
  time: number;
  strikes: number;
  hintsUsed: number;
  /** Local hour the puzzle was solved (0–23). */
  hour: number;
}

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  /** Checked after a win (with its result) or after finding a cat (no result). */
  earned: (p: Progress, win?: WinResult) => boolean;
}

const solvedLevels = (p: Progress) => Object.keys(p.completed).length;
const anyChapter = (p: Progress, test: (c: number) => boolean) => CHAPTERS.some((_, c) => test(c));

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_cat", icon: "🐾", name: "First Find", description: "Find your first cat", earned: (p) => p.stats.catsFound >= 1 },
  { id: "first_win", icon: "🎉", name: "Cat Herder", description: "Solve your first puzzle", earned: (_, w) => !!w },
  { id: "perfect", icon: "💎", name: "Flawless", description: "Solve a puzzle with no wrong guesses", earned: (_, w) => !!w && w.strikes === 0 },
  { id: "no_hints", icon: "🧠", name: "All by Myself", description: "Solve a puzzle without a hint", earned: (_, w) => !!w && w.hintsUsed === 0 },
  { id: "speedy", icon: "⚡", name: "Quick Paws", description: "Solve a puzzle in under a minute", earned: (_, w) => !!w && w.time < 60 },
  { id: "zoomies", icon: "💨", name: "Zoomies", description: "Solve an 8×8 or bigger in under 2 minutes", earned: (_, w) => !!w && w.size >= 8 && w.time < 120 },
  { id: "nine_lives", icon: "😅", name: "Nine Lives", description: "Win with only one heart left", earned: (_, w) => !!w && w.strikes === 2 },
  { id: "big_cat", icon: "🦁", name: "Big Cat Energy", description: "Solve an 11×11 puzzle", earned: (_, w) => !!w && w.size >= 11 },
  { id: "night_owl", icon: "🦉", name: "Night Owl", description: "Solve a puzzle between midnight and 5 am", earned: (_, w) => !!w && w.hour < 5 },
  { id: "chapter", icon: "📖", name: "Chapter Champion", description: "Finish every level in a chapter", earned: (p) => anyChapter(p, (c) => chapterComplete(p, c)) },
  { id: "gold_chapter", icon: "👑", name: "Gold Star Kitty", description: "Get 3 stars on every level in a chapter", earned: (p) => anyChapter(p, (c) => chapterPerfect(p, c)) },
  { id: "levels_50", icon: "🥉", name: "Fifty Felines", description: "Solve 50 levels", earned: (p) => solvedLevels(p) >= 50 },
  { id: "levels_100", icon: "🥈", name: "Century Cat", description: "Solve 100 levels", earned: (p) => solvedLevels(p) >= 100 },
  { id: "levels_200", icon: "🥇", name: "Cat Whisperer", description: "Solve all 200 levels", earned: (p) => solvedLevels(p) >= 200 },
  { id: "daily_first", icon: "📅", name: "Daily Dose", description: "Solve a daily puzzle", earned: (p) => Object.keys(p.daily).length >= 1 },
  { id: "streak_3", icon: "🔥", name: "On a Roll", description: "Solve the daily 3 days in a row", earned: (p) => bestStreak(p) >= 3 },
  { id: "streak_7", icon: "🌟", name: "Purrsistent", description: "Solve the daily 7 days in a row", earned: (p) => bestStreak(p) >= 7 },
  { id: "streak_30", icon: "🏅", name: "Creature of Habit", description: "Solve the daily 30 days in a row", earned: (p) => bestStreak(p) >= 30 },
  { id: "explorer", icon: "🎲", name: "Explorer", description: "Solve 10 random puzzles", earned: (p) => p.stats.randomSolved >= 10 },
  { id: "cats_100", icon: "😺", name: "Hundred Whiskers", description: "Find 100 cats", earned: (p) => p.stats.catsFound >= 100 },
  { id: "cats_500", icon: "😻", name: "Crazy Cat Person", description: "Find 500 cats", earned: (p) => p.stats.catsFound >= 500 },
];

/** Marks any newly earned achievements in `p` (mutates) and returns them. */
export function awardAchievements(p: Progress, win?: WinResult): Achievement[] {
  const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id] || !a.earned(p, win)) continue;
    p.achievements[a.id] = Date.now();
    fresh.push(a);
  }
  return fresh;
}
