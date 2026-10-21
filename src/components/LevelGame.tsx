"use client";

import { useEffect, useState } from "react";
import { chapterPerfect } from "@/lib/cats";
import { loadProgress } from "@/lib/progress";
import type { Level } from "@/lib/puzzle/types";
import { Game } from "./Game";

/** A fixed level, shown golden once its whole chapter has 3 stars. */
export function LevelGame({ level, chapter, nextHref }: { level: Level; chapter: number; nextHref?: string }) {
  const [golden, setGolden] = useState(false);
  useEffect(() => setGolden(chapterPerfect(loadProgress(), chapter)), [chapter]);
  return (
    <Game
      puzzle={level}
      title={`Level ${level.id}`}
      difficulty={level.difficulty}
      chapter={chapter}
      golden={golden}
      mode={{ kind: "level", id: level.id, nextHref }}
    />
  );
}
