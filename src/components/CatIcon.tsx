/** A little cat face. Sized by its container. */
export function CatIcon({ className, sleepy = false }: { className?: string; sleepy?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M14 46 L20 8 L46 28 Z" fill="#4a5d94" strokeLinejoin="round" stroke="#4a5d94" strokeWidth="4" />
      <path d="M86 46 L80 8 L54 28 Z" fill="#4a5d94" strokeLinejoin="round" stroke="#4a5d94" strokeWidth="4" />
      <path d="M22 36 L25 18 L38 29 Z" fill="#ff9fb8" />
      <path d="M78 36 L75 18 L62 29 Z" fill="#ff9fb8" />
      <ellipse cx="50" cy="58" rx="40" ry="34" fill="#4a5d94" />
      <circle cx="27" cy="68" r="7" fill="#ff8fab" opacity="0.55" />
      <circle cx="73" cy="68" r="7" fill="#ff8fab" opacity="0.55" />
      {sleepy ? (
        <>
          <path d="M28 55 Q36 61 44 55" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M56 55 Q64 61 72 55" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="36" cy="54" rx="7.5" ry="8.5" fill="#fff" />
          <ellipse cx="64" cy="54" rx="7.5" ry="8.5" fill="#fff" />
          <circle cx="37" cy="55.5" r="4.5" fill="#2a2238" />
          <circle cx="65" cy="55.5" r="4.5" fill="#2a2238" />
          <circle cx="38.8" cy="53" r="1.7" fill="#fff" />
          <circle cx="66.8" cy="53" r="1.7" fill="#fff" />
        </>
      )}
      <path d="M46 65 L54 65 L50 70 Z" fill="#ff8fab" strokeLinejoin="round" stroke="#ff8fab" strokeWidth="2" />
      <path
        d="M43 73 Q46.5 77 50 72 Q53.5 77 57 73"
        stroke="#fff"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
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
