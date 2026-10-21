import type { Difficulty } from "./puzzle/types";
import type { Progress } from "./progress";

/** Daily puzzle #1 is on this date. */
export const DAILY_EPOCH = "2026-10-20";

/** Easier early in the week, harder toward the weekend (index = Date.getDay()). */
export const DAILY_PLAN: { size: number; difficulty: Difficulty }[] = [
  { size: 9, difficulty: "medium" }, // Sunday
  { size: 6, difficulty: "easy" }, // Monday
  { size: 7, difficulty: "easy" },
  { size: 7, difficulty: "medium" },
  { size: 8, difficulty: "medium" },
  { size: 8, difficulty: "hard" },
  { size: 9, difficulty: "hard" }, // Saturday
];

/** Local calendar date as "YYYY-MM-DD". */
export function dateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from a to b (both "YYYY-MM-DD"). */
function daysBetween(a: string, b: string): number {
  const pa = parseKey(a);
  const pb = parseKey(b);
  return Math.round((Date.UTC(pb.getFullYear(), pb.getMonth(), pb.getDate()) -
    Date.UTC(pa.getFullYear(), pa.getMonth(), pa.getDate())) / 86400000);
}

export function addDays(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** Puzzle number for a date (#1 on the epoch). */
export function dailyNumber(key: string): number {
  return daysBetween(DAILY_EPOCH, key) + 1;
}

export function planFor(key: string) {
  return DAILY_PLAN[parseKey(key).getDay()];
}

/** Seed for a date's puzzle, used if it isn't in the pre-built set. */
export function dailySeed(key: string): number {
  let h = 2166136261;
  for (const ch of `bludoku-daily-${key}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Current streak: consecutive solved days ending today (or yesterday, if today isn't done yet). */
export function currentStreak(p: Progress, today = dateKey()): number {
  let day = p.daily[today] ? today : addDays(today, -1);
  let n = 0;
  while (p.daily[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function bestStreak(p: Progress): number {
  const days = Object.keys(p.daily).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Milliseconds until local midnight, when the next daily appears. */
export function msUntilTomorrow(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function shareText(opts: { number: number; stars: number; time: string; streak: number; url: string }) {
  const stars = "⭐".repeat(opts.stars) + "☆".repeat(3 - opts.stars);
  const lines = [`BluDoku #${opts.number} 🐱 ${stars} ${opts.time}`];
  if (opts.streak > 1) lines.push(`🔥 ${opts.streak}-day streak`);
  lines.push(opts.url);
  return lines.join("\n");
}

/** Opens the share sheet (phones) or copies to the clipboard. */
export async function shareResultText(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
