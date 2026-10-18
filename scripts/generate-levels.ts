/**
 * Builds the fixed level set into src/data/levels.json.
 * Deterministic: the same code always produces the same levels.
 *   npm run generate-levels
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { classify, generatePuzzle } from "../src/lib/puzzle/generator";
import { encodeLevel, LEVEL_COUNT, levelPlan, levelSeed } from "../src/lib/puzzle/levels";
import { hasUniqueSolution } from "../src/lib/puzzle/solver";

const out = [];
const mismatches: number[] = [];
const started = Date.now();
for (let id = 1; id <= LEVEL_COUNT; id++) {
  const { size, difficulty } = levelPlan(id);
  const p = generatePuzzle(size, difficulty, levelSeed(id), 3000);
  if (!hasUniqueSolution(size, p.regions)) throw new Error(`Level ${id} is not unique`);
  const got = classify(size, p.grade);
  if (got !== difficulty) mismatches.push(id);
  out.push(encodeLevel({ id, size, difficulty, regions: p.regions, solution: p.solution }));
  process.stdout.write(`\rLevel ${id}/${LEVEL_COUNT} (${size}x${size} ${difficulty})   `);
}
mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/levels.json", JSON.stringify(out));
console.log(`\nWrote ${out.length} levels in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
if (mismatches.length) console.log(`Closest-match (difficulty off by one): ${mismatches.join(", ")}`);
