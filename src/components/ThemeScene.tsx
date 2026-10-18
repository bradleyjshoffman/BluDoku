import type { ChapterKey } from "@/lib/chapters";
import { CHAPTERS } from "@/lib/chapters";
import { ChapterEmblem } from "./ChapterEmblem";

/** Light or dark text/buttons for each scene. */
export const SCENE_MODE: Record<ChapterKey, "light" | "dark"> = {
  kitten: "light",
  yarn: "light",
  sunbeam: "light",
  catnip: "light",
  fishbone: "dark",
  moonlit: "dark",
  tuna: "light",
  lion: "light",
};

/** Stable pseudo-random numbers so server and client render the same scene. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Round style numbers so server and client strings match exactly. */
const r2 = (v: number) => v.toFixed(2);

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 50" className={className} style={style} aria-hidden="true">
      <path d="M20 46 Q4 46 6 34 Q8 24 22 26 Q24 10 42 10 Q56 10 60 22 Q66 12 80 14 Q96 16 96 30 Q114 28 114 40 Q114 46 104 46 Z" fill="#fff" />
    </svg>
  );
}

function Hills({ back, front }: { back: string; front: string }) {
  return (
    <svg className="scene-hills" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 50 Q60 10 130 40 T260 34 T400 44 V100 H0 Z" fill={back} />
      <path d="M0 74 Q90 40 190 66 T400 60 V100 H0 Z" fill={front} />
    </svg>
  );
}

/** A full-screen themed background for a chapter. */
export function ThemeScene({ chapter }: { chapter: ChapterKey }) {
  const ch = CHAPTERS.find((c) => c.key === chapter)!;
  return (
    <div className={`scene scene-${chapter}`} aria-hidden="true">
      {SCENES[chapter](ch.motif)}
    </div>
  );
}

const SCENES: Record<ChapterKey, (motif: string) => React.ReactNode> = {
  kitten: (motif) => (
    <>
      <div className="scene-wallpaper" style={{ backgroundImage: `url("${motif}")` }} />
      {range(14).map((i) => (
        <span
          key={i}
          className="floaty"
          style={{
            left: `${r2(rand(i, 1) * 100)}%`,
            fontSize: `${r2(16 + rand(i, 2) * 22)}px`,
            animationDuration: `${r2(14 + rand(i, 3) * 14)}s`,
            animationDelay: `${r2(-rand(i, 4) * 28)}s`,
          }}
        >
          {i % 3 === 0 ? "🐾" : "♥"}
        </span>
      ))}
      <div className="scene-rug" />
    </>
  ),

  yarn: () => (
    <>
      <div className="scene-bricks" />
      <svg className="scene-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M-5 18 Q30 34 55 20 T105 30" stroke="#f0645a" strokeWidth="0.9" fill="none" />
        <path d="M-5 62 Q25 48 50 66 T105 56" stroke="#2fb5a5" strokeWidth="0.9" fill="none" />
        <path d="M-5 84 Q40 74 70 90 T105 80" stroke="#f2b134" strokeWidth="0.9" fill="none" />
        <path d="M20 -5 Q34 40 18 105" stroke="#b48bff" strokeWidth="0.7" fill="none" />
      </svg>
      <ChapterEmblem chapter="yarn" className="scene-prop prop-bl" />
      <ChapterEmblem chapter="yarn" className="scene-prop prop-tr" />
    </>
  ),

  sunbeam: () => (
    <>
      <div className="scene-beams" />
      <div className="scene-sun">
        <svg viewBox="0 0 100 100" className="sun-rays">
          {range(12).map((i) => (
            <path key={i} d="M50 2 L54 20 L46 20 Z" fill="#ffd23f" transform={`rotate(${i * 30} 50 50)`} />
          ))}
        </svg>
        <svg viewBox="0 0 100 100" className="sun-face">
          <circle cx="50" cy="50" r="46" fill="#ffd23f" stroke="#f2a900" strokeWidth="4" />
          <path d="M33 46 Q38 52 43 46 M57 46 Q62 52 67 46" stroke="#a86b00" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M40 62 Q50 72 60 62" stroke="#a86b00" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="60" r="6" fill="#ff9f6b" opacity="0.5" />
          <circle cx="70" cy="60" r="6" fill="#ff9f6b" opacity="0.5" />
        </svg>
      </div>
      <Cloud className="cloud" style={{ top: "14%", animationDuration: "70s", animationDelay: "-10s", width: 150 }} />
      <Cloud className="cloud" style={{ top: "34%", animationDuration: "95s", animationDelay: "-50s", width: 110 }} />
      <Cloud className="cloud" style={{ top: "6%", animationDuration: "120s", animationDelay: "-80s", width: 90 }} />
      <Hills back="#a6dc8c" front="#7cc46a" />
    </>
  ),

  catnip: () => (
    <>
      <Cloud className="cloud" style={{ top: "10%", animationDuration: "110s", animationDelay: "-30s", width: 120, opacity: 0.8 }} />
      <Hills back="#8fd59a" front="#5fbf75" />
      <div className="scene-flowers">
        {range(16).map((i) => (
          <span
            key={i}
            style={{
              left: `${r2(rand(i, 5) * 100)}%`,
              bottom: `${r2(2 + rand(i, 6) * 12)}%`,
              background: ["#b48bff", "#ff9fb8", "#fff", "#ffd23f"][i % 4],
            }}
          />
        ))}
      </div>
      {range(10).map((i) => (
        <span
          key={i}
          className="leaf"
          style={{
            left: `${r2(rand(i, 7) * 100)}%`,
            animationDuration: `${r2(16 + rand(i, 8) * 12)}s`,
            animationDelay: `${r2(-rand(i, 9) * 28)}s`,
          }}
        />
      ))}
    </>
  ),

  fishbone: () => (
    <>
      <div className="scene-beams scene-beams-water" />
      <svg className="scene-waves" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V0 H0 Z" fill="#bfe9ff" opacity="0.7" />
      </svg>
      {range(18).map((i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${r2(rand(i, 10) * 100)}%`,
            width: `${r2(6 + rand(i, 11) * 14)}px`,
            height: `${r2(6 + rand(i, 11) * 14)}px`,
            animationDuration: `${r2(8 + rand(i, 12) * 10)}s`,
            animationDelay: `${r2(-rand(i, 13) * 18)}s`,
          }}
        />
      ))}
      {range(4).map((i) => (
        <svg
          key={i}
          viewBox="0 0 40 20"
          className="fish"
          style={{
            top: `${r2(20 + i * 18)}%`,
            animationDuration: `${r2(30 + i * 9)}s`,
            animationDelay: `${r2(-i * 11)}s`,
            animationDirection: i % 2 ? "reverse" : "normal",
          }}
        >
          {/* Fish face left; flip the ones swimming to the right. */}
          <g transform={i % 2 ? undefined : "translate(40 0) scale(-1 1)"}>
            <path d="M4 10 Q16 0 28 10 Q16 20 4 10 Z M28 10 L38 3 V17 Z" fill={["#ffb347", "#ff8fab", "#ffe08a", "#9fe7c9"][i]} />
            <circle cx="10" cy="9" r="1.5" fill="#174f75" />
          </g>
        </svg>
      ))}
      <svg className="scene-seaweed" viewBox="0 0 400 80" preserveAspectRatio="none">
        <path d="M0 80 V60 Q100 50 200 62 T400 58 V80 Z" fill="#e9d29a" />
        <g stroke="#2fa36b" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M30 62 Q20 40 32 26 Q42 12 30 0" />
          <path d="M50 64 Q60 44 48 30" />
          <path d="M340 60 Q330 40 344 24 Q352 12 344 2" />
          <path d="M366 60 Q376 44 366 30" />
        </g>
      </svg>
    </>
  ),

  moonlit: () => (
    <>
      {range(46).map((i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${r2(rand(i, 14) * 100)}%`,
            top: `${r2(rand(i, 15) * 70)}%`,
            width: `${r2(1.5 + rand(i, 16) * 2.5)}px`,
            height: `${r2(1.5 + rand(i, 16) * 2.5)}px`,
            animationDelay: `${r2(-rand(i, 17) * 4)}s`,
            animationDuration: `${r2(2.5 + rand(i, 18) * 3)}s`,
          }}
        />
      ))}
      <div className="scene-moon" />
      <svg className="scene-roofs" viewBox="0 0 400 90" preserveAspectRatio="none">
        <path
          d="M0 90 V50 L30 30 L60 50 V40 H70 V28 H78 V44 L110 22 L150 48 V90 Z M140 90 V56 L190 34 L240 56 V90 Z M230 90 V46 L270 26 L300 40 V30 H308 V44 L330 52 L360 32 L400 54 V90 Z"
          fill="#1a1736"
        />
        <g fill="#ffd36b">
          <rect x="22" y="58" width="9" height="9" rx="1" />
          <rect x="100" y="56" width="9" height="9" rx="1" />
          <rect x="182" y="62" width="9" height="9" rx="1" />
          <rect x="262" y="52" width="9" height="9" rx="1" />
          <rect x="352" y="62" width="9" height="9" rx="1" />
        </g>
      </svg>
    </>
  ),

  tuna: (motif) => (
    <>
      <div className="scene-wallpaper" style={{ backgroundImage: `url("${motif}")`, opacity: 0.1 }} />
      <div className="scene-floor" />
      <ChapterEmblem chapter="tuna" className="scene-prop prop-bl prop-big" />
      <ChapterEmblem chapter="tuna" className="scene-prop prop-br prop-big" />
    </>
  ),

  lion: () => (
    <>
      <div className="scene-sunset-sun" />
      <svg className="scene-savanna" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0 120 V84 Q100 72 200 82 T400 78 V120 Z" fill="#8a4a1c" />
        <path d="M300 82 V50" stroke="#5a2e0e" strokeWidth="5" />
        <path d="M300 60 L284 46 M300 56 L318 44" stroke="#5a2e0e" strokeWidth="3" />
        <ellipse cx="300" cy="44" rx="44" ry="9" fill="#5a2e0e" />
        <ellipse cx="292" cy="38" rx="26" ry="6" fill="#5a2e0e" />
        <g stroke="#5a2e0e" strokeWidth="2" strokeLinecap="round">
          {range(30).map((i) => {
            const x = i * 13 + 4;
            return <path key={i} d={`M${x} 90 L${x - 3} ${r2(78 - rand(i, 19) * 10)} M${x + 3} 90 L${x + 6} ${r2(80 - rand(i, 20) * 10)}`} />;
          })}
        </g>
      </svg>
    </>
  ),
};
