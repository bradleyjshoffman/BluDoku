import { grade, type GradeResult } from "./logic";
import { createRng, randInt, shuffle, type Rng } from "./rng";
import { findSolutions } from "./solver";
import type { Difficulty, Puzzle } from "./types";

/** A random arrangement of cats with one per row/column and no two touching. */
function randomSolution(n: number, rng: Rng): number[] {
  const cols = new Array<number>(n).fill(-1);
  const used = new Array<boolean>(n).fill(false);
  const place = (row: number): boolean => {
    if (row === n) return true;
    for (const c of shuffle(rng, Array.from({ length: n }, (_, i) => i))) {
      if (used[c] || (row > 0 && Math.abs(c - cols[row - 1]) <= 1)) continue;
      used[c] = true;
      cols[row] = c;
      if (place(row + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  place(0);
  return cols;
}

const orthoNeighbors = (n: number, i: number): number[] => {
  const r = Math.floor(i / n);
  const c = i % n;
  const out: number[] = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
};

/**
 * Grow one colored region around each cat. Each region gets a random "appetite"
 * so some colors end up big and sprawling while others stay small.
 * `skew` > 1 makes sizes more uneven (which tends to make puzzles easier).
 */
function growRegions(n: number, solution: number[], rng: Rng, skew: number): number[] {
  const regions = new Array<number>(n * n).fill(-1);
  const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
  order.forEach((g, row) => (regions[row * n + solution[row]] = g));
  const appetite = Array.from({ length: n }, () => Math.pow(rng() + 0.05, skew));
  let remaining = n * n - n;
  // First, every region claims one neighbor so none starts out stranded as a lone square.
  for (const g of shuffle(rng, Array.from({ length: n }, (_, i) => i))) {
    const seed = solution.findIndex((c, r) => regions[r * n + c] === g);
    const free = orthoNeighbors(n, seed * n + solution[seed]).filter((j) => regions[j] === -1);
    if (free.length) {
      regions[free[randInt(rng, free.length)]] = g;
      remaining--;
    }
  }
  while (remaining > 0) {
    // Pick a region weighted by appetite, then a random free neighbor of it.
    const frontier: number[][] = Array.from({ length: n }, () => []);
    for (let i = 0; i < n * n; i++) {
      if (regions[i] !== -1) continue;
      for (const j of orthoNeighbors(n, i)) {
        if (regions[j] !== -1) frontier[regions[j]].push(i);
      }
    }
    let total = 0;
    for (let g = 0; g < n; g++) if (frontier[g].length) total += appetite[g];
    let pick = rng() * total;
    let chosen = -1;
    for (let g = 0; g < n; g++) {
      if (!frontier[g].length) continue;
      pick -= appetite[g];
      chosen = g;
      if (pick <= 0) break;
    }
    const cells = frontier[chosen];
    // Grow a few cells at once for speed on big boards.
    const bites = 1 + randInt(rng, 2);
    for (let b = 0; b < bites && cells.length; b++) {
      const k = randInt(rng, cells.length);
      const cell = cells[k];
      cells.splice(k, 1);
      if (regions[cell] === -1) {
        regions[cell] = chosen;
        remaining--;
      }
    }
  }
  return regions;
}

function staysConnected(n: number, regions: number[], region: number, without: number): boolean {
  const cells: number[] = [];
  for (let i = 0; i < n * n; i++) if (regions[i] === region && i !== without) cells.push(i);
  if (!cells.length) return false;
  const seen = new Set<number>([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const i = stack.pop()!;
    for (const j of orthoNeighbors(n, i)) {
      if (j !== without && regions[j] === region && !seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * Nudge region borders until the intended solution is the only one.
 * Each round finds another solution and steals one of its cats' cells into a
 * neighboring color, which always breaks that alternative.
 */
function makeUnique(n: number, regions: number[], solution: number[], rng: Rng): boolean {
  const catCells = new Set(solution.map((c, r) => r * n + c));
  for (let round = 0; round < n * n; round++) {
    const sols = findSolutions(n, regions, 2);
    if (sols.length === 1) return true;
    const alt = sols.find((s) => s.some((c, r) => c !== solution[r]));
    if (!alt) return false;
    const targets = shuffle(
      rng,
      alt.map((c, r) => r * n + c).filter((i) => !catCells.has(i)),
    );
    // Prefer moves that keep every color at two squares or more; fall back to any move
    // (fixSingles repairs one-square colors afterwards).
    let moved = false;
    for (const minLeft of [2, 1]) {
      for (const cell of targets) {
        const from = regions[cell];
        if (regions.filter((g) => g === from).length - 1 < minLeft) continue;
        if (!staysConnected(n, regions, from, cell)) continue;
        const options = shuffle(
          rng,
          [...new Set(orthoNeighbors(n, cell).map((j) => regions[j]))].filter((g) => g !== from),
        );
        if (!options.length) continue;
        regions[cell] = options[0];
        moved = true;
        break;
      }
      if (moved) break;
    }
    if (!moved) return false;
  }
  return false;
}

/**
 * Gives each one-square color a neighboring square (taken from a bigger neighbor
 * that stays in one piece). Returns false if some lone square couldn't be grown.
 */
function fixSingles(n: number, regions: number[], solution: number[], rng: Rng): boolean {
  const catCells = new Set(solution.map((c, r) => r * n + c));
  const size = (g: number) => regions.filter((x) => x === g).length;
  let ok = true;
  for (let g = 0; g < n; g++) {
    if (size(g) !== 1) continue;
    const lone = regions.indexOf(g);
    const options = shuffle(rng, orthoNeighbors(n, lone)).filter(
      (j) => !catCells.has(j) && size(regions[j]) >= 3 && staysConnected(n, regions, regions[j], j),
    );
    if (options.length) regions[options[0]] = g;
    else ok = false;
  }
  return ok;
}

export interface GeneratedPuzzle extends Puzzle {
  grade: GradeResult;
}

/**
 * One attempt at a uniquely solvable, logic-solvable puzzle with at most
 * `maxSingles` one-square colors.
 */
export function generateCandidate(n: number, rng: Rng, skew = 1.5, maxSingles = n): GeneratedPuzzle | null {
  const solution = randomSolution(n, rng);
  const regions = growRegions(n, solution, rng, skew);
  // Making the solution unique can leave lone squares, and growing them can allow a
  // second solution again, so alternate a few times until both are settled.
  let settled = false;
  for (let pass = 0; pass < 4 && !settled; pass++) {
    if (!makeUnique(n, regions, solution, rng)) return null;
    if (singleSquareRegions({ size: n, regions }) <= maxSingles) settled = true;
    else fixSingles(n, regions, solution, rng);
  }
  if (!settled) return null;
  const g = grade(n, regions);
  if (!g.solved) return null;
  return { size: n, regions, solution, grade: g };
}

export function classify(n: number, g: GradeResult): Difficulty {
  if (g.maxTier <= 2) return "easy";
  // Weighted count of the "aha" deductions a player needs.
  const tricky = g.tierCounts[3] + g.tierCounts[4] * 2 + g.tierCounts[5] * 3;
  if (g.maxTier >= 4 || tricky >= Math.max(2, Math.floor(n / 3))) return "hard";
  return "medium";
}

/**
 * Generate a puzzle of the requested difficulty. Tries up to `attempts` boards
 * and returns the closest match if no exact match turns up.
 */
export function generatePuzzle(
  n: number,
  difficulty: Difficulty,
  seed: number,
  attempts = 400,
): GeneratedPuzzle {
  const rng = createRng(seed);
  const want = { easy: 0, medium: 1, hard: 2 }[difficulty];
  let best: { p: GeneratedPuzzle; dist: number } | null = null;
  for (let a = 0; a < attempts; a++) {
    // Uneven region sizes produce easier puzzles; even sizes produce harder ones. Big
    // boards are hard anyway, so they use uneven sizes to find a match much sooner.
    const skew = difficulty === "easy" || n >= 10 ? 2.5 : difficulty === "hard" ? 0.6 : 1.3;
    const p = generateCandidate(n, rng, skew, maxSingleSquares(difficulty));
    if (!p) continue;
    const got = { easy: 0, medium: 1, hard: 2 }[classify(n, p.grade)];
    const dist = Math.abs(got - want);
    if (dist === 0) return p;
    if (!best || dist < best.dist) best = { p, dist };
  }
  if (best) return best.p;
  // Extremely unlikely: keep trying without a difficulty target.
  for (;;) {
    const p = generateCandidate(n, rng, 1.5, maxSingleSquares(difficulty));
    if (p) return p;
  }
}

/** One-square colors hand you a cat for free, so they're rationed. */
export function maxSingleSquares(difficulty: Difficulty): number {
  return difficulty === "hard" ? 0 : 1;
}

export function singleSquareRegions(p: { size: number; regions: number[] }): number {
  const counts = new Array<number>(p.size).fill(0);
  for (const g of p.regions) counts[g]++;
  return counts.filter((c) => c === 1).length;
}
