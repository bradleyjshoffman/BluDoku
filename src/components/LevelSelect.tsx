"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHAPTERS, LEVELS_PER_CHAPTER as PER_CHAPTER } from "@/lib/chapters";
import { LEVELS } from "@/lib/levelData";
import { formatTime, loadProgress, type Progress } from "@/lib/progress";
import { CatIcon, PawIcon } from "./CatIcon";
import { ChapterEmblem } from "./ChapterEmblem";
import { HowToPlay } from "./HowToPlay";
import { SCENE_MODE, ThemeScene } from "./ThemeScene";

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
  const stars = progress?.stars ?? {};
  const nextId = LEVELS.find((l) => completed[l.id] === undefined)?.id ?? 1;
  const doneCount = Object.keys(completed).length;
  const levels = LEVELS.slice(chapter * PER_CHAPTER, (chapter + 1) * PER_CHAPTER);
  const ch = CHAPTERS[chapter];

  return (
    <div className={`home theme-${SCENE_MODE[ch.key]}`} style={{ ["--accent" as string]: ch.accent }}>
      <ThemeScene chapter={ch.key} />
      <header className="hero">
        <CatIcon className="hero-cat" outfit={ch.key} />
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
        {CHAPTERS.map((ch, i) => {
          const ids = LEVELS.slice(i * PER_CHAPTER, (i + 1) * PER_CHAPTER).map((l) => l.id);
          const done = ids.filter((id) => completed[id] !== undefined).length;
          return (
            <button
              key={ch.key}
              className={`chapter${i === chapter ? " active" : ""}${done === ids.length ? " complete" : ""}`}
              style={{ ["--accent" as string]: ch.accent }}
              onClick={() => setChapter(i)}
              aria-pressed={i === chapter}
            >
              <ChapterEmblem chapter={ch.key} className="chapter-emblem" />
              <span className="chapter-name">{ch.name}</span>
              <span className="chapter-count">
                {done}/{ids.length}
              </span>
            </button>
          );
        })}
      </nav>

      <section className="card chapter-card" style={{ ["--accent" as string]: ch.accent }}>
        <div
          className="chapter-banner"
          style={{
            background: `linear-gradient(135deg, ${ch.banner[0]}, ${ch.banner[1]})`,
            color: ch.ink,
          }}
        >
          <div className="motif-layer" style={{ backgroundImage: `url("${ch.motif}")` }} />
          <div className="chapter-banner-text">
            <span className="chapter-kicker">
              Chapter {chapter + 1} · Levels {chapter * PER_CHAPTER + 1}–{(chapter + 1) * PER_CHAPTER}
            </span>
            <h2>{ch.name}</h2>
            <p>{ch.tagline}</p>
          </div>
          <ChapterEmblem chapter={ch.key} className="chapter-banner-art" />
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
                aria-label={`Level ${l.id}, ${l.difficulty}, ${l.size} by ${l.size}${done ? `, solved in ${formatTime(best)}${stars[l.id] ? `, ${stars[l.id]} stars` : ""}` : ""}`}
              >
                {l.difficulty !== "medium" && <span className="tile-badge">{l.difficulty}</span>}
                {done ? <CatIcon className="tile-cat" outfit={ch.key} /> : <span className="tile-num">{l.id}</span>}
                {done && stars[l.id] ? (
                  <span className="tile-stars" aria-hidden="true">
                    {"★".repeat(stars[l.id])}
                    <span className="dim">{"★".repeat(3 - stars[l.id])}</span>
                  </span>
                ) : (
                  <span className="tile-sub">{done ? formatTime(best) : `${l.size}×${l.size}`}</span>
                )}
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
