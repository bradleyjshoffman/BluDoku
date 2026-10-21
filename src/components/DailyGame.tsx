"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/chapters";
import { currentStreak, dailyNumber, dailySeed, dateKey, planFor, shareResultText, shareText } from "@/lib/daily";
import { formatTime, loadProgress, type DailyResult } from "@/lib/progress";
import { generatePuzzle } from "@/lib/puzzle/generator";
import type { Difficulty, Puzzle } from "@/lib/puzzle/types";
import { CatIcon } from "./CatIcon";
import { useApp } from "./AppProvider";
import { DailyFooter, Game } from "./Game";
import Link from "next/link";
import { SCENE_MODE, ThemeScene } from "./ThemeScene";

type StoredDaily = [number, string, string, string];
const DIFFICULTY: Record<string, Difficulty> = { e: "easy", m: "medium", h: "hard" };

/** Today's daily puzzle (by the player's local date). */
export function DailyGame() {
  const [today, setToday] = useState<{ date: string; number: number; puzzle: Puzzle; difficulty: Difficulty } | null>(null);
  const [done, setDone] = useState<DailyResult | null>(null);
  const [replay, setReplay] = useState(false);

  useEffect(() => {
    const date = dateKey();
    const number = dailyNumber(date);
    setDone(loadProgress().daily[date] ?? null);
    import("@/data/daily.json").then((mod) => {
      const all = mod.default as StoredDaily[];
      const stored = number >= 1 ? all[number - 1] : undefined;
      if (stored) {
        const [size, d, regions, solution] = stored;
        setToday({
          date,
          number,
          difficulty: DIFFICULTY[d],
          puzzle: {
            size,
            regions: [...regions].map((ch) => ch.charCodeAt(0) - 97),
            solution: [...solution].map((ch) => parseInt(ch, 36)),
          },
        });
      } else {
        // Past the pre-built range: generate it here instead.
        const { size, difficulty } = planFor(date);
        setToday({ date, number, difficulty, puzzle: generatePuzzle(size, difficulty, dailySeed(date), 1500) });
      }
    });
  }, []);

  if (!today) {
    return (
      <div className="loading">
        <CatIcon className="loading-cat" />
        <p>Fetching today’s cats…</p>
      </div>
    );
  }
  const weekday = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const chapter = (today.number - 1 + CHAPTERS.length * 1000) % CHAPTERS.length;
  if (done && !replay) {
    return <DailyDone number={today.number} result={done} chapter={chapter} onReplay={() => setReplay(true)} />;
  }
  return (
    <Game
      key={today.date}
      puzzle={today.puzzle}
      title={`${weekday}’s puzzle`}
      difficulty={today.difficulty}
      chapter={chapter}
      mode={{ kind: "daily", date: today.date, number: today.number }}
    />
  );
}

/** Today's daily is already solved: show the result, share it, and count down to tomorrow. */
function DailyDone({
  number,
  result,
  chapter,
  onReplay,
}: {
  number: number;
  result: DailyResult;
  chapter: number;
  onReplay: () => void;
}) {
  const key = CHAPTERS[chapter].key;
  const { toast } = useApp();
  const share = async () => {
    const text = shareText({
      number,
      stars: result.s,
      time: formatTime(result.t),
      streak: currentStreak(loadProgress()),
      url: `${window.location.origin}/daily/`,
    });
    if ((await shareResultText(text)) === "copied") toast({ icon: "📋", title: "Copied!", detail: "Paste it anywhere to share" });
  };
  return (
    <div className={`daily-done theme-${SCENE_MODE[key]}`}>
      <ThemeScene chapter={key} />
      <div className="modal">
        <CatIcon className="modal-cat" outfit={key} />
        <h2>Daily #{number} solved!</h2>
        <div className="stars static" aria-label={`${result.s} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < result.s ? "star-earned" : "star-empty"}>
              ★
            </span>
          ))}
        </div>
        <p>
          You found every cat in <strong>{formatTime(result.t)}</strong>.
        </p>
        <DailyFooter />
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={share}>
            📤 Share result
          </button>
          <Link href="/" className="btn">
            Home
          </Link>
          <button className="btn btn-ghost" onClick={onReplay}>
            Play again for fun
          </button>
        </div>
      </div>
    </div>
  );
}
