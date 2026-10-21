"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAT, CROSS, EMPTY, getHint, STRIKE, type Hint } from "@/lib/hint";
import type { Difficulty, Puzzle } from "@/lib/puzzle/types";
import { formatTime, loadProgress, puzzleSignature, recordWin, starsFor, updateProgress } from "@/lib/progress";
import { playFind, playStars, playStrike, playWin, setSoundEnabled, unlockAudio } from "@/lib/sound";
import { Board } from "./Board";
import { CHAPTERS, LEVELS_PER_CHAPTER } from "@/lib/chapters";
import { assignColors } from "@/lib/palette";
import { CatIcon, PawIcon } from "./CatIcon";
import { ChapterEmblem } from "./ChapterEmblem";
import { SCENE_MODE, ThemeScene } from "./ThemeScene";
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
  /** Chapter index, for theming fixed levels. */
  chapter?: number;
}

type Status = "playing" | "won" | "lost";

export function Game({ puzzle, title, difficulty, levelId, nextHref, onNewPuzzle, chapter }: GameProps) {
  const n = puzzle.size;
  const ch = chapter === undefined ? null : CHAPTERS[chapter];
  const chapterDone = ch !== null && levelId !== undefined && levelId % LEVELS_PER_CHAPTER === 0;
  const colors = useMemo(() => assignColors(n, puzzle.regions), [n, puzzle.regions]);
  const blank = useMemo(() => new Array<number>(n * n).fill(EMPTY), [n]);
  const [marks, setMarks] = useState<number[]>(blank);
  const [history, setHistory] = useState<number[][]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [hint, setHint] = useState<Hint | null>(null);
  const [sound, setSound] = useState(true);
  const [shaking, setShaking] = useState(false);
  const [justFound, setJustFound] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [best, setBest] = useState<{ time?: number; isNew: boolean }>({ isNew: false });
  const [showHelp, setShowHelp] = useState(false);
  const [fx, setFx] = useState<{ id: number; cell: number; kind: "find" | "miss"; text: string } | null>(null);
  const fxId = useRef(0);
  const loaded = useRef(false);
  // The first tap of a double-tap toggles an X; the guess undoes that toggle.
  const pendingTap = useRef<{ cell: number; before: number[] } | null>(null);

  // Restore saved settings and any in-progress board after mount (localStorage is client-only).
  useEffect(() => {
    const p = loadProgress();
    setSound(p.sound);
    setSoundEnabled(p.sound);
    if (levelId !== undefined) {
      const saved = p.boards[levelId];
      if (saved && saved.m.length === n * n && savedBoardFits(saved, puzzle)) {
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
      else p.boards[levelId] = { m: marks.join(""), t: elapsed, s: puzzleSignature(puzzle.regions, puzzle.solution) };
    });
  }, [marks, elapsed, levelId, status]);

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
    if (m === CAT || m === STRIKE) {
      setMarks(base);
      return;
    }
    const next = base.slice();
    if (puzzle.solution[Math.floor(cell / n)] === cell % n) {
      next[cell] = CAT;
      setJustFound(cell);
      setMarks(next);
      const cheers = ch?.cheers ?? ["Meow!", "Found one!", "Purr!"];
      const last = next.filter((x) => x === CAT).length === n;
      const text = last ? "That’s everyone!" : cheers[Math.floor(Math.random() * cheers.length)];
      setFx({ id: ++fxId.current, cell, kind: "find", text });
      buzz(35);
      playFind(next.filter((x) => x === CAT).length, n);
      if (last) win();
    } else {
      next[cell] = STRIKE;
      setMarks(next);
      setFx({ id: ++fxId.current, cell, kind: "miss", text: ["Hiss!", "Nope!", "Not here!"][Math.floor(Math.random() * 3)] });
      buzz([70, 50, 70]);
      playStrike();
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
    setTimeout(() => buzz([40, 60, 40, 60, 160]), 500);
    playWin();
    if (levelId !== undefined) {
      const prev = loadProgress().completed[levelId];
      recordWin(levelId, elapsed, starsFor(strikes));
      setBest({ time: prev === undefined ? elapsed : Math.min(prev, elapsed), isNew: prev === undefined || elapsed < prev });
    }
    // Let the board party play out before the popup; stars ding as they pop in.
    const earned = starsFor(strikes);
    setTimeout(() => {
      setShowOverlay(true);
      playStars(earned, 0.6, 0.3);
    }, 2000);
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

  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    setSoundEnabled(v);
    updateProgress((p) => (p.sound = v));
  };

  const showHint = () => {
    if (status !== "playing") return;
    setHint(getHint(puzzle, marks, colors));
  };

  const hintFocus = useMemo(() => new Set(hint?.focus ?? []), [hint]);
  const hintArea = useMemo(() => new Set(hint?.area ?? []), [hint]);

  return (
    <div
      onPointerUpCapture={unlockAudio}
      onKeyDownCapture={unlockAudio}
      className={`game theme-${ch ? SCENE_MODE[ch.key] : "plain"}`}
      style={ch ? { ["--accent" as string]: ch.accent, ["--frame" as string]: ch.frame } : undefined}
    >
      {ch && <ThemeScene chapter={ch.key} />}
      <header className="game-header">
        <Link href="/" className="icon-btn" aria-label="Back to levels">
          ←
        </Link>
        <div className="game-title">
          {ch && (
            <div className="game-chapter">
              <ChapterEmblem chapter={ch.key} className="game-chapter-art" />
              {ch.name}
            </div>
          )}
          <h1>{title}</h1>
          <div className="game-meta">
            <span className={`pill pill-${difficulty}`}>{difficulty}</span>
            <span>
              {n}×{n}
            </span>
            <span className="timer">⏱ {formatTime(elapsed)}</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={toggleSound}
            aria-label={sound ? "Mute sounds" : "Turn sounds on"}
            aria-pressed={!sound}
          >
            {sound ? "🔊" : "🔇"}
          </button>
          <button className="icon-btn" onClick={() => setShowHelp(true)} aria-label="How to play">
            ?
          </button>
        </div>
      </header>

      <div className="status-row">
        <div className="cats-found" aria-label={`${found} of ${n} cats found`}>
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={i < found ? "slot filled" : "slot"}>
              {i < found ? <CatIcon outfit={ch?.key} /> : <PawIcon />}
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
        {ch && <ChapterEmblem chapter={ch.key} className="frame-sticker" />}
        <Board
          size={n}
          regions={puzzle.regions}
          colors={colors}
          marks={marks}
          hintFocus={hintFocus}
          hintArea={hintArea}
          justFound={justFound}
          celebrate={status === "won"}
          disabled={status !== "playing"}
          onTap={onTap}
          onDoubleTap={onDoubleTap}
          onStrokeStart={onStrokeStart}
          onStrokePaint={onStrokePaint}
          outfit={ch?.key}
        />
        {(fx || status === "won") && (
          <div className="fx-layer" aria-hidden="true">
            {status === "won" && <Fireworks sparkles={ch?.sparkles ?? ["★", "✦", "♥"]} />}
            {fx && <FindFx
              key={fx.id}
              cell={fx.cell}
              n={n}
              kind={fx.kind}
              text={fx.text}
              sparkles={ch?.sparkles ?? ["★", "✦", "♥"]}
            />}
          </div>
        )}
      </div>

      <div className={`hint-bubble${hint ? " show" : ""} ${hint?.kind ?? ""}`} role="status" aria-live="polite">
        {hint && (
          <>
            <CatIcon className="hint-cat" outfit={ch?.key} />
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
      <p className="tip">Tap a square to mark an X. Drag across squares to mark lots at once. Double-tap to look for a cat.</p>

      {showOverlay && status === "won" && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Puzzle solved">
          <Confetti sparkles={ch?.sparkles ?? ["★", "✦", "♥"]} />
          <div className="modal modal-win">
            <div className="win-hero">
              <span className="win-glow" />
              {chapterDone && ch ? (
                <ChapterEmblem chapter={ch.key} className="modal-cat dance" />
              ) : (
                <CatIcon className="modal-cat dance" outfit={ch?.key} />
              )}
            </div>
            <WaveTitle text={chapterDone ? "Chapter complete!" : (ch?.winTitle ?? "Purr-fect!")} />
            <Stars count={starsFor(strikes)} />
            {chapterDone && ch && <p className="chapter-done">You conquered {ch.name}! 🎉</p>}
            <p>
              You found all {n} cats in{" "}
              <strong className="win-time">
                <CountUp to={elapsed} />
              </strong>
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

function buzz(pattern: number | number[]) {
  try {
    // Browsers only allow vibration after a real tap.
    if (navigator.userActivation?.hasBeenActive ?? true) navigator.vibrate?.(pattern);
  } catch {
    /* vibration not supported */
  }
}

/** The celebration when a cat is found (or the grumble on a wrong guess). */
function FindFx({
  cell,
  n,
  kind,
  text,
  sparkles,
}: {
  cell: number;
  n: number;
  kind: "find" | "miss";
  text: string;
  sparkles: string[];
}) {
  const r = Math.floor(cell / n);
  const c = cell % n;
  const pieces = kind === "find" ? 12 : 0;
  return (
    <div
      className={`fx fx-${kind}${r < 2 ? " fx-below" : ""}${c < n / 3 ? " fx-al" : c >= (2 * n) / 3 ? " fx-ar" : ""}`}
      style={{ left: `${((c + 0.5) / n) * 100}%`, top: `${((r + 0.5) / n) * 100}%` }}
    >
      {kind === "find" && <span className="fx-ring" />}
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * Math.PI * 2 + (i % 2) * 0.3;
        const dist = 46 + (i % 3) * 22;
        return (
          <span
            key={i}
            className="fx-spark"
            style={{
              ["--dx" as string]: `${Math.cos(angle) * dist}px`,
              ["--dy" as string]: `${Math.sin(angle) * dist}px`,
              animationDelay: `${(i % 4) * 30}ms`,
            }}
          >
            {sparkles[i % sparkles.length]}
          </span>
        );
      })}
      <span className="fx-bubble">{text}</span>
    </div>
  );
}

const PARTY_COLORS = ["#ff8fab", "#ffb347", "#8fd694", "#7cc6fe", "#b69cff", "#ffd23f"];

/** Fireworks of chapter sparkles bursting over the board. */
function Fireworks({ sparkles }: { sparkles: string[] }) {
  const bursts = [
    { x: 25, y: 30, delay: 0.15 },
    { x: 72, y: 22, delay: 0.45 },
    { x: 50, y: 60, delay: 0.75 },
    { x: 20, y: 75, delay: 1.05 },
    { x: 80, y: 70, delay: 1.3 },
  ];
  return (
    <>
      {bursts.map((b, bi) => (
        <div key={bi} className="fx firework" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          <span className="fx-ring" style={{ animationDelay: `${b.delay}s`, borderColor: PARTY_COLORS[bi] }} />
          {Array.from({ length: 14 }, (_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const dist = 60 + (i % 3) * 18;
            return (
              <span
                key={i}
                className="fx-spark"
                style={{
                  ["--dx" as string]: `${(Math.cos(angle) * dist).toFixed(1)}px`,
                  ["--dy" as string]: `${(Math.sin(angle) * dist).toFixed(1)}px`,
                  animationDelay: `${b.delay}s`,
                  color: PARTY_COLORS[(i + bi) % PARTY_COLORS.length],
                  fontSize: 22,
                }}
              >
                {sparkles[i % sparkles.length]}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
}

/** Title whose letters bounce in one after another. */
function WaveTitle({ text }: { text: string }) {
  return (
    <h2 className="wave-title" aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden="true" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </h2>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="stars" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < count ? "star-earned" : "star-empty"}
          style={{ animationDelay: `${0.6 + i * 0.3}s` }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/** Counts a time up from 0:00 for a bit of drama. */
function CountUp({ to }: { to: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = Math.min(1200, 300 + to * 20);
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return <>{formatTime(shown)}</>;
}

/** Party poppers from both bottom corners, plus a gentle rain of paws. */
function Confetti({ sparkles }: { sparkles: string[] }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const fromLeft = i % 2 === 0;
        const spread = ((i * 37) % 100) / 100;
        return {
          fromLeft,
          dx: (fromLeft ? 1 : -1) * (25 + spread * 55),
          peak: 45 + ((i * 53) % 40),
          delay: (i % 10) * 0.04,
          duration: 1.8 + ((i * 13) % 10) / 10,
          color: PARTY_COLORS[i % PARTY_COLORS.length],
          kind: i % 4,
          spin: ((i * 97) % 720) - 360,
        };
      }),
    [],
  );
  const rain = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: 1 + (i % 7) * 0.25,
        duration: 3 + ((i * 13) % 10) / 10,
        color: PARTY_COLORS[i % PARTY_COLORS.length],
        size: 14 + ((i * 7) % 10),
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`popper ${p.fromLeft ? "from-left" : "from-right"}`}
          style={{
            ["--dx" as string]: `${p.dx}vw`,
            ["--peak" as string]: `${p.peak}vh`,
            ["--spin" as string]: `${p.spin}deg`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            color: p.color,
          }}
        >
          {p.kind === 0 ? (
            <PawIcon />
          ) : p.kind === 1 ? (
            sparkles[i % sparkles.length]
          ) : (
            <i style={{ background: p.color }} />
          )}
        </span>
      ))}
      {rain.map((p, i) => (
        <span
          key={`r${i}`}
          className="rain"
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

/**
 * Whether a saved board belongs to this puzzle. Older saves have no fingerprint: keep
 * them only if they hold at least one cat and every cat and wrong guess still fits.
 */
function savedBoardFits(saved: { m: string; s?: string }, puzzle: Puzzle): boolean {
  if (saved.s) return saved.s === puzzleSignature(puzzle.regions, puzzle.solution);
  const n = puzzle.size;
  let cats = 0;
  for (let i = 0; i < saved.m.length; i++) {
    const isCat = puzzle.solution[Math.floor(i / n)] === i % n;
    if (saved.m[i] === String(CAT)) {
      if (!isCat) return false;
      cats++;
    }
    if (saved.m[i] === String(STRIKE) && isCat) return false;
  }
  return cats > 0;
}
