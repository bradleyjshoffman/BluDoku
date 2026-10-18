"use client";

import { CatIcon } from "./CatIcon";

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="How to play" onClick={onClose}>
      <div className="modal how" onClick={(e) => e.stopPropagation()}>
        <CatIcon className="modal-cat" />
        <h2>How to play</h2>
        <p>Some cats are hiding on the board. Find every one of them!</p>
        <ul>
          <li>
            Every <b>row</b> has exactly one cat.
          </li>
          <li>
            Every <b>column</b> has exactly one cat.
          </li>
          <li>
            Every <b>color</b> has exactly one cat.
          </li>
          <li>
            Cats are a little shy: two cats never <b>touch</b>, not even corner to corner.
          </li>
        </ul>
        <div className="how-controls">
          <div>
            <span className="how-key">Tap</span> mark an ✕ where a cat can’t be
          </div>
          <div>
            <span className="how-key">Double-tap</span> look for a cat
          </div>
          <div>
            <span className="how-key">Drag</span> mark lots of ✕’s at once
          </div>
        </div>
        <p>
          Wrong guesses cost a <span className="heart-inline">♥</span>. Three wrong guesses and the cats get away.
          Every puzzle can be solved by logic, so no guessing needed!
        </p>
        <button className="btn btn-primary" onClick={onClose}>
          Let’s go!
        </button>
      </div>
    </div>
  );
}
