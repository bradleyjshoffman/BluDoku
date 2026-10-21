"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp, type Settings } from "./AppProvider";
import { CatIcon } from "./CatIcon";
import { HowToPlay } from "./HowToPlay";

const TOGGLES: { key: keyof Settings; label: string; detail: string }[] = [
  { key: "sound", label: "Sound effects", detail: "Chimes and cheers when you find cats" },
  { key: "music", label: "Music", detail: "A cozy background tune" },
  { key: "showTimer", label: "Show timer", detail: "Your time is still saved when it's hidden" },
];

export function SettingsModal() {
  const { settings, setSetting, showSettings, setShowSettings } = useApp();
  const [help, setHelp] = useState(false);
  if (!showSettings) return null;
  if (help) return <HowToPlay onClose={() => setHelp(false)} />;
  const close = () => setShowSettings(false);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings" onClick={close}>
      <div className="modal settings" onClick={(e) => e.stopPropagation()}>
        <CatIcon className="modal-cat" />
        <h2>Settings</h2>
        <div className="settings-list">
          {TOGGLES.map((t) => (
            <label key={t.key} className="setting">
              <span>
                <strong>{t.label}</strong>
                <small>{t.detail}</small>
              </span>
              <input
                type="checkbox"
                checked={settings[t.key]}
                onChange={(e) => setSetting(t.key, e.target.checked)}
              />
              <span className="toggle-track" aria-hidden="true" />
            </label>
          ))}
        </div>
        <div className="settings-links">
          <button className="btn" onClick={() => setHelp(true)}>
            ❓ How to play
          </button>
          <Link href="/cats/" className="btn" onClick={close}>
            🐱 Cat Café
          </Link>
          <Link href="/trophies/" className="btn" onClick={close}>
            🏆 Trophies
          </Link>
        </div>
        <p className="tip">On iPhone, the silent switch also mutes sounds and music.</p>
        <button className="btn btn-primary" onClick={close}>
          Done
        </button>
      </div>
    </div>
  );
}
