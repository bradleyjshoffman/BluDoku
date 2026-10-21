import { LEVELS_PER_CHAPTER } from "./chapters";
import type { Progress } from "./progress";
import { bestStreak } from "./daily";

export type Pattern = "none" | "stripes" | "tuxedo" | "calico" | "points" | "wrinkles" | "stars";

export interface Breed {
  id: string;
  name: string;
  blurb: string;
  coat: string;
  outline: string;
  /** Inner ear color. */
  ear: string;
  eye: string;
  nose: string;
  pattern: Pattern;
  /** Main pattern color (stripes, points, mask, patches). */
  patternColor?: string;
  /** Second patch color (calico). */
  patternColor2?: string;
  unlock: Unlock;
}

export type Unlock =
  | { kind: "start" }
  | { kind: "chapter"; chapter: number }
  | { kind: "streak"; days: number }
  | { kind: "achievements"; count: number };

export const BREEDS: Breed[] = [
  {
    id: "blu",
    name: "Blu",
    blurb: "A Russian Blue with a silver sheen. The original.",
    coat: "#8a97ab",
    outline: "#4f5a6b",
    ear: "#d9b3c2",
    eye: "#5cc96b",
    nose: "#5e6878",
    pattern: "none",
    unlock: { kind: "start" },
  },
  {
    id: "ginger",
    name: "Ginger",
    blurb: "An orange tabby who naps in every sunbeam.",
    coat: "#f2a65a",
    outline: "#a85f22",
    ear: "#ffc7b8",
    eye: "#7cc96b",
    nose: "#e07a7a",
    pattern: "stripes",
    patternColor: "#d07a2c",
    unlock: { kind: "chapter", chapter: 0 },
  },
  {
    id: "tux",
    name: "Tux",
    blurb: "Always dressed for a fancy dinner.",
    coat: "#3a3442",
    outline: "#1b1820",
    ear: "#e8a5b8",
    eye: "#f2c94c",
    nose: "#f0a0b4",
    pattern: "tuxedo",
    patternColor: "#ffffff",
    unlock: { kind: "chapter", chapter: 1 },
  },
  {
    id: "calico",
    name: "Patches",
    blurb: "A calico made of three cats' worth of colors.",
    coat: "#fbf6ee",
    outline: "#8c7a66",
    ear: "#ffc2cf",
    eye: "#5cbf8a",
    nose: "#f09aac",
    pattern: "calico",
    patternColor: "#e8964a",
    patternColor2: "#3d3640",
    unlock: { kind: "chapter", chapter: 2 },
  },
  {
    id: "siamese",
    name: "Miso",
    blurb: "A chatty Siamese with ocean-blue eyes.",
    coat: "#f3e6d0",
    outline: "#8a7358",
    ear: "#6b5442",
    eye: "#5aa9f2",
    nose: "#5a463a",
    pattern: "points",
    patternColor: "#6b5442",
    unlock: { kind: "chapter", chapter: 3 },
  },
  {
    id: "snow",
    name: "Snowball",
    blurb: "Fluffy, white and suspiciously clean.",
    coat: "#fbfbff",
    outline: "#9aa3b5",
    ear: "#ffc9d6",
    eye: "#7fb8ff",
    nose: "#f5a3b5",
    pattern: "none",
    unlock: { kind: "chapter", chapter: 4 },
  },
  {
    id: "midnight",
    name: "Midnight",
    blurb: "You'll only ever see the eyes.",
    coat: "#2e2a38",
    outline: "#15121c",
    ear: "#5e4b6b",
    eye: "#ffd23f",
    nose: "#6b5a78",
    pattern: "none",
    unlock: { kind: "chapter", chapter: 5 },
  },
  {
    id: "tabby",
    name: "Biscuit",
    blurb: "A classic brown tabby, crunchy on the outside.",
    coat: "#b89a7a",
    outline: "#5e4632",
    ear: "#f0bfb0",
    eye: "#9ccc5a",
    nose: "#c47a6e",
    pattern: "stripes",
    patternColor: "#6e5440",
    unlock: { kind: "chapter", chapter: 6 },
  },
  {
    id: "leo",
    name: "Leo",
    blurb: "A golden Maine Coon who thinks he's a lion.",
    coat: "#e6ac58",
    outline: "#8f5b18",
    ear: "#ffd3a3",
    eye: "#4fb36a",
    nose: "#b9714a",
    pattern: "stripes",
    patternColor: "#c98a33",
    unlock: { kind: "chapter", chapter: 7 },
  },
  {
    id: "mochi",
    name: "Mochi",
    blurb: "Soft, squishy and cream-colored.",
    coat: "#fff3dc",
    outline: "#b3946a",
    ear: "#f2c1a6",
    eye: "#6fa8e8",
    nose: "#e7a28f",
    pattern: "points",
    patternColor: "#d9b48a",
    unlock: { kind: "streak", days: 3 },
  },
  {
    id: "sphynx",
    name: "Pinky",
    blurb: "A wrinkly sphynx who loves a warm lap.",
    coat: "#f6c7c3",
    outline: "#b0716c",
    ear: "#ee9f9f",
    eye: "#8fd06b",
    nose: "#d9857f",
    pattern: "wrinkles",
    patternColor: "#d99b96",
    unlock: { kind: "streak", days: 7 },
  },
  {
    id: "stardust",
    name: "Stardust",
    blurb: "Fell from the night sky. Sparkles slightly.",
    coat: "#b8a6ec",
    outline: "#5e4ba8",
    ear: "#f5c6ec",
    eye: "#ff9fd4",
    nose: "#8a6fd0",
    pattern: "stars",
    patternColor: "#ffffff",
    unlock: { kind: "achievements", count: 10 },
  },
];

export const DEFAULT_BREED = BREEDS[0];

export function breedById(id: string | undefined): Breed {
  return BREEDS.find((b) => b.id === id) ?? DEFAULT_BREED;
}

export function chapterComplete(p: Progress, chapter: number): boolean {
  for (let id = chapter * LEVELS_PER_CHAPTER + 1; id <= (chapter + 1) * LEVELS_PER_CHAPTER; id++) {
    if (p.completed[id] === undefined) return false;
  }
  return true;
}

export function isUnlocked(b: Breed, p: Progress): boolean {
  switch (b.unlock.kind) {
    case "start":
      return true;
    case "chapter":
      return chapterComplete(p, b.unlock.chapter);
    case "streak":
      return bestStreak(p) >= b.unlock.days;
    case "achievements":
      return Object.keys(p.achievements).length >= b.unlock.count;
  }
}

export function unlockedBreeds(p: Progress): Breed[] {
  return BREEDS.filter((b) => isUnlocked(b, p));
}

export function unlockText(b: Breed, chapterNames: string[]): string {
  switch (b.unlock.kind) {
    case "start":
      return "Here from the start";
    case "chapter":
      return `Finish ${chapterNames[b.unlock.chapter]}`;
    case "streak":
      return `Reach a ${b.unlock.days}-day daily streak`;
    case "achievements":
      return `Earn ${b.unlock.count} trophies`;
  }
}

/** Stars earned in a chapter (out of 3 per level). */
export function chapterStars(p: Progress, chapter: number): number {
  let total = 0;
  for (let id = chapter * LEVELS_PER_CHAPTER + 1; id <= (chapter + 1) * LEVELS_PER_CHAPTER; id++) total += p.stars[id] ?? 0;
  return total;
}

/** Every level in the chapter has 3 stars. */
export function chapterPerfect(p: Progress, chapter: number): boolean {
  return chapterStars(p, chapter) === LEVELS_PER_CHAPTER * 3;
}
