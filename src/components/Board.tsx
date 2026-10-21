"use client";

import { useRef } from "react";
import { CAT, CROSS, EMPTY, STRIKE } from "@/lib/hint";
import type { RegionColor } from "@/lib/palette";
import type { ChapterKey } from "@/lib/chapters";
import { CatIcon } from "./CatIcon";

const DOUBLE_TAP_MS = 320;

interface BoardProps {
  size: number;
  regions: number[];
  marks: number[];
  hintFocus: Set<number>;
  hintArea: Set<number>;
  justFound: number | null;
  celebrate: boolean;
  disabled: boolean;
  onTap: (cell: number) => void;
  onDoubleTap: (cell: number) => void;
  onStrokeStart: () => void;
  onStrokePaint: (cell: number, mode: "paint" | "erase") => void;
  outfit?: ChapterKey;
  /** Color of each region, indexed by region id. */
  colors: RegionColor[];
}

export function Board(props: BoardProps) {
  const { size: n, regions, marks } = props;
  const gesture = useRef<{
    start: number;
    last: number;
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
      last: cell,
      mode: marks[cell] === CROSS ? "erase" : "paint",
      dragging: false,
      visited: new Set([cell]),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell === null || cell === g.last) return;
    if (!g.dragging) {
      g.dragging = true;
      lastTap.current = null;
      props.onStrokeStart();
      props.onStrokePaint(g.start, g.mode);
    }
    // A fast swipe can jump several squares between events: mark every square on the way.
    for (const i of cellsBetween(n, g.last, cell)) {
      if (g.visited.has(i)) continue;
      g.visited.add(i);
      props.onStrokePaint(i, g.mode);
    }
    g.last = cell;
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

  // Thin grid lines between squares; the colors alone show the regions.
  const lines: string[] = [];
  for (let k = 1; k < n; k++) lines.push(`M${k} 0V${n}M0 ${k}H${n}`);

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
            aria-label={`Row ${r + 1}, column ${c + 1}, ${props.colors[regions[i]].name}${
              m === CAT ? ", cat" : m === STRIKE ? ", wrong guess" : m === CROSS ? ", crossed out" : ""
            }`}
            style={{
              background: props.colors[regions[i]].fill,
              ["--wave" as string]: `${(r + c) * 45}ms`,
            }}
          >
            {m === CAT && <CatIcon className="cat" outfit={props.outfit} />}
            {m === CAT && props.celebrate && <span className="note">{(r + c) % 2 ? "♪" : "♫"}</span>}
            {m === STRIKE && <XMark className="strike" />}
            {m === CROSS && <XMark className="cross" />}
          </div>
        );
      })}
      <svg className="grid-lines" viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={lines.join("")} className="line-thin" />
      </svg>
    </div>
  );
}

function XMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`mark ${className}`} aria-hidden="true">
      <path d="M28 28 L72 72 M72 28 L28 72" />
    </svg>
  );
}

/** Squares on the straight path from one square to another (excluding the start). */
function cellsBetween(n: number, from: number, to: number): number[] {
  const r0 = Math.floor(from / n);
  const c0 = from % n;
  const r1 = Math.floor(to / n);
  const c1 = to % n;
  const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  const out: number[] = [];
  for (let k = 1; k <= steps; k++) {
    const r = Math.round(r0 + ((r1 - r0) * k) / steps);
    const c = Math.round(c0 + ((c1 - c0) * k) / steps);
    out.push(r * n + c);
  }
  return out;
}
