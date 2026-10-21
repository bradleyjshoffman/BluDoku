# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) 5, running in Node.

```bash
npm test
```

GitHub runs the same command on every push (`.github/workflows/test.yml`).

## Layers

- **Unit tests** (`tests/*.test.ts`): plain logic with no browser. Daily dates and streaks, trophy and cat-unlock rules, chapter stars, color assignment. Write one whenever you add or change a rule.
- **Data checks** (`tests/puzzles.test.ts`): every fixed level and pre-built daily puzzle has exactly one valid solution, follows its size/difficulty plan, and rations one-square colors. Re-run after `npm run generate-levels` or `npm run generate-daily`.
- **Browser checks**: done by hand or with gstack `/qa` against `npm run dev` (gameplay, animations, sound, offline).

## Conventions

- Files: `tests/<area>.test.ts`, using `describe`/`it` and `expect`.
- Import app code through the `@/` alias (same as the app).
- Build player progress with `makeProgress()` / `solveLevels()` from `tests/helpers.ts` instead of touching localStorage.
- Test what the code decides (exact streak counts, exact trophy ids), not just that it runs.
