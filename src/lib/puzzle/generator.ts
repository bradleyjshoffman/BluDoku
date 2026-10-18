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
    let moved = false;
    for (const cell of targets) {
      const from = regions[cell];
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
    if (!moved) return false;
  }
  return false;
}

export interface GeneratedPuzzle extends Puzzle {
  grade: GradeResult;
}

/** One attempt at a uniquely solvable, logic-solvable puzzle. */
export function generateCandidate(n: number, rng: Rng, skew = 1.5): GeneratedPuzzle | null {
  const solution = randomSolution(n, rng);
  const regions = growRegions(n, solution, rng, skew);
  if (!makeUnique(n, regions, solution, rng)) return null;
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
    // Uneven region sizes produce easier puzzles; even sizes produce harder ones.
    const skew = difficulty === "easy" ? 2.5 : difficulty === "hard" ? 0.6 : 1.3;
    const p = generateCandidate(n, rng, skew);
    if (!p) continue;
    const got = { easy: 0, medium: 1, hard: 2 }[classify(n, p.grade)];
    const dist = Math.abs(got - want);
    if (dist === 0) return p;
    if (!best || dist < best.dist) best = { p, dist };
  }
  if (best) return best.p;
  // Extremely unlikely: keep trying without a difficulty target.
  for (;;) {
    const p = generateCandidate(n, rng);
    if (p) return p;
  }
}
