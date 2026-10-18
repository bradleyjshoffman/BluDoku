const COAT = "#8a97ab";
const OUTLINE = "#4f5a6b";

/** Blu, a little Russian Blue: blue-grey coat, silver sheen, green eyes. Sized by its container. */
export function CatIcon({ className, sleepy = false }: { className?: string; sleepy?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
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
    </svg>
  );
}

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
