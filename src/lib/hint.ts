import { LogicState, type UnitKind } from "./puzzle/logic";
import type { Puzzle } from "./puzzle/types";
import type { RegionColor } from "./palette";

export const EMPTY = 0;
export const CROSS = 1;
/** A found cat (always correct: guesses are checked against the solution). */
export const CAT = 2;
/** A wrong guess: locked red X. */
export const STRIKE = 3;

export interface Hint {
  message: string;
  /** Cells the hint is about (sparkle). */
  focus: number[];
  /** Rows/columns/colors that explain the hint (soft glow). */
  area: number[];
  kind: "cat" | "cross" | "mistake";
}

type UnitRef = { kind: UnitKind; index: number };

function unitName(u: UnitRef, colors: RegionColor[], capital = false): string {
  const s =
    u.kind === "row"
      ? `row ${u.index + 1}`
      : u.kind === "col"
        ? `column ${u.index + 1}`
        : `the ${colors[u.index].name} color`;
  return capital ? s[0].toUpperCase() + s.slice(1) : s;
}

function listNames(units: UnitRef[], colors: RegionColor[]): string {
  if (!units.length) return "";
  const kind = units[0].kind;
  const nums = units.map((u) => (u.kind === "region" ? colors[u.index].name : String(u.index + 1)));
  const joined = nums.length === 2 ? `${nums[0]} and ${nums[1]}` : `${nums.slice(0, -1).join(", ")} and ${nums.at(-1)}`;
  return kind === "row" ? `rows ${joined}` : kind === "col" ? `columns ${joined}` : `the ${joined} colors`;
}

function unitCells(state: LogicState, u: UnitRef): number[] {
  const n = state.n;
  const base = u.kind === "row" ? 0 : u.kind === "col" ? n : 2 * n;
  return state.units[base + u.index];
}

/** `colors` are the region colors as shown on the board, so hints name the right ones. */
export function getHint(puzzle: Puzzle, marks: number[], colors: RegionColor[]): Hint {
  const { size: n, solution, regions } = puzzle;
  const isSolutionCell = (i: number) => solution[Math.floor(i / n)] === i % n;

  const wrongCross = marks.findIndex((m, i) => m === CROSS && isSolutionCell(i));
  if (wrongCross >= 0) {
    return {
      message: "Psst… a cat actually belongs under this X.",
      focus: [wrongCross],
      area: [],
      kind: "mistake",
    };
  }

  const state = new LogicState(n, regions);
  marks.forEach((m, i) => m === CAT && state.placeCat(i));
  const implied = marks
    .map((m, i) => (m === EMPTY && !state.cand[i] ? i : -1))
    .filter((i) => i >= 0);
  if (implied.length) {
    return {
      message: "These squares can't have a cat: each one shares a row, column or color with a cat, or touches one.",
      focus: implied,
      area: [],
      kind: "cross",
    };
  }
  marks.forEach((m, i) => (m === CROSS || m === STRIKE) && (state.cand[i] = 0));

  const d = state.step();
  if (!d) {
    const row = solution.findIndex((c, r) => marks[r * n + c] !== CAT);
    return { message: "Double-tap here to find a cat!", focus: [row * n + solution[row]], area: [], kind: "cat" };
  }
  const area = [...new Set(d.units.flatMap((u) => unitCells(state, u)))];
  switch (d.technique) {
    case "single":
      return {
        message: `${unitName(d.units[0], colors, true)} has only one spot left, so a cat must be hiding here. Double-tap it!`,
        focus: [d.place!],
        area,
        kind: "cat",
      };
    case "confined": {
      const [src, dst] = d.units;
      const message =
        src.kind === "region"
          ? `${unitName(src, colors, true)} only fits in ${unitName(dst, colors)}, so the rest of ${unitName(dst, colors)} can't have a cat.`
          : `Every open spot in ${unitName(src, colors)} is ${colors[dst.index].name}, so the rest of ${unitName(dst, colors)} can't have a cat.`;
      return { message, focus: d.eliminate, area, kind: "cross" };
    }
    case "blocker":
      return {
        message: `A cat here would leave no room for ${unitName(d.units[0], colors)}. Cross it out!`,
        focus: d.eliminate,
        area,
        kind: "cross",
      };
    case "group": {
      const k = d.units.length / 2;
      const from = d.units.slice(0, k);
      const to = d.units.slice(k);
      const fromName = listNames(from, colors);
      return {
        message: `${fromName[0].toUpperCase() + fromName.slice(1)} only fit in ${listNames(to, colors)}. Those ${k} cats are spoken for, so the other spots there can be crossed out.`,
        focus: d.eliminate,
        area,
        kind: "cross",
      };
    }
    case "lookahead":
      return {
        message: "If a cat sat here, a few moves later some row, column or color would run out of room. Cross it out!",
        focus: d.eliminate,
        area,
        kind: "cross",
      };
  }
}
