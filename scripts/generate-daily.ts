/**
 * Pre-builds the daily puzzles into src/data/daily.json, so every player gets the
 * exact same puzzle each day (generating on the phone could differ by browser).
 *
 *   npm run generate-daily            keep existing days, add any missing
 *   npm run generate-daily -- --days 1095
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { addDays, DAILY_EPOCH, dailySeed, planFor } from "../src/lib/daily";
import { generatePuzzle } from "../src/lib/puzzle/generator";
import { hasUniqueSolution } from "../src/lib/puzzle/solver";

const FILE = "src/data/daily.json";
const daysArg = process.argv.indexOf("--days");
const DAYS = daysArg > 0 ? Number(process.argv[daysArg + 1]) : 730;

/** Compact form: [size, difficulty initial, regions as letters, solution as base-36]. */
type StoredDaily = [number, string, string, string];

const existing: StoredDaily[] = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];
const out: StoredDaily[] = [];
const started = Date.now();
for (let i = 0; i < DAYS; i++) {
  if (existing[i]) {
    out.push(existing[i]);
    continue;
  }
  const date = addDays(DAILY_EPOCH, i);
  const { size, difficulty } = planFor(date);
  const p = generatePuzzle(size, difficulty, dailySeed(date), 3000);
  if (!hasUniqueSolution(size, p.regions)) throw new Error(`Daily ${date} is not unique`);
  out.push([
    size,
    difficulty[0],
    p.regions.map((g) => String.fromCharCode(97 + g)).join(""),
    p.solution.map((c) => c.toString(36)).join(""),
  ]);
  if (i % 25 === 0) process.stdout.write(`\r${date} (${i + 1}/${DAYS})   `);
}
writeFileSync(FILE, JSON.stringify(out));
console.log(`\nWrote ${out.length} daily puzzles (${DAILY_EPOCH} to ${addDays(DAILY_EPOCH, out.length - 1)}) in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
