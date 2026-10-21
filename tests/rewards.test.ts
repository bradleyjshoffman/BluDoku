import { describe, expect, it } from "vitest";
import { awardAchievements, type WinResult } from "@/lib/achievements";
import { BREEDS, chapterPerfect, chapterStars, isUnlocked, unlockedBreeds } from "@/lib/cats";
import { makeProgress, solveLevels } from "./helpers";

const win = (over: Partial<WinResult> = {}): WinResult => ({
  mode: "level",
  size: 6,
  time: 90,
  strikes: 1,
  hintsUsed: 1,
  hour: 14,
  ...over,
});

const breed = (id: string) => BREEDS.find((b) => b.id === id)!;

describe("trophies", () => {
  it("awards each trophy once", () => {
    const p = makeProgress();
    const first = awardAchievements(p, win({ strikes: 0 })).map((a) => a.id);
    expect(first).toContain("first_win");
    expect(first).toContain("perfect");
    expect(awardAchievements(p, win({ strikes: 0 })).map((a) => a.id)).not.toContain("perfect");
  });

  it("needs a real win for win-only trophies", () => {
    const p = makeProgress({ stats: { catsFound: 1, randomSolved: 0 } });
    const ids = awardAchievements(p).map((a) => a.id);
    expect(ids).toEqual(["first_cat"]);
  });

  it("matches time, size and lives conditions exactly", () => {
    const ids = awardAchievements(makeProgress(), win({ time: 119, size: 8, strikes: 2, hour: 3 })).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["zoomies", "nine_lives", "night_owl"]));
    expect(ids).not.toContain("speedy");
    const slow = awardAchievements(makeProgress(), win({ time: 120, size: 8, hour: 5 })).map((a) => a.id);
    expect(slow).not.toContain("zoomies");
    expect(slow).not.toContain("night_owl");
  });

  it("awards chapter trophies from saved progress alone", () => {
    const p = solveLevels(makeProgress(), 1, 25);
    const ids = awardAchievements(p).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["chapter", "gold_chapter"]));
  });
});

describe("cat unlocks", () => {
  it("starts with only Blu", () => {
    expect(unlockedBreeds(makeProgress()).map((b) => b.id)).toEqual(["blu"]);
  });

  it("unlocks a chapter's cat only when all 25 levels are done", () => {
    const p = solveLevels(makeProgress(), 1, 24);
    expect(isUnlocked(breed("ginger"), p)).toBe(false);
    solveLevels(p, 25, 25);
    expect(isUnlocked(breed("ginger"), p)).toBe(true);
    expect(isUnlocked(breed("tux"), p)).toBe(false);
  });

  it("unlocks streak cats from the best streak, not just the current one", () => {
    const daily = Object.fromEntries(["2026-10-01", "2026-10-02", "2026-10-03"].map((d) => [d, { t: 60, s: 3 }]));
    const p = makeProgress({ daily });
    expect(isUnlocked(breed("mochi"), p)).toBe(true);
    expect(isUnlocked(breed("sphynx"), p)).toBe(false);
  });

  it("unlocks Stardust at 10 trophies", () => {
    const achievements = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`t${i}`, 1]));
    expect(isUnlocked(breed("stardust"), makeProgress({ achievements }))).toBe(true);
  });
});

describe("chapter stars", () => {
  it("adds up stars and detects a perfect chapter", () => {
    const p = solveLevels(makeProgress(), 26, 50, 3);
    expect(chapterStars(p, 1)).toBe(75);
    expect(chapterPerfect(p, 1)).toBe(true);
    p.stars[30] = 2;
    expect(chapterStars(p, 1)).toBe(74);
    expect(chapterPerfect(p, 1)).toBe(false);
  });
});
