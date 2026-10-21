import { describe, expect, it } from "vitest";
import { addDays, bestStreak, currentStreak, DAILY_EPOCH, dailyNumber, planFor, shareText } from "@/lib/daily";
import { makeProgress } from "./helpers";

const solved = (...dates: string[]) => Object.fromEntries(dates.map((d) => [d, { t: 90, s: 3 }]));

describe("daily puzzle dates", () => {
  it("numbers puzzles from the epoch, across month and year boundaries", () => {
    expect(dailyNumber(DAILY_EPOCH)).toBe(1);
    expect(dailyNumber("2026-10-31")).toBe(12);
    expect(dailyNumber("2026-11-01")).toBe(13);
    expect(dailyNumber("2027-01-01")).toBe(74);
  });

  it("addDays rolls over months and leap years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("is easy on Monday and hard on Saturday", () => {
    expect(planFor("2026-10-19")).toEqual({ size: 6, difficulty: "easy" }); // Monday
    expect(planFor("2026-10-24")).toEqual({ size: 9, difficulty: "hard" }); // Saturday
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    const p = makeProgress({ daily: solved("2026-10-18", "2026-10-19", "2026-10-20") });
    expect(currentStreak(p, "2026-10-20")).toBe(3);
  });

  it("keeps yesterday's streak alive until today is played", () => {
    const p = makeProgress({ daily: solved("2026-10-18", "2026-10-19") });
    expect(currentStreak(p, "2026-10-20")).toBe(2);
  });

  it("resets after a missed day", () => {
    const p = makeProgress({ daily: solved("2026-10-16", "2026-10-17") });
    expect(currentStreak(p, "2026-10-20")).toBe(0);
  });

  it("finds the best run even with gaps and month boundaries", () => {
    const p = makeProgress({ daily: solved("2026-10-01", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-05") });
    expect(bestStreak(p)).toBe(3);
  });
});

describe("share text", () => {
  it("shows stars, time, streak and link", () => {
    const text = shareText({ number: 12, stars: 2, time: "1:23", streak: 4, url: "https://bludoku.vercel.app/daily/" });
    expect(text).toBe("BluDoku #12 🐱 ⭐⭐☆ 1:23\n🔥 4-day streak\nhttps://bludoku.vercel.app/daily/");
  });

  it("leaves out a one-day streak", () => {
    expect(shareText({ number: 1, stars: 3, time: "0:40", streak: 1, url: "u" })).not.toContain("streak");
  });
});
