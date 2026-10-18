"use client";

import { useRef } from "react";
import { CAT, CROSS, EMPTY, STRIKE } from "@/lib/hint";
import { REGION_COLORS } from "@/lib/palette";
import { CatIcon } from "./CatIcon";

const DOUBLE_TAP_MS = 320;

interface BoardProps {
  size: number;
  regions: number[];
  marks: number[];
  /** Cells shown with a soft auto-X (ruled out by found cats). */
  autoCrossed: Set<number>;
  hintFocus: Set<number>;
  hintArea: Set<number>;
  justFound: number | null;
  celebrate: boolean;
  disabled: boolean;
  onTap: (cell: number) => void;
  onDoubleTap: (cell: number) => void;
  onStrokeStart: () => void;
  onStrokePaint: (cell: number, mode: "paint" | "erase") => void;
}

export function Board(props: BoardProps) {
  const { size: n, regions, marks } = props;
  const gesture = useRef<{
    start: number;
    mode: "paint" | "erase";
    dragging: boolean;
    visited: Set<number>;
  } | null>(null);
  const lastTap = useRef<{ cell: number; time: number } | null>(null);

  const cellAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cell]");
    return el ? Number(el.dataset.cell) : null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (props.disabled || e.button > 0) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      start: cell,
      mode: marks[cell] === CROSS ? "erase" : "paint",
      dragging: false,
      visited: new Set([cell]),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell === null || g.visited.has(cell)) return;
    if (!g.dragging) {
      g.dragging = true;
      lastTap.current = null;
      props.onStrokeStart();
      props.onStrokePaint(g.start, g.mode);
    }
    g.visited.add(cell);
    props.onStrokePaint(cell, g.mode);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.dragging) return;
    const now = e.timeStamp;
    const last = lastTap.current;
    if (last && last.cell === g.start && now - last.time < DOUBLE_TAP_MS) {
      lastTap.current = null;
      props.onDoubleTap(g.start);
    } else {
      lastTap.current = { cell: g.start, time: now };
      props.onTap(g.start);
    }
  };

  const border = (i: number, j: number | null) =>
    j === null || regions[i] !== regions[j] ? "var(--border-thick)" : "var(--border-thin)";

  return (
    <div
      className={`board${props.celebrate ? " celebrate" : ""}${props.disabled ? " disabled" : ""}`}
      style={{
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
        ["--n" as string]: n,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (gesture.current = null)}
      role="grid"
      aria-label={`${n} by ${n} BluDoku board`}
    >
      {marks.map((m, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const right = c < n - 1 ? i + 1 : null;
        const below = r < n - 1 ? i + n : null;
        const classes = ["cell"];
        if (props.hintFocus.has(i)) classes.push("hint-focus");
        if (props.hintArea.size && !props.hintArea.has(i)) classes.push("hint-dim");
        if (props.justFound === i) classes.push("just-found");
        return (
          <div
            key={i}
            data-cell={i}
            className={classes.join(" ")}
            role="gridcell"
            aria-label={`Row ${r + 1}, column ${c + 1}, ${REGION_COLORS[regions[i]].name}${
              m === CAT ? ", cat" : m === STRIKE ? ", wrong guess" : m === CROSS ? ", crossed out" : ""
            }`}
            style={{
              background: REGION_COLORS[regions[i]].fill,
              borderRight: right === null ? "none" : `${border(i, right)}`,
              borderBottom: below === null ? "none" : `${border(i, below)}`,
              ["--wave" as string]: `${(r + c) * 45}ms`,
            }}
          >
            {m === CAT && <CatIcon className="cat" />}
            {m === STRIKE && <span className="mark strike">✕</span>}
            {m === CROSS && <span className="mark cross">✕</span>}
            {m === EMPTY && props.autoCrossed.has(i) && <span className="mark auto">✕</span>}
          </div>
        );
      })}
    </div>
  );
}
