"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { chapterForSeed } from "@/lib/chapters";
import { generatePuzzle } from "@/lib/puzzle/generator";
import type { Difficulty, Puzzle } from "@/lib/puzzle/types";
import { CatIcon } from "./CatIcon";
import { Game } from "./Game";
import { SCENE_MODE, ThemeScene } from "./ThemeScene";
import { CHAPTERS } from "@/lib/chapters";

const SIZES = [5, 6, 7, 8, 9, 10, 11];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const newSeed = () => Math.floor(Math.random() * 1e9);

export function RandomGame() {
  const router = useRouter();
  const params = useSearchParams();
  const size = Math.min(11, Math.max(5, Number(params.get("size")) || 7));
  const difficulty = (DIFFICULTIES as string[]).includes(params.get("difficulty") ?? "")
    ? (params.get("difficulty") as Difficulty)
    : "medium";
  const seed = Number(params.get("seed")) || null;
  const [puzzle, setPuzzle] = useState<{ key: string; p: Puzzle } | null>(null);

  const go = (s: number, d: Difficulty, sd: number) =>
    router.replace(`/random/?size=${s}&difficulty=${d}&seed=${sd}`, { scroll: false });

  useEffect(() => {
    if (seed === null) {
      go(size, difficulty, newSeed());
      return;
    }
    const key = `${size}-${difficulty}-${seed}`;
    if (puzzle?.key === key) return;
    setPuzzle(null);
    // Let the loading kitty paint before the (synchronous) generator runs.
    const t = setTimeout(() => setPuzzle({ key, p: generatePuzzle(size, difficulty, seed, 1500) }), 40);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, difficulty, seed]);

  const settings = (
    <section className="card random-settings">
      <h2>Make a new puzzle</h2>
      <div className="chip-row" role="group" aria-label="Board size">
        {SIZES.map((s) => (
          <button
            key={s}
            className={`chip${s === size ? " active" : ""}`}
            onClick={() => go(s, difficulty, newSeed())}
          >
            {s}×{s}
          </button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="Difficulty">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            className={`chip chip-${d}${d === difficulty ? " active" : ""}`}
            onClick={() => go(size, d, newSeed())}
          >
            {d}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => go(size, difficulty, newSeed())}>
        🎲 New puzzle
      </button>
      <p className="tip">Every random puzzle has its own link, so you can share it with a friend.</p>
    </section>
  );

  const themeKey = CHAPTERS[chapterForSeed(seed ?? 0)].key;
  return (
    <div className={`theme-${SCENE_MODE[themeKey]}`}>
      {puzzle ? (
        <Game
          key={puzzle.key}
          puzzle={puzzle.p}
          title="Random puzzle"
          difficulty={difficulty}
          chapter={chapterForSeed(seed ?? 0)}
          onNewPuzzle={() => go(size, difficulty, newSeed())}
        />
      ) : (
        <div className="loading">
          <ThemeScene chapter={themeKey} />
          <CatIcon className="loading-cat" />
          <p>Herding cats…</p>
        </div>
      )}
      {settings}
    </div>
  );
}
