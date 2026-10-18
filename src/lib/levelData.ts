import data from "@/data/levels.json";
import { decodeLevel } from "./puzzle/levels";
import type { Level, StoredLevel } from "./puzzle/types";

const stored = data as StoredLevel[];

export const LEVELS: StoredLevel[] = stored;

export function getLevel(id: number): Level | null {
  const s = stored[id - 1];
  return s ? decodeLevel(s) : null;
}
