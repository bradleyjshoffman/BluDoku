"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { loadProgress, type Progress } from "@/lib/progress";
import { ThemeScene } from "./ThemeScene";

export function Trophies() {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => setProgress(loadProgress()), []);
  const earned = progress?.achievements ?? {};
  const count = ACHIEVEMENTS.filter((a) => earned[a.id]).length;
  return (
    <div className="collection theme-light">
      <ThemeScene chapter="sunbeam" />
      <header className="page-header">
        <Link href="/" className="icon-btn" aria-label="Home">
          ←
        </Link>
        <div>
          <h1>Trophies</h1>
          <p>
            {count} of {ACHIEVEMENTS.length} earned
          </p>
        </div>
      </header>
      <div className="trophy-meter card" aria-hidden="true">
        <span style={{ width: `${(count / ACHIEVEMENTS.length) * 100}%` }} />
      </div>
      <ul className="trophy-list">
        {ACHIEVEMENTS.map((a) => {
          const when = earned[a.id];
          return (
            <li key={a.id} className={`trophy card${when ? " earned" : ""}`}>
              <span className="trophy-icon">{when ? a.icon : "🔒"}</span>
              <span>
                <strong>{a.name}</strong>
                <small>{a.description}</small>
              </span>
              {when && <time>{new Date(when).toLocaleDateString()}</time>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
