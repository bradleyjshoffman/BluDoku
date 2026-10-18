/**
 * Human-style logic solver. Used to grade puzzle difficulty and to produce hints.
 *
 * Techniques, by tier (higher tier = harder for a human):
 *  1. Single      – a row, column or color has only one spot left for its cat.
 *  2. Confined    – a color's spots all sit in one row/column (or a row/column's
 *                   spots all sit in one color), so the rest of that line/color is out.
 *  3. Blocker     – a cat on this spot would wipe out every spot of some other
 *                   row/column/color, so it can't go here.
 *  4. Group       – N colors squeezed into N rows/columns (or vice versa).
 *  5. Look-ahead  – a cat here leads, after a few simple steps, to a dead end.
 */

export type UnitKind = "row" | "col" | "region";

export interface Deduction {
  tier: number;
  technique: "single" | "confined" | "blocker" | "group" | "lookahead";
  /** Cell to place a cat on, if this deduction places one. */
  place?: number;
  /** Cells that can no longer hold a cat. */
  eliminate: number[];
  /** Units that justify the deduction (for highlighting hints). */
  units: { kind: UnitKind; index: number }[];
  /** For blocker/lookahead: the cell whose hypothetical cat causes the problem. */
  focus?: number;
}

export interface GradeResult {
  solved: boolean;
  maxTier: number;
  tierCounts: number[];
  score: number;
}

const popcount = (x: number) => {
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
};

export class LogicState {
  readonly n: number;
  readonly regions: number[];
  /** 1 if the cell may still hold a cat. */
  cand: Uint8Array;
  /** 1 if a cat is placed on the cell. */
  cat: Uint8Array;
  /** units[u] = cells; rows are 0..n-1, columns n..2n-1, regions 2n..3n-1. */
  readonly units: number[][];
  readonly neighbors: number[][];

  constructor(n: number, regions: number[], copyFrom?: LogicState) {
    this.n = n;
    this.regions = regions;
    if (copyFrom) {
      this.cand = copyFrom.cand.slice();
      this.cat = copyFrom.cat.slice();
      this.units = copyFrom.units;
      this.neighbors = copyFrom.neighbors;
      return;
    }
    this.cand = new Uint8Array(n * n).fill(1);
    this.cat = new Uint8Array(n * n);
    this.units = [];
    for (let r = 0; r < n; r++) this.units.push(Array.from({ length: n }, (_, c) => r * n + c));
    for (let c = 0; c < n; c++) this.units.push(Array.from({ length: n }, (_, r) => r * n + c));
    for (let g = 0; g < n; g++) this.units.push([]);
    for (let i = 0; i < n * n; i++) this.units[2 * n + regions[i]].push(i);
    this.neighbors = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n);
      const c = i % n;
      const list: number[] = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n) list.push(rr * n + cc);
        }
      this.neighbors.push(list);
    }
  }

  clone(): LogicState {
    return new LogicState(this.n, this.regions, this);
  }

  unitsOf(cell: number): number[] {
    const n = this.n;
    return [Math.floor(cell / n), n + (cell % n), 2 * n + this.regions[cell]];
  }

  unitDone(u: number): boolean {
    return this.units[u].some((i) => this.cat[i]);
  }

  unitCands(u: number): number[] {
    return this.units[u].filter((i) => this.cand[i] && !this.cat[i]);
  }

  /** Every other cell that a cat on `cell` rules out. */
  conflictsOf(cell: number): number[] {
    const out = new Set<number>();
    for (const u of this.unitsOf(cell)) for (const i of this.units[u]) out.add(i);
    for (const i of this.neighbors[cell]) out.add(i);
    out.delete(cell);
    return [...out];
  }

  placeCat(cell: number) {
    this.cat[cell] = 1;
    this.cand[cell] = 1;
    for (const i of this.conflictsOf(cell)) this.cand[i] = 0;
  }

  apply(d: Deduction) {
    for (const i of d.eliminate) this.cand[i] = 0;
    if (d.place !== undefined) this.placeCat(d.place);
  }

  get solved(): boolean {
    let cats = 0;
    for (let i = 0; i < this.cat.length; i++) cats += this.cat[i];
    return cats === this.n;
  }

  /** True if some unfinished unit has no spots left. */
  get broken(): boolean {
    for (let u = 0; u < this.units.length; u++) {
      if (!this.unitDone(u) && this.unitCands(u).length === 0) return true;
    }
    return false;
  }

  /** Find the easiest available deduction, up to `maxTier`. */
  step(maxTier = 5): Deduction | null {
    return (
      this.findSingle() ??
      (maxTier >= 2 ? this.findConfined() : null) ??
      (maxTier >= 3 ? this.findBlocker() : null) ??
      (maxTier >= 4 ? this.findGroup() : null) ??
      (maxTier >= 5 ? this.findLookahead() : null)
    );
  }

  private unitRef(u: number) {
    const n = this.n;
    const kind: UnitKind = u < n ? "row" : u < 2 * n ? "col" : "region";
    return { kind, index: u % n };
  }

  private findSingle(): Deduction | null {
    for (let u = 0; u < this.units.length; u++) {
      if (this.unitDone(u)) continue;
      const cands = this.unitCands(u);
      if (cands.length === 1) {
        return {
          tier: 1,
          technique: "single",
          place: cands[0],
          eliminate: [],
          units: [this.unitRef(u)],
        };
      }
    }
    return null;
  }

  private findConfined(): Deduction | null {
    const n = this.n;
    // A region whose spots all lie in one row/col; a row/col whose spots all lie in one region.
    for (let u = 0; u < this.units.length; u++) {
      if (this.unitDone(u)) continue;
      const cands = this.unitCands(u);
      if (cands.length === 0) continue;
      const isRegion = u >= 2 * n;
      const targets: number[] = [];
      if (isRegion) {
        const rows = new Set(cands.map((i) => Math.floor(i / n)));
        const cols = new Set(cands.map((i) => i % n));
        if (rows.size === 1) targets.push([...rows][0]);
        if (cols.size === 1) targets.push(n + [...cols][0]);
      } else {
        const regs = new Set(cands.map((i) => this.regions[i]));
        if (regs.size === 1) targets.push(2 * n + [...regs][0]);
      }
      for (const t of targets) {
        const inside = new Set(this.units[u]);
        const elim = this.unitCands(t).filter((i) => !inside.has(i));
        if (elim.length) {
          return {
            tier: 2,
            technique: "confined",
            eliminate: elim,
            units: [this.unitRef(u), this.unitRef(t)],
          };
        }
      }
    }
    return null;
  }

  private findBlocker(): Deduction | null {
    const n = this.n;
    for (let cell = 0; cell < n * n; cell++) {
      if (!this.cand[cell] || this.cat[cell]) continue;
      const gone = new Set(this.conflictsOf(cell));
      const own = new Set(this.unitsOf(cell));
      for (let u = 0; u < this.units.length; u++) {
        if (own.has(u) || this.unitDone(u)) continue;
        const cands = this.unitCands(u);
        if (cands.length && cands.every((i) => gone.has(i))) {
          return {
            tier: 3,
            technique: "blocker",
            eliminate: [cell],
            units: [this.unitRef(u)],
            focus: cell,
          };
        }
      }
    }
    return null;
  }

  private findGroup(): Deduction | null {
    const n = this.n;
    const openRegions: number[] = [];
    const regionRowMask: number[] = [];
    const regionColMask: number[] = [];
    for (let g = 0; g < n; g++) {
      const u = 2 * n + g;
      if (this.unitDone(u)) continue;
      let rm = 0;
      let cm = 0;
      for (const i of this.unitCands(u)) {
        rm |= 1 << Math.floor(i / n);
        cm |= 1 << i % n;
      }
      openRegions.push(g);
      regionRowMask.push(rm);
      regionColMask.push(cm);
    }
    const openRows: number[] = [];
    const rowRegionMask: number[] = [];
    const openCols: number[] = [];
    const colRegionMask: number[] = [];
    for (let r = 0; r < n; r++) {
      if (this.unitDone(r)) continue;
      let m = 0;
      for (const i of this.unitCands(r)) m |= 1 << this.regions[i];
      openRows.push(r);
      rowRegionMask.push(m);
    }
    for (let c = 0; c < n; c++) {
      if (this.unitDone(n + c)) continue;
      let m = 0;
      for (const i of this.unitCands(n + c)) m |= 1 << this.regions[i];
      openCols.push(c);
      colRegionMask.push(m);
    }

    // Try smaller groups first: they're easier for people to spot.
    const maxK = Math.max(openRegions.length, openRows.length, openCols.length) - 1;
    for (let k = 2; k <= maxK; k++) {
      const found =
        this.groupSearch(k, openRegions, regionRowMask, "region", "row") ??
        this.groupSearch(k, openRegions, regionColMask, "region", "col") ??
        this.groupSearch(k, openRows, rowRegionMask, "row", "region") ??
        this.groupSearch(k, openCols, colRegionMask, "col", "region");
      if (found) return found;
    }
    return null;
  }

  /**
   * If k units of kind `from` have all their spots within exactly k units of kind `to`,
   * those k `to` units are fully claimed: eliminate their spots outside the `from` units.
   */
  private groupSearch(
    k: number,
    items: number[],
    masks: number[],
    from: UnitKind,
    to: UnitKind,
  ): Deduction | null {
    const n = this.n;
    const m = items.length;
    if (k >= m) return null;
    const base = (kind: UnitKind) => (kind === "row" ? 0 : kind === "col" ? n : 2 * n);
    const choose = (start: number, left: number, picked: number[], union: number): Deduction | null => {
      if (popcount(union) > k) return null;
      if (left === 0) {
        if (popcount(union) !== k) return null;
        const fromCells = new Set<number>();
        for (const p of picked) for (const i of this.units[base(from) + items[p]]) fromCells.add(i);
        const elim: number[] = [];
        const toUnits: number[] = [];
        for (let t = 0; t < n; t++) {
          if (!(union & (1 << t))) continue;
          toUnits.push(t);
          for (const i of this.unitCands(base(to) + t)) if (!fromCells.has(i)) elim.push(i);
        }
        if (!elim.length) return null;
        return {
          tier: 4,
          technique: "group",
          eliminate: elim,
          units: [
            ...picked.map((p) => ({ kind: from, index: items[p] })),
            ...toUnits.map((t) => ({ kind: to, index: t })),
          ],
        };
      }
      for (let p = start; p <= m - left; p++) {
        picked.push(p);
        const r = choose(p + 1, left - 1, picked, union | masks[p]);
        picked.pop();
        if (r) return r;
      }
      return null;
    };
    return choose(0, k, [], 0);
  }

  private findLookahead(): Deduction | null {
    const n = this.n;
    for (let cell = 0; cell < n * n; cell++) {
      if (!this.cand[cell] || this.cat[cell]) continue;
      const trial = this.clone();
      trial.placeCat(cell);
      let ok = true;
      for (let guard = 0; guard < 4 * n && ok; guard++) {
        if (trial.broken) {
          ok = false;
          break;
        }
        const d = trial.step(2);
        if (!d) break;
        trial.apply(d);
      }
      if (!ok || trial.broken) {
        return { tier: 5, technique: "lookahead", eliminate: [cell], units: [], focus: cell };
      }
    }
    return null;
  }
}

/** Solve with logic only and report how hard it was. */
export function grade(size: number, regions: number[]): GradeResult {
  const state = new LogicState(size, regions);
  const tierCounts = [0, 0, 0, 0, 0, 0];
  let maxTier = 0;
  for (let guard = 0; guard < size * size * 4; guard++) {
    if (state.solved) break;
    const d = state.step();
    if (!d) break;
    state.apply(d);
    tierCounts[d.tier]++;
    maxTier = Math.max(maxTier, d.tier);
  }
  const solved = state.solved && !state.broken;
  const score =
    tierCounts[1] * 1 + tierCounts[2] * 2 + tierCounts[3] * 4 + tierCounts[4] * 8 + tierCounts[5] * 14;
  return { solved, maxTier, tierCounts, score };
}
