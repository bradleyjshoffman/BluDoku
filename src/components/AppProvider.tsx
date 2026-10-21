"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadProgress, updateProgress } from "@/lib/progress";
import { setMusicEnabled, setSoundEnabled, unlockAudio } from "@/lib/sound";
import { BreedContext } from "./CatIcon";
import { SettingsModal } from "./SettingsModal";

export interface Settings {
  sound: boolean;
  music: boolean;
  showTimer: boolean;
}

export interface Toast {
  id: number;
  icon: React.ReactNode;
  title: string;
  detail?: string;
}

interface AppState {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Chosen cat breed id. */
  cat: string;
  setCat: (id: string) => void;
  toast: (t: Omit<Toast, "id">) => void;
  showSettings: boolean;
  setShowSettings: (open: boolean) => void;
}

const DEFAULT_SETTINGS: Settings = { sound: true, music: true, showTimer: true };

const AppContext = createContext<AppState>({
  settings: DEFAULT_SETTINGS,
  setSetting: () => {},
  cat: "blu",
  setCat: () => {},
  toast: () => {},
  showSettings: false,
  setShowSettings: () => {},
});

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [cat, setCatState] = useState("blu");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const toastId = useRef(0);

  useEffect(() => {
    const p = loadProgress();
    setSettings({ sound: p.sound, music: p.music, showTimer: p.showTimer });
    setCatState(p.cat);
    setSoundEnabled(p.sound);
    setMusicEnabled(p.music);
  }, []);

  // Browsers only allow audio after a tap; wake it (and the music) on the first one anywhere.
  useEffect(() => {
    const wake = () => unlockAudio();
    window.addEventListener("pointerup", wake, true);
    window.addEventListener("keydown", wake, true);
    return () => {
      window.removeEventListener("pointerup", wake, true);
      window.removeEventListener("keydown", wake, true);
    };
  }, []);

  // Offline play: the service worker keeps pages and sounds available without a connection.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is a bonus; the game works without it */
    });
  }, []);

  const setSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    updateProgress((p) => {
      p[key] = value;
    });
    if (key === "sound") setSoundEnabled(value as boolean);
    if (key === "music") setMusicEnabled(value as boolean);
  }, []);

  const setCat = useCallback((id: string) => {
    setCatState(id);
    updateProgress((p) => {
      p.cat = id;
    });
  }, []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <AppContext.Provider value={{ settings, setSetting, cat, setCat, toast, showSettings, setShowSettings }}>
      <BreedContext.Provider value={cat}>
        {children}
        <SettingsModal />
      </BreedContext.Provider>
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span className="toast-icon">{t.icon}</span>
            <span>
              <strong>{t.title}</strong>
              {t.detail && <small>{t.detail}</small>}
            </span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}
