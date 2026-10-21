/**
 * Region colors: 11 hues spread around the color wheel, light enough for the
 * dark X's and grey cats to read on, distinct enough to tell apart without outlines.
 */
export const PALETTE: { name: string; fill: string }[] = [
  { name: "coral", fill: "#ff9f9a" },
  { name: "orange", fill: "#ffc078" },
  { name: "yellow", fill: "#ffe46e" },
  { name: "lime", fill: "#cdee7a" },
  { name: "green", fill: "#86dd9a" },
  { name: "teal", fill: "#6fd6c6" },
  { name: "sky", fill: "#8ed2f6" },
  { name: "blue", fill: "#9fb3ff" },
  { name: "purple", fill: "#c6a6ff" },
  { name: "pink", fill: "#ffa3d4" },
  { name: "sand", fill: "#ddc6a2" },
];

export type RegionColor = (typeof PALETTE)[number];

function hexToLab(hex: string): [number, number, number] {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const LAB = PALETTE.map((c) => hexToLab(c.fill));

/** How different two palette colors look (CIE76 ΔE). */
export function colorDistance(a: number, b: number): number {
  const [l1, a1, b1] = LAB[a];
  const [l2, a2, b2] = LAB[b];
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * Picks a palette color for each region so that regions that touch get colors that
 * are as different as possible. Deterministic for a given board.
 * Returns colors indexed by region id.
 */
export function assignColors(size: number, regions: number[]): RegionColor[] {
  // Which regions touch (side by side counts double; corners count once).
  const weight = new Map<string, number>();
  const touch = (a: number, b: number, w: number) => {
    if (a === b) return;
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    weight.set(key, Math.max(weight.get(key) ?? 0, w));
  };
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const g = regions[r * size + c];
      if (c + 1 < size) touch(g, regions[r * size + c + 1], 2);
      if (r + 1 < size) touch(g, regions[(r + 1) * size + c], 2);
      if (r + 1 < size && c + 1 < size) touch(g, regions[(r + 1) * size + c + 1], 1);
      if (r + 1 < size && c > 0) touch(g, regions[(r + 1) * size + c - 1], 1);
    }
  const pairs = [...weight].map(([k, w]) => {
    const [a, b] = k.split(",").map(Number);
    return { a, b, w };
  });

  // Score: first the closest pair of side-by-side colors, then overall separation.
  const score = (perm: number[]) => {
    let worst = Infinity;
    let total = 0;
    for (const { a, b, w } of pairs) {
      const d = colorDistance(perm[a], perm[b]);
      if (w === 2) worst = Math.min(worst, d);
      total += w * Math.min(d, 60);
    }
    return worst * 1000 + total;
  };

  // Start from an even spread of the palette, then improve by swapping colors.
  const k = PALETTE.length;
  const perm = Array.from({ length: size }, (_, g) => Math.floor((g * k) / size));
  const unused = Array.from({ length: k }, (_, i) => i).filter((i) => !perm.includes(i));
  let best = score(perm);
  for (let improved = true; improved; ) {
    improved = false;
    for (let a = 0; a < size; a++) {
      // Swap with another region's color...
      for (let b = a + 1; b < size; b++) {
        [perm[a], perm[b]] = [perm[b], perm[a]];
        const s = score(perm);
        if (s > best + 1e-9) {
          best = s;
          improved = true;
        } else [perm[a], perm[b]] = [perm[b], perm[a]];
      }
      // ...or with a color nobody is using (smaller boards don't need all 11).
      for (let u = 0; u < unused.length; u++) {
        [perm[a], unused[u]] = [unused[u], perm[a]];
        const s = score(perm);
        if (s > best + 1e-9) {
          best = s;
          improved = true;
        } else [perm[a], unused[u]] = [unused[u], perm[a]];
      }
    }
  }
  return perm.map((i) => PALETTE[i]);
}
