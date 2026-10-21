"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BREEDS, chapterComplete, isUnlocked, unlockText, type Breed } from "@/lib/cats";
import { CHAPTERS, LEVELS_PER_CHAPTER } from "@/lib/chapters";
import { bestStreak } from "@/lib/daily";
import { loadProgress, type Progress } from "@/lib/progress";
import { useApp } from "./AppProvider";
import { CatIcon } from "./CatIcon";
import { ThemeScene } from "./ThemeScene";

/** How close the player is to unlocking a breed, e.g. "12/25 levels". */
function unlockProgress(b: Breed, p: Progress): string | null {
  switch (b.unlock.kind) {
    case "chapter": {
      const c = b.unlock.chapter;
      if (chapterComplete(p, c)) return null;
      let done = 0;
      for (let id = c * LEVELS_PER_CHAPTER + 1; id <= (c + 1) * LEVELS_PER_CHAPTER; id++) if (p.completed[id] !== undefined) done++;
      return `${done}/${LEVELS_PER_CHAPTER} levels`;
    }
    case "streak":
      return `Best streak ${bestStreak(p)}/${b.unlock.days}`;
    case "achievements":
      return `${Object.keys(p.achievements).length}/${b.unlock.count} trophies`;
    default:
      return null;
  }
}

export function CatCafe() {
  const { cat, setCat, toast } = useApp();
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => setProgress(loadProgress()), []);
  const unlocked = progress ? BREEDS.filter((b) => isUnlocked(b, progress)) : [BREEDS[0]];
  const names = CHAPTERS.map((c) => c.name);

  const choose = (b: Breed) => {
    setCat(b.id);
    toast({ icon: <CatIcon breed={b.id} />, title: `${b.name} will hide on the board now!` });
  };

  return (
    <div className="collection theme-light">
      <ThemeScene chapter="kitten" />
      <header className="page-header">
        <Link href="/" className="icon-btn" aria-label="Home">
          ←
        </Link>
        <div>
          <h1>Cat Café</h1>
          <p>
            {unlocked.length} of {BREEDS.length} cats collected
          </p>
        </div>
      </header>
      <div className="cafe-hero card">
        <CatIcon className="cafe-hero-cat" />
        <p>
          Tap a cat to choose who hides on the board. Unlock more by finishing chapters and keeping your daily streak
          going!
        </p>
      </div>
      <div className="cat-grid">
        {BREEDS.map((b) => {
          const open = progress ? isUnlocked(b, progress) : b.unlock.kind === "start";
          const selected = open && cat === b.id;
          const hint = progress && !open ? unlockProgress(b, progress) : null;
          return (
            <button
              key={b.id}
              className={`cat-card${open ? "" : " locked"}${selected ? " selected" : ""}`}
              onClick={() => open && choose(b)}
              disabled={!open}
              aria-pressed={selected}
              aria-label={open ? `${b.name}${selected ? ", chosen" : ""}` : `Locked: ${unlockText(b, names)}`}
            >
              {selected && <span className="chosen-badge">Chosen</span>}
              <CatIcon breed={b.id} className="cat-card-icon" />
              <strong>{open ? b.name : "???"}</strong>
              <small>{open ? b.blurb : unlockText(b, names)}</small>
              {hint && <span className="unlock-progress">{hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
