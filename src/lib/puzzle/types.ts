export type Difficulty = "easy" | "medium" | "hard";

/**
 * A BluDoku board. Cells are indexed row-major: index = row * size + col.
 * `regions[i]` is the color/region id (0..size-1) of cell i.
 * `solution[row]` is the column of the cat in that row.
 */
export interface Puzzle {
  size: number;
  regions: number[];
  solution: number[];
}

export interface Level extends Puzzle {
  id: number;
  difficulty: Difficulty;
}

/** Compact on-disk form used by levels.json. */
export interface StoredLevel {
  id: number;
  size: number;
  difficulty: Difficulty;
  /** One character per cell, "a" = region 0, "b" = region 1, ... */
  regions: string;
  /** One character per row: the cat's column as a base-36 digit. */
  solution: string;
}
