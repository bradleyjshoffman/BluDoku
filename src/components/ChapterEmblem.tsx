import type { ChapterKey } from "@/lib/chapters";

const COAT = "#8a97ab";
const OUTLINE = "#4f5a6b";

/** A small illustration for each chapter. Sized by its container. */
export function ChapterEmblem({ chapter, className }: { chapter: ChapterKey; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {ART[chapter]}
    </svg>
  );
}

const ART: Record<ChapterKey, React.ReactNode> = {
  // A kitten curled up asleep in a basket.
  kitten: (
    <>
      <path d="M6 34 Q32 66 58 34 Z" fill="#e7a56b" stroke="#b9743c" strokeWidth="2.5" strokeLinejoin="round" />
      <g stroke="#b9743c" strokeWidth="1.6" opacity="0.7">
        <path d="M14 42 L20 50" />
        <path d="M24 46 L28 53" />
        <path d="M36 53 L40 46" />
        <path d="M44 50 L50 42" />
      </g>
      <ellipse cx="32" cy="34" rx="24" ry="5" fill="#ff9fb8" />
      <path d="M19 32 Q20 18 32 18 Q44 18 45 32 Z" fill={COAT} stroke={OUTLINE} strokeWidth="2" />
      <path d="M22 23 L22 13 L29 19 Z" fill={COAT} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M42 23 L42 13 L35 19 Z" fill={COAT} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M25 26 Q27.5 28.5 30 26 M34 26 Q36.5 28.5 39 26" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <text x="47" y="16" fontSize="9" fontWeight="700" fill="#8a2a4a">z</text>
      <text x="52" y="10" fontSize="7" fontWeight="700" fill="#8a2a4a">z</text>
    </>
  ),
  // A ball of yarn with a loose strand.
  yarn: (
    <>
      <path d="M44 46 Q54 50 52 58 Q50 62 58 62" stroke="#f0645a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="30" r="20" fill="#f0645a" stroke="#b8392f" strokeWidth="2.5" />
      <g stroke="#ffd2cc" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d="M14 22 Q30 26 40 46" />
        <path d="M18 16 Q34 22 46 38" />
        <path d="M12 34 Q24 22 46 22" />
        <path d="M16 42 Q28 30 48 30" />
      </g>
      <path d="M50 8 L42 26" stroke="#c9a46a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="8" r="3" fill="#c9a46a" />
    </>
  ),
  // The sun peeking over a fluffy cloud.
  sunbeam: (
    <>
      <g stroke="#f2a900" strokeWidth="3.2" strokeLinecap="round">
        <path d="M30 4 V11 M30 45 V52 M6 28 H13 M47 28 H54 M13 11 L18 16 M42 40 L47 45 M13 45 L18 40 M42 16 L47 11" />
      </g>
      <circle cx="30" cy="28" r="13" fill="#ffd23f" stroke="#e09a00" strokeWidth="2.5" />
      <path d="M25 27 Q27 29 29 27 M31 27 Q33 29 35 27" stroke="#a86b00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M27 33 Q30 35.5 33 33" stroke="#a86b00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path
        d="M30 58 Q24 58 24 52 Q24 46 31 46 Q33 39 41 40 Q48 40 50 46 Q58 46 58 52 Q58 58 52 58 Z"
        fill="#fff"
        stroke="#e2c47a"
        strokeWidth="2"
      />
    </>
  ),
  // A sprig of catnip in bloom.
  catnip: (
    <>
      <path d="M32 60 V14" stroke="#2f8a5a" strokeWidth="3" strokeLinecap="round" />
      <g fill="#4cc38a" stroke="#2f8a5a" strokeWidth="2">
        <path d="M32 50 Q18 50 12 40 Q24 38 32 46 Z" />
        <path d="M32 46 Q46 46 52 36 Q40 34 32 42 Z" />
        <path d="M32 34 Q20 34 16 25 Q26 23 32 30 Z" />
        <path d="M32 30 Q44 30 48 21 Q38 19 32 26 Z" />
      </g>
      <g fill="#b48bff" stroke="#8a62d8" strokeWidth="1.2">
        <circle cx="32" cy="10" r="4" />
        <circle cx="26" cy="15" r="3.4" />
        <circle cx="38" cy="15" r="3.4" />
        <circle cx="32" cy="18" r="3" />
      </g>
    </>
  ),
  // A fish skeleton over little waves.
  fishbone: (
    <>
      <g stroke="#1f6fa6" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M18 28 H46" />
        <path d="M25 19 V37 M32 17 V39 M39 19 V37" />
        <path d="M46 28 L56 19 V37 Z" strokeLinejoin="round" fill="#9fd3f5" />
      </g>
      <path d="M6 28 Q8 18 18 18 V38 Q8 38 6 28 Z" fill="#9fd3f5" stroke="#1f6fa6" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="12" cy="25" r="2.2" fill="#1f6fa6" />
      <path
        d="M4 52 Q10 46 16 52 T28 52 T40 52 T52 52 T64 52"
        stroke="#2a8fd0"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  // A crescent moon and stars over a rooftop with a chimney.
  moonlit: (
    <>
      <path d="M34 6 A16 16 0 1 0 52 28 A12 12 0 1 1 34 6 Z" fill="#ffe08a" stroke="#e8b84a" strokeWidth="2" />
      <g fill="#fff3b0">
        <path d="M12 8 l1.5 3.2 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z" />
        <circle cx="54" cy="8" r="1.8" />
        <circle cx="8" cy="28" r="1.5" />
      </g>
      <path d="M2 64 V50 L22 38 L42 50 V64 Z" fill="#2b2850" stroke="#5b54a8" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 64 V54 L52 46 L64 54 V64 Z" fill="#3a3570" stroke="#5b54a8" strokeWidth="2" strokeLinejoin="round" />
      <rect x="30" y="38" width="6" height="10" fill="#3a3570" stroke="#5b54a8" strokeWidth="2" />
      <rect x="16" y="52" width="7" height="7" rx="1" fill="#ffd36b" />
    </>
  ),
  // A wobbly stack of tuna cans.
  tuna: (
    <>
      {[
        { x: 8, y: 44 },
        { x: 30, y: 44 },
        { x: 19, y: 26 },
        { x: 19, y: 8 },
      ].map(({ x, y }, i) => (
        <g key={i} transform={`rotate(${[-2, 2, -3, 4][i]} ${x + 13} ${y + 8})`}>
          <rect x={x} y={y + 3} width="26" height="14" rx="2" fill="#e4693f" stroke="#a8401f" strokeWidth="2" />
          <rect x={x} y={y + 7} width="26" height="6" fill="#fff1e3" />
          <path d={`M${x + 7} ${y + 10} q4 -3 9 0 q-5 3 -9 0z M${x + 16} ${y + 10} l3 -2 v4z`} fill="#2a8fd0" />
          <ellipse cx={x + 13} cy={y + 3} rx="13" ry="3.2" fill="#d6dde6" stroke="#8d99a8" strokeWidth="1.6" />
        </g>
      ))}
    </>
  ),
  // Blu wearing a lion's mane.
  lion: (
    <>
      <path
        d="M32 2 L38 10 L47 6 L48 16 L58 16 L54 25 L62 31 L54 37 L58 46 L48 46 L47 56 L38 52 L32 60 L26 52 L17 56 L16 46 L6 46 L10 37 L2 31 L10 25 L6 16 L16 16 L17 6 L26 10 Z"
        fill="#e09a3a"
        stroke="#a8661a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M19 26 L20 14 L28 20 Z" fill={COAT} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M45 26 L44 14 L36 20 Z" fill={COAT} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="32" cy="34" rx="15" ry="13" fill={COAT} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="26.5" cy="32" rx="3" ry="3.5" fill="#5cc96b" />
      <ellipse cx="37.5" cy="32" rx="3" ry="3.5" fill="#5cc96b" />
      <ellipse cx="26.7" cy="32.5" rx="1.4" ry="2.3" fill="#1f2a24" />
      <ellipse cx="37.7" cy="32.5" rx="1.4" ry="2.3" fill="#1f2a24" />
      <path d="M30 38 H34 L32 40.5 Z" fill="#5e6878" />
      <path d="M29 42 Q30.5 43.5 32 41.5 Q33.5 43.5 35 42" stroke={OUTLINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
};
