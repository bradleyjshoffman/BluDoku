"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/levelData";
import { formatTime, loadProgress, type Progress } from "@/lib/progress";
import { CatIcon, PawIcon } from "./CatIcon";
import { HowToPlay } from "./HowToPlay";

const PER_CHAPTER = 25;
const CHAPTERS = [
  "Kitten Corner",
  "Yarn Alley",
  "Sunbeam Park",
  "Catnip Garden",
  "Fishbone Bay",
  "Moonlit Rooftops",
  "Tuna Tower",
  "Lion’s Den",
];

export function LevelSelect() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [chapter, setChapter] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    const next = LEVELS.find((l) => p.completed[l.id] === undefined)?.id ?? 1;
    setChapter(Math.floor((next - 1) / PER_CHAPTER));
    if (!Object.keys(p.completed).length && !Object.keys(p.boards).length) setShowHelp(true);
  }, []);

  const completed = progress?.completed ?? {};
  const nextId = LEVELS.find((l) => completed[l.id] === undefined)?.id ?? 1;
  const doneCount = Object.keys(completed).length;
  const levels = LEVELS.slice(chapter * PER_CHAPTER, (chapter + 1) * PER_CHAPTER);

  return (
    <div className="home">
      <header className="hero">
        <CatIcon className="hero-cat" />
        <h1>
          Blu<span>Doku</span>
        </h1>
        <p>Find the hidden cats! One per row, column and color, and no two cats touching.</p>
        <div className="hero-actions">
          <Link href={`/level/${nextId}/`} className="btn btn-primary btn-big">
            {doneCount ? `Continue · Level ${nextId}` : "Play Level 1"}
          </Link>
          <Link href="/random/" className="btn btn-big">
            🎲 Random puzzle
          </Link>
          <button className="btn btn-ghost" onClick={() => setShowHelp(true)}>
            How to play
          </button>
        </div>
        <p className="progress-line">
          <PawIcon className="paw-inline" /> {doneCount} / {LEVELS.length} levels solved
        </p>
      </header>

      <nav className="chapters" aria-label="Chapters">
        {CHAPTERS.map((name, i) => {
          const ids = LEVELS.slice(i * PER_CHAPTER, (i + 1) * PER_CHAPTER).map((l) => l.id);
          const done = ids.filter((id) => completed[id] !== undefined).length;
          return (
            <button
              key={name}
              className={`chapter${i === chapter ? " active" : ""}${done === ids.length ? " complete" : ""}`}
              onClick={() => setChapter(i)}
            >
              <span className="chapter-name">{name}</span>
              <span className="chapter-count">
                {done}/{ids.length}
              </span>
            </button>
          );
        })}
      </nav>

      <section className="card">
        <div className="chapter-head">
          <h2>{CHAPTERS[chapter]}</h2>
          <span>
            Levels {chapter * PER_CHAPTER + 1}–{(chapter + 1) * PER_CHAPTER}
          </span>
        </div>
        <div className="level-grid">
          {levels.map((l) => {
            const best = completed[l.id];
            const done = best !== undefined;
            return (
              <Link
                key={l.id}
                href={`/level/${l.id}/`}
                className={`level-tile tile-${l.difficulty}${done ? " done" : ""}${l.id === nextId && progress ? " next" : ""}`}
                aria-label={`Level ${l.id}, ${l.difficulty}, ${l.size} by ${l.size}${done ? `, solved in ${formatTime(best)}` : ""}`}
              >
                {l.difficulty !== "medium" && <span className="tile-badge">{l.difficulty}</span>}
                {done ? <CatIcon className="tile-cat" /> : <span className="tile-num">{l.id}</span>}
                <span className="tile-sub">{done ? formatTime(best) : `${l.size}×${l.size}`}</span>
              </Link>
            );
          })}
        </div>
        <p className="legend">
          Every set of five starts with an <b className="t-easy">easy</b> breather and ends with a{" "}
          <b className="t-hard">hard</b> challenge.
        </p>
      </section>

      <footer className="footer">Made with 🐾 · Progress is saved in this browser.</footer>
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}
