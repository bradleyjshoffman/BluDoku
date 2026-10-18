import type { ChapterKey } from "@/lib/chapters";

const COAT = "#8a97ab";
const OUTLINE = "#4f5a6b";

/** Blu, a little Russian Blue: blue-grey coat, silver sheen, green eyes. Sized by its container. */
export function CatIcon({
  className,
  sleepy = false,
  outfit,
}: {
  className?: string;
  sleepy?: boolean;
  /** Dress Blu up for a chapter. */
  outfit?: ChapterKey;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" overflow="visible">
      {outfit === "lion" && MANE}
      <g stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round">
        <path d="M15 46 L21 9 L46 28 Z" fill={COAT} />
        <path d="M85 46 L79 9 L54 28 Z" fill={COAT} />
        <ellipse cx="50" cy="58" rx="40" ry="34" fill={COAT} />
      </g>
      <path d="M23 36 L25.5 19 L37.5 29 Z" fill="#d9b3c2" />
      <path d="M77 36 L74.5 19 L62.5 29 Z" fill="#d9b3c2" />
      {/* silver sheen */}
      <ellipse cx="50" cy="38" rx="22" ry="9" fill="#b9c3d1" opacity="0.55" />
      <ellipse cx="50" cy="74" rx="17" ry="11" fill="#c3ccd8" opacity="0.6" />
      <circle cx="26" cy="68" r="6.5" fill="#ff9fb8" opacity="0.4" />
      <circle cx="74" cy="68" r="6.5" fill="#ff9fb8" opacity="0.4" />
      {sleepy ? (
        <>
          <path d="M28 55 Q36 61 44 55" stroke={OUTLINE} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M56 55 Q64 61 72 55" stroke={OUTLINE} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="36" cy="54" rx="8" ry="9" fill="#5cc96b" stroke={OUTLINE} strokeWidth="2" />
          <ellipse cx="64" cy="54" rx="8" ry="9" fill="#5cc96b" stroke={OUTLINE} strokeWidth="2" />
          <ellipse cx="36.5" cy="55" rx="3.6" ry="5.5" fill="#1f2a24" />
          <ellipse cx="64.5" cy="55" rx="3.6" ry="5.5" fill="#1f2a24" />
          <circle cx="38.6" cy="51.5" r="2" fill="#fff" />
          <circle cx="66.6" cy="51.5" r="2" fill="#fff" />
        </>
      )}
      <path d="M45.5 65 L54.5 65 L50 70 Z" fill="#5e6878" strokeLinejoin="round" stroke="#5e6878" strokeWidth="2" />
      <path
        d="M43 73 Q46.5 77 50 72 Q53.5 77 57 73"
        stroke={OUTLINE}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <g stroke="#f2f5f9" strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
        <path d="M8 62 L24 65" />
        <path d="M9 72 L24 70" />
        <path d="M92 62 L76 65" />
        <path d="M91 72 L76 70" />
      </g>
      {outfit && outfit !== "lion" && OUTFITS[outfit]}
    </svg>
  );
}

const MANE = (
  <path
    d="M50 2 L58 12 L70 6 L72 18 L86 16 L84 30 L97 34 L90 46 L99 58 L88 66 L94 80 L80 82 L78 96 L64 92 L54 100 L46 100 L36 92 L22 96 L20 82 L6 80 L12 66 L1 58 L10 46 L3 34 L16 30 L14 16 L28 18 L30 6 L42 12 Z"
    fill="#e09a3a"
    stroke="#a8661a"
    strokeWidth="3"
    strokeLinejoin="round"
  />
);

const OUTFITS: Record<Exclude<ChapterKey, "lion">, React.ReactNode> = {
  // A big pink bow.
  kitten: (
    <g transform="translate(70 26) rotate(18)" stroke="#c4577a" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M0 0 L-16 -10 L-16 10 Z" fill="#ff8fab" />
      <path d="M0 0 L16 -10 L16 10 Z" fill="#ff8fab" />
      <circle r="5" fill="#ffb3c8" />
    </g>
  ),
  // A striped knitted scarf.
  yarn: (
    <g stroke="#9c3a2e" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M20 84 Q50 100 80 84 L82 94 Q50 108 18 94 Z" fill="#f0645a" />
      <path d="M64 96 L70 116 L80 112 L74 92 Z" fill="#f0645a" />
      <g stroke="#ffe3df" strokeWidth="3">
        <path d="M34 92 L33 101" />
        <path d="M50 95 L50 104" />
        <path d="M66 92 L67 101" />
      </g>
    </g>
  ),
  // Cool sunglasses.
  sunbeam: (
    <g>
      <path d="M22 50 H78" stroke="#2a2238" strokeWidth="3" />
      <rect x="24" y="46" width="22" height="15" rx="6" fill="#2a2238" />
      <rect x="54" y="46" width="22" height="15" rx="6" fill="#2a2238" />
      <path d="M28 50 L34 50" stroke="#7cc6fe" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 50 L64 50" stroke="#7cc6fe" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  // A crown of flowers.
  catnip: (
    <g>
      <path d="M18 34 Q50 18 82 34" stroke="#2f8a5a" strokeWidth="4" fill="none" strokeLinecap="round" />
      {[
        [22, 32, "#b48bff"],
        [36, 26, "#ff9fb8"],
        [50, 24, "#ffd23f"],
        [64, 26, "#b48bff"],
        [78, 32, "#ff9fb8"],
      ].map(([x, y, c]) => (
        <g key={`${x}`}>
          <circle cx={x as number} cy={y as number} r="6" fill={c as string} stroke="#fff" strokeWidth="1.5" />
          <circle cx={x as number} cy={y as number} r="2.2" fill="#fff6c8" />
        </g>
      ))}
    </g>
  ),
  // A jaunty sailor hat.
  fishbone: (
    <g transform="rotate(-10 50 26)" stroke="#174f75" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M30 30 Q30 12 50 12 Q70 12 70 30 Z" fill="#fff" />
      <path d="M24 30 H76 Q78 38 70 38 H30 Q22 38 24 30 Z" fill="#2a8fd0" />
      <path d="M44 22 L50 18 L56 22" stroke="#2a8fd0" strokeWidth="3" fill="none" />
    </g>
  ),
  // A sleepy nightcap with a star.
  moonlit: (
    <g stroke="#231f4d" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M24 32 Q34 4 66 10 Q86 14 92 36 L82 34 Q74 20 62 24 Z" fill="#7a6cf0" />
      <path d="M22 30 Q50 18 70 26 L68 34 Q48 28 26 38 Z" fill="#fff" />
      <circle cx="92" cy="38" r="6" fill="#fff" />
      <path d="M50 14 l2 4 4.5.5-3.3 3 .9 4.4-4.1-2.3-4.1 2.3.9-4.4-3.3-3 4.5-.5z" fill="#ffe08a" stroke="none" />
    </g>
  ),
  // A puffy chef's hat.
  tuna: (
    <g stroke="#b9c3d1" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M32 30 Q20 30 22 18 Q24 6 38 10 Q42 -2 54 2 Q66 0 66 10 Q80 8 80 20 Q80 30 68 30 Z" fill="#fff" />
      <rect x="32" y="26" width="36" height="10" rx="2" fill="#fff" />
    </g>
  ),
};

export function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ellipse cx="50" cy="66" rx="22" ry="19" fill="currentColor" />
      <ellipse cx="22" cy="42" rx="9" ry="11" fill="currentColor" />
      <ellipse cx="40" cy="26" rx="9" ry="12" fill="currentColor" />
      <ellipse cx="60" cy="26" rx="9" ry="12" fill="currentColor" />
      <ellipse cx="78" cy="42" rx="9" ry="11" fill="currentColor" />
    </svg>
  );
}
