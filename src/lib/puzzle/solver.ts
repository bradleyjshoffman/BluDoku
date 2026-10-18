/**
 * Brute-force solution finder. Places one cat per row, tracking used columns
 * and regions as bitmasks, and rejects cats that touch the previous row's cat.
 * Returns up to `limit` solutions (each solution[row] = col).
 */
export function findSolutions(size: number, regions: number[], limit = 2): number[][] {
  const results: number[][] = [];
  const placement = new Array<number>(size).fill(-1);

  const place = (row: number, colsUsed: number, regionsUsed: number): boolean => {
    if (row === size) {
      results.push(placement.slice());
      return results.length >= limit;
    }
    const prev = row > 0 ? placement[row - 1] : -10;
    for (let col = 0; col < size; col++) {
      if (colsUsed & (1 << col)) continue;
      if (Math.abs(col - prev) <= 1) continue;
      const region = regions[row * size + col];
      if (regionsUsed & (1 << region)) continue;
      placement[row] = col;
      if (place(row + 1, colsUsed | (1 << col), regionsUsed | (1 << region))) return true;
    }
    placement[row] = -1;
    return false;
  };

  place(0, 0, 0);
  return results;
}

export function hasUniqueSolution(size: number, regions: number[]): boolean {
  return findSolutions(size, regions, 2).length === 1;
}
