import { describe, expect, it } from "vitest";
import dailyData from "@/data/daily.json";
import levelData from "@/data/levels.json";
import { addDays, DAILY_EPOCH, planFor } from "@/lib/daily";
import { assignColors, colorDistance, PALETTE } from "@/lib/palette";
import { maxSingleSquares, singleSquareRegions } from "@/lib/puzzle/generator";
import { decodeLevel, levelPlan } from "@/lib/puzzle/levels";
import { hasUniqueSolution } from "@/lib/puzzle/solver";
import type { Difficulty, StoredLevel } from "@/lib/puzzle/types";

const levels = (levelData as StoredLevel[]).map(decodeLevel);
const DIFF: Record<string, Difficulty> = { e: "easy", m: "medium", h: "hard" };
const dailies = (dailyData as [number, string, string, string][]).map(([size, d, regions, solution], i) => ({
  date: addDays(DAILY_EPOCH, i),
  size,
  difficulty: DIFF[d],
  regions: [...regions].map((ch) => ch.charCodeAt(0) - 97),
  solution: [...solution].map((ch) => parseInt(ch, 36)),
}));

/** Solution follows the rules: one cat per row, column and region, none touching. */
function validSolution(size: number, regions: number[], solution: number[]) {
  const cols = new Set(solution);
  const regs = new Set(solution.map((c, r) => regions[r * size + c]));
  const apart = solution.every((c, r) => r === 0 || Math.abs(c - solution[r - 1]) > 1);
  return solution.length === size && cols.size === size && regs.size === size && apart;
}

describe("fixed levels", () => {
  it("has all 200, following the level plan", () => {
    expect(levels).toHaveLength(200);
    for (const l of levels) {
      const plan = levelPlan(l.id);
      expect([l.size, l.difficulty]).toEqual([plan.size, plan.difficulty]);
    }
  });

  it("every level has exactly one solution, matching the stored one", () => {
    for (const l of levels) {
      expect(validSolution(l.size, l.regions, l.solution), `level ${l.id}`).toBe(true);
      expect(hasUniqueSolution(l.size, l.regions), `level ${l.id}`).toBe(true);
    }
  });

  it("rations one-square colors (none on hard, at most one otherwise)", () => {
    for (const l of levels) {
      expect(singleSquareRegions(l), `level ${l.id}`).toBeLessThanOrEqual(maxSingleSquares(l.difficulty));
    }
  });
});

describe("daily puzzles", () => {
  it("covers two years and follows the weekday plan", () => {
    expect(dailies.length).toBeGreaterThanOrEqual(730);
    for (const d of dailies) expect({ size: d.size, difficulty: d.difficulty }, d.date).toEqual(planFor(d.date));
  });

  it("every daily has exactly one solution and no extra one-square colors", () => {
    for (const d of dailies) {
      expect(validSolution(d.size, d.regions, d.solution), d.date).toBe(true);
      expect(hasUniqueSolution(d.size, d.regions), d.date).toBe(true);
      expect(singleSquareRegions(d), d.date).toBeLessThanOrEqual(maxSingleSquares(d.difficulty));
    }
  });
});

describe("region colors", () => {
  it("gives touching regions clearly different colors on every level", () => {
    for (const l of levels) {
      const idx = assignColors(l.size, l.regions).map((c) => PALETTE.indexOf(c));
      expect(new Set(idx).size, `level ${l.id} reuses a color`).toBe(l.size);
      for (let r = 0; r < l.size; r++)
        for (let c = 0; c < l.size; c++) {
          const g = l.regions[r * l.size + c];
          const right = c + 1 < l.size ? l.regions[r * l.size + c + 1] : g;
          const below = r + 1 < l.size ? l.regions[(r + 1) * l.size + c] : g;
          for (const h of [right, below]) {
            if (h !== g) expect(colorDistance(idx[g], idx[h]), `level ${l.id}`).toBeGreaterThan(25);
          }
        }
    }
  });
});
