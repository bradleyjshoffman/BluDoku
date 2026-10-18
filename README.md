# BluDoku 🐱

A cute logic puzzle: find the hidden cats.

- Every **row**, **column** and **color** has exactly one cat.
- Cats never **touch**, not even diagonally.
- **Tap** a square to mark an ✕. **Double-tap** to look for a cat.
- Three wrong guesses and the cats get away.

## Features

- **200 fixed levels** (5×5 up to 11×11). In every block of five, the 1st is an easy breather and the 5th is a hard challenge.
- **Random puzzles** of any size (5×5–11×11) and difficulty, each with a shareable link.
- Every puzzle has exactly one solution and can be solved by logic alone, no guessing.
- Hints that explain the next logical step.
- Progress and best times are saved in the browser.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

The levels live in `src/data/levels.json`. To regenerate them (deterministic), run:

```bash
npm run generate-levels
```

The puzzle engine is in `src/lib/puzzle/`:

- `generator.ts` places the cats, grows the colored regions and nudges borders until the solution is unique.
- `solver.ts` is a brute-force solution counter used for the uniqueness check.
- `logic.ts` is a human-style solver used to grade difficulty and power hints.
- `levels.ts` holds the level plan: sizes and easy/medium/hard order.

## Voice clips

The cheers in `public/sounds/` are generated with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx),
an open-source (Apache 2.0) text-to-speech model that runs locally. Setup and usage are at the top of
`scripts/make-voices.py`. After recording, run `node scripts/trim-sounds.mjs` to cut the silence.

## Free hosting

`npm run build` produces a plain static site in `out/`, so it runs on any free static host.

**Cloudflare Pages** (free, unlimited bandwidth): Workers & Pages → Create → Pages → connect this GitHub repo.
Build command `npm run build`, output directory `out`.

**Vercel** (free Hobby plan): New Project → import this repo. No settings needed.

**Netlify** also works: build command `npm run build`, publish directory `out`.
