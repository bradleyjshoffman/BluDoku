/**
 * Builds the fixed level set in src/data/levels.json.
 *
 *   npm run generate-levels          keep existing levels that pass the current rules,
 *                                    regenerate only the ones that don't (or are missing)
 *   npm run generate-levels -- --all regenerate every level from scratch
 *
 * Deterministic: the same code and inputs always produce the same levels.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { classify, generatePuzzle, maxSingleSquares, singleSquareRegions } from "../src/lib/puzzle/generator";
import { decodeLevel, encodeLevel, LEVEL_COUNT, levelPlan, levelSeed } from "../src/lib/puzzle/levels";
import { grade } from "../src/lib/puzzle/logic";
import { hasUniqueSolution } from "../src/lib/puzzle/solver";
import type { StoredLevel } from "../src/lib/puzzle/types";

const FILE = "src/data/levels.json";
const all = process.argv.includes("--all");
const existing: StoredLevel[] = !all && existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];

/** Bump to give regenerated levels fresh seeds when the rules change. */
const SEED_SALT = 1;

const out: StoredLevel[] = [];
const regenerated: number[] = [];
const mismatches: number[] = [];
const started = Date.now();
for (let id = 1; id <= LEVEL_COUNT; id++) {
  const { size, difficulty } = levelPlan(id);
  const old = existing[id - 1];
  if (old && old.size === size && old.difficulty === difficulty) {
    const level = decodeLevel(old);
    if (singleSquareRegions(level) <= maxSingleSquares(difficulty)) {
      out.push(old);
      continue;
    }
  }
  const p = generatePuzzle(size, difficulty, levelSeed(id) ^ (SEED_SALT * 0x9e3779b1), 3000);
  if (!hasUniqueSolution(size, p.regions)) throw new Error(`Level ${id} is not unique`);
  if (classify(size, grade(size, p.regions)) !== difficulty) mismatches.push(id);
  out.push(encodeLevel({ id, size, difficulty, regions: p.regions, solution: p.solution }));
  regenerated.push(id);
  process.stdout.write(`\rRegenerated level ${id} (${size}x${size} ${difficulty})   `);
}
mkdirSync("src/data", { recursive: true });
writeFileSync(FILE, JSON.stringify(out));
console.log(`\nWrote ${out.length} levels in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
console.log(`Regenerated ${regenerated.length}: ${regenerated.join(", ") || "none"}`);
if (mismatches.length) console.log(`Closest-match (difficulty off by one): ${mismatches.join(", ")}`);
