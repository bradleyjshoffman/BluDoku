"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAT, CROSS, EMPTY, getHint, STRIKE, type Hint } from "@/lib/hint";
import type { Difficulty, Puzzle } from "@/lib/puzzle/types";
import { formatTime, loadProgress, recordWin, updateProgress } from "@/lib/progress";
import { Board } from "./Board";
import { CatIcon, PawIcon } from "./CatIcon";
import { HowToPlay } from "./HowToPlay";

export const MAX_STRIKES = 3;

interface GameProps {
  puzzle: Puzzle;
  title: string;
  difficulty: Difficulty;
  /** Fixed levels save progress; random puzzles don't. */
  levelId?: number;
  nextHref?: string;
  onNewPuzzle?: () => void;
}

type Status = "playing" | "won" | "lost";

export function Game({ puzzle, title, difficulty, levelId, nextHref, onNewPuzzle }: GameProps) {
  const n = puzzle.size;
  const blank = useMemo(() => new Array<number>(n * n).fill(EMPTY), [n]);
  const [marks, setMarks] = useState<number[]>(blank);
  const [history, setHistory] = useState<number[][]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [hint, setHint] = useState<Hint | null>(null);
  const [autoX, setAutoX] = useState(true);
  const [shaking, setShaking] = useState(false);
  const [justFound, setJustFound] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [best, setBest] = useState<{ time?: number; isNew: boolean }>({ isNew: false });
  const [showHelp, setShowHelp] = useState(false);
  const loaded = useRef(false);
  // The first tap of a double-tap toggles an X; the guess undoes that toggle.
  const pendingTap = useRef<{ cell: number; before: number[] } | null>(null);

  // Restore saved settings and any in-progress board after mount (localStorage is client-only).
  useEffect(() => {
    const p = loadProgress();
    setAutoX(p.autoX);
    if (levelId !== undefined) {
      const saved = p.boards[levelId];
      if (saved && saved.m.length === n * n) {
        setMarks([...saved.m].map(Number));
        setElapsed(saved.t);
      }
    }
    loaded.current = true;
  }, [levelId, n]);

  const strikes = marks.filter((m) => m === STRIKE).length;
  const found = marks.filter((m) => m === CAT).length;

  useEffect(() => {
    if (status !== "playing") return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  // Save the in-progress board for fixed levels.
  useEffect(() => {
    if (!loaded.current || levelId === undefined || status !== "playing") return;
    updateProgress((p) => {
      if (marks.every((m) => m === EMPTY)) delete p.boards[levelId];
      else p.boards[levelId] = { m: marks.join(""), t: elapsed };
    });
  }, [marks, elapsed, levelId, status]);

  /** Squares ruled out by cats already found: same row, column, color, or touching. */
  const ruledOut = useMemo(() => {
    const out = new Set<number>();
    marks.forEach((m, i) => {
      if (m !== CAT) return;
      const r = Math.floor(i / n);
      const c = i % n;
      for (let j = 0; j < n * n; j++) {
        if (j === i) continue;
        const rr = Math.floor(j / n);
        const cc = j % n;
        if (rr === r || cc === c || puzzle.regions[j] === puzzle.regions[i] || (Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1))
          out.add(j);
      }
    });
    return out;
  }, [marks, n, puzzle.regions]);

  const pushHistory = useCallback(() => setHistory((h) => [...h.slice(-199), marks]), [marks]);

  const onTap = (cell: number) => {
    setHint(null);
    const m = marks[cell];
    if (m === CAT || m === STRIKE) return;
    pendingTap.current = { cell, before: marks };
    pushHistory();
    const next = marks.slice();
    next[cell] = m === CROSS ? EMPTY : CROSS;
    setMarks(next);
  };

  const onDoubleTap = (cell: number) => {
    setHint(null);
    let base = marks;
    if (pendingTap.current?.cell === cell) {
      base = pendingTap.current.before;
      setHistory((h) => h.slice(0, -1));
    }
    pendingTap.current = null;
    const m = base[cell];
    if (m === CAT || m === STRIKE || (autoX && ruledOut.has(cell))) {
      setMarks(base);
      return;
    }
    const next = base.slice();
    if (puzzle.solution[Math.floor(cell / n)] === cell % n) {
      next[cell] = CAT;
      setJustFound(cell);
      setMarks(next);
      if (next.filter((x) => x === CAT).length === n) win();
    } else {
      next[cell] = STRIKE;
      setMarks(next);
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      if (next.filter((x) => x === STRIKE).length >= MAX_STRIKES) lose();
    }
  };

  const onStrokeStart = () => {
    setHint(null);
    pendingTap.current = null;
    pushHistory();
  };

  const onStrokePaint = (cell: number, mode: "paint" | "erase") => {
    setMarks((prev) => {
      const m = prev[cell];
      if (m === CAT || m === STRIKE) return prev;
      const want = mode === "paint" ? CROSS : EMPTY;
      if (m === want) return prev;
      const next = prev.slice();
      next[cell] = want;
      return next;
    });
  };

  const win = () => {
    setStatus("won");
    if (levelId !== undefined) {
      const prev = loadProgress().completed[levelId];
      recordWin(levelId, elapsed);
      setBest({ time: prev === undefined ? elapsed : Math.min(prev, elapsed), isNew: prev === undefined || elapsed < prev });
    }
    setTimeout(() => setShowOverlay(true), 1100);
  };

  const lose = () => {
    setStatus("lost");
    if (levelId !== undefined) updateProgress((p) => delete p.boards[levelId]);
    setTimeout(() => setShowOverlay(true), 600);
  };

  const undo = () => {
    if (!history.length || status !== "playing") return;
    setHint(null);
    pendingTap.current = null;
    // Found cats and strikes are permanent; only X's are undone.
    const prev = history[history.length - 1].map((m, i) =>
      marks[i] === CAT || marks[i] === STRIKE ? marks[i] : m,
    );
    setHistory((h) => h.slice(0, -1));
    setMarks(prev);
  };

  const clearCrosses = () => {
    if (status !== "playing" || !marks.includes(CROSS)) return;
    setHint(null);
    pushHistory();
    setMarks(marks.map((m) => (m === CROSS ? EMPTY : m)));
  };

  const restart = () => {
    setMarks(blank);
    setHistory([]);
    setElapsed(0);
    setHint(null);
    setStatus("playing");
    setShowOverlay(false);
    setJustFound(null);
  };

  const toggleAutoX = () => {
    const v = !autoX;
    setAutoX(v);
    updateProgress((p) => (p.autoX = v));
  };

  const showHint = () => {
    if (status !== "playing") return;
    setHint(getHint(puzzle, marks, autoX));
  };

  const hintFocus = useMemo(() => new Set(hint?.focus ?? []), [hint]);
  const hintArea = useMemo(() => new Set(hint?.area ?? []), [hint]);

  return (
    <div className="game">
      <header className="game-header">
        <Link href="/" className="icon-btn" aria-label="Back to levels">
          ←
        </Link>
        <div className="game-title">
          <h1>{title}</h1>
          <div className="game-meta">
            <span className={`pill pill-${difficulty}`}>{difficulty}</span>
            <span>
              {n}×{n}
            </span>
            <span className="timer">⏱ {formatTime(elapsed)}</span>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowHelp(true)} aria-label="How to play">
          ?
        </button>
      </header>

      <div className="status-row">
        <div className="cats-found" aria-label={`${found} of ${n} cats found`}>
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={i < found ? "slot filled" : "slot"}>
              {i < found ? <CatIcon /> : <PawIcon />}
            </span>
          ))}
        </div>
        <div className="lives" aria-label={`${MAX_STRIKES - strikes} lives left`}>
          {Array.from({ length: MAX_STRIKES }, (_, i) => (
            <span key={i} className={i < MAX_STRIKES - strikes ? "heart" : "heart lost"}>
              ♥
            </span>
          ))}
        </div>
      </div>

      <div className={`board-wrap${shaking ? " shake" : ""}`}>
        <Board
          size={n}
          regions={puzzle.regions}
          marks={marks}
          autoCrossed={autoX ? ruledOut : new Set()}
          hintFocus={hintFocus}
          hintArea={hintArea}
          justFound={justFound}
          celebrate={status === "won"}
          disabled={status !== "playing"}
          onTap={onTap}
          onDoubleTap={onDoubleTap}
          onStrokeStart={onStrokeStart}
          onStrokePaint={onStrokePaint}
        />
      </div>

      <div className={`hint-bubble${hint ? " show" : ""} ${hint?.kind ?? ""}`} role="status" aria-live="polite">
        {hint && (
          <>
            <CatIcon className="hint-cat" />
            <p>{hint.message}</p>
          </>
        )}
      </div>

      <div className="controls">
        <button className="btn" onClick={undo} disabled={!history.length || status !== "playing"}>
          ↶ Undo
        </button>
        <button className="btn" onClick={clearCrosses} disabled={status !== "playing" || !marks.includes(CROSS)}>
          Clear X’s
        </button>
        <button className="btn btn-accent" onClick={showHint} disabled={status !== "playing"}>
          💡 Hint
        </button>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={autoX} onChange={toggleAutoX} />
        <span className="toggle-track" />
        Auto-X squares around found cats
      </label>
      <p className="tip">Tap a square to mark an X. Double-tap to look for a cat. Drag to mark lots of X’s.</p>

      {showOverlay && status === "won" && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Puzzle solved">
          <Confetti />
          <div className="modal">
            <CatIcon className="modal-cat bounce" />
            <h2>Purr-fect!</h2>
            <p>
              You found all {n} cats in <strong>{formatTime(elapsed)}</strong>
              {strikes === 0 && " without a single slip"}!
            </p>
            {best.time !== undefined && (
              <p className="best">{best.isNew ? "🏆 New best time!" : `Best: ${formatTime(best.time)}`}</p>
            )}
            <div className="modal-actions">
              {nextHref && (
                <Link href={nextHref} className="btn btn-primary">
                  Next level →
                </Link>
              )}
              {onNewPuzzle && (
                <button className="btn btn-primary" onClick={onNewPuzzle}>
                  New puzzle
                </button>
              )}
              <Link href="/" className="btn">
                All levels
              </Link>
              <button className="btn btn-ghost" onClick={() => setShowOverlay(false)}>
                Admire board
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverlay && status === "lost" && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Out of lives">
          <div className="modal">
            <CatIcon className="modal-cat" sleepy />
            <h2>The cats got away!</h2>
            <p>Three wrong guesses. Shake it off and try again.</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={restart}>
                Try again
              </button>
              {onNewPuzzle && (
                <button className="btn" onClick={onNewPuzzle}>
                  New puzzle
                </button>
              )}
              <Link href="/" className="btn">
                All levels
              </Link>
            </div>
          </div>
        </div>
      )}

      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 7) * 0.18,
        duration: 2.4 + ((i * 13) % 10) / 10,
        color: ["#ff8fab", "#ffb347", "#8fd694", "#7cc6fe", "#b69cff"][i % 5],
        size: 14 + ((i * 7) % 12),
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            color: p.color,
            width: p.size,
            height: p.size,
          }}
        >
          <PawIcon />
        </span>
      ))}
    </div>
  );
}
