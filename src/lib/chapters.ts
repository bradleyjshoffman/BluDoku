export const LEVELS_PER_CHAPTER = 25;

export type ChapterKey = "kitten" | "yarn" | "sunbeam" | "catnip" | "fishbone" | "moonlit" | "tuna" | "lion";

export interface Chapter {
  key: ChapterKey;
  name: string;
  tagline: string;
  /** Main color for tints, tabs and badges. */
  accent: string;
  /** Banner gradient. */
  banner: [string, string];
  /** Banner text color. */
  ink: string;
  /** Small repeating background motif (SVG data URI). */
  motif: string;
}

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${body}</svg>`)}`;

const motifs: Record<ChapterKey, (c: string) => string> = {
  kitten: (c) =>
    svg(
      `<g fill="${c}"><ellipse cx="20" cy="25" rx="7" ry="6"/><ellipse cx="11" cy="17" rx="3" ry="3.6"/><ellipse cx="17" cy="11.5" rx="3" ry="3.8"/><ellipse cx="23" cy="11.5" rx="3" ry="3.8"/><ellipse cx="29" cy="17" rx="3" ry="3.6"/></g>`,
    ),
  yarn: (c) =>
    svg(
      `<circle cx="18" cy="20" r="10" fill="${c}"/><g fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"><path d="M10 15q8 2 14 12"/><path d="M12 27q6-8 15-9"/></g><path d="M26 27q6 4 8 10" stroke="${c}" stroke-width="2" fill="none"/>`,
    ),
  sunbeam: (c) =>
    svg(
      `<circle cx="20" cy="20" r="6.5" fill="${c}"/><g stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M20 5v5M20 30v5M5 20h5M30 20h5M9.4 9.4l3.5 3.5M27.1 27.1l3.5 3.5M9.4 30.6l3.5-3.5M27.1 12.9l3.5-3.5"/></g>`,
    ),
  catnip: (c) =>
    svg(
      `<path d="M20 34V12" stroke="${c}" stroke-width="2" stroke-linecap="round"/><g fill="${c}"><ellipse cx="14" cy="22" rx="6" ry="3" transform="rotate(-30 14 22)"/><ellipse cx="26" cy="18" rx="6" ry="3" transform="rotate(30 26 18)"/><ellipse cx="14" cy="13" rx="5" ry="2.6" transform="rotate(-35 14 13)"/></g>`,
    ),
  fishbone: (c) =>
    svg(
      `<g stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none"><path d="M9 20h20"/><path d="M14 15v10M19 14v12M24 15v10"/><path d="M29 20l5-5v10z"/></g><circle cx="7.5" cy="20" r="3.4" fill="${c}"/>`,
    ),
  moonlit: (c) =>
    svg(
      `<path d="M20 8a10 10 0 1 0 10 14A8 8 0 1 1 20 8z" fill="${c}"/><path d="M31 9l1 2.2 2.3.3-1.7 1.6.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.7-1.6 2.3-.3z" fill="${c}"/>`,
    ),
  tuna: (c) =>
    svg(
      `<rect x="9" y="15" width="22" height="13" rx="2" fill="${c}"/><ellipse cx="20" cy="15" rx="11" ry="3.4" fill="${c}" opacity=".7"/><path d="M14 21.5q4-3.5 9 0q-5 3.5-9 0zM23 21.5l3-2.2v4.4z" fill="#fff" opacity=".8"/>`,
    ),
  lion: (c) =>
    svg(
      `<path d="M10 28l2-12 5 6 3-9 3 9 5-6 2 12z" fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/>`,
    ),
};

const base: Omit<Chapter, "motif">[] = [
  {
    key: "kitten",
    name: "Kitten Corner",
    tagline: "Where every little cat starts out.",
    accent: "#ff7fa3",
    banner: ["#ffe3ec", "#ffc9da"],
    ink: "#8a2a4a",
  },
  {
    key: "yarn",
    name: "Yarn Alley",
    tagline: "Tangled threads and tricky knots.",
    accent: "#f0645a",
    banner: ["#ffe4df", "#ffc6bd"],
    ink: "#8c2c22",
  },
  {
    key: "sunbeam",
    name: "Sunbeam Park",
    tagline: "Every cat wants the sunniest spot.",
    accent: "#f2a900",
    banner: ["#fff5c8", "#ffe08a"],
    ink: "#7a5200",
  },
  {
    key: "catnip",
    name: "Catnip Garden",
    tagline: "Things are getting a little wild.",
    accent: "#36a96f",
    banner: ["#e0f7e7", "#b9ebc9"],
    ink: "#1f5e3d",
  },
  {
    key: "fishbone",
    name: "Fishbone Bay",
    tagline: "Salty breezes, fishy business.",
    accent: "#2a8fd0",
    banner: ["#dcf1ff", "#b5defa"],
    ink: "#174f75",
  },
  {
    key: "moonlit",
    name: "Moonlit Rooftops",
    tagline: "Night prowls under the stars.",
    accent: "#7a6cf0",
    banner: ["#2f2a5e", "#4b438f"],
    ink: "#f3efff",
  },
  {
    key: "tuna",
    name: "Tuna Tower",
    tagline: "Stacked high and hard to reach.",
    accent: "#e4693f",
    banner: ["#ffe6d6", "#ffc9a8"],
    ink: "#80321a",
  },
  {
    key: "lion",
    name: "Lion’s Den",
    tagline: "Only the bravest cats make it here.",
    accent: "#c98316",
    banner: ["#fbe7bd", "#efc56f"],
    ink: "#6b4206",
  },
];

export const CHAPTERS: Chapter[] = base.map((c) => ({ ...c, motif: motifs[c.key](c.accent) }));

export function chapterIndexOf(levelId: number): number {
  return Math.min(CHAPTERS.length - 1, Math.floor((levelId - 1) / LEVELS_PER_CHAPTER));
}
