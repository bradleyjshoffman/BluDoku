// Regression: ISSUE-002 — players with progress from before trophies/cats existed got no
// trophies or "new cat" announcements until their next win
// Found by /qa on 2026-10-20
// Report: .gstack/qa-reports/qa-report-localhost-2026-10-20.md
import { describe, expect, it } from "vitest";
import { catchUpProgress } from "@/lib/rewards";
import { makeProgress, solveLevels } from "./helpers";

describe("welcome-back catch-up", () => {
  it("awards earned trophies and announces earned cats for old progress", () => {
    const p = solveLevels(makeProgress(), 1, 25, 3);
    const { achievements, cats } = catchUpProgress(p);
    expect(cats.map((c) => c.id)).toEqual(["ginger"]);
    expect(achievements.map((a) => a.id)).toEqual(expect.arrayContaining(["chapter", "gold_chapter"]));
    expect(p.seenCats).toContain("ginger");
  });

  it("announces each cat only once", () => {
    const p = solveLevels(makeProgress(), 1, 25);
    catchUpProgress(p);
    expect(catchUpProgress(p)).toEqual({ achievements: [], cats: [] });
  });

  it("does nothing for a brand-new player", () => {
    expect(catchUpProgress(makeProgress())).toEqual({ achievements: [], cats: [] });
  });

  it("never awards win-only trophies without a win", () => {
    const p = solveLevels(makeProgress(), 1, 3);
    const ids = catchUpProgress(p).achievements.map((a) => a.id);
    expect(ids).not.toContain("first_win");
    expect(ids).not.toContain("perfect");
  });
});
