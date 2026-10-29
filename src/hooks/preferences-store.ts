import { useEffect, useSyncExternalStore } from "react";
import { defaultPreferences, interestChips, type Preferences } from "@/lib/preferences";

const storageKey = "rewardwise-preferences";
let prefs: Preferences = defaultPreferences;
let restored = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function setPreferences(update: Partial<Preferences>) {
  prefs = { ...prefs, ...update };
  try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch { /* in-memory only */ }
  emit();
}

export function usePreferences(): Preferences {
  const value = useSyncExternalStore(subscribe, () => prefs, () => defaultPreferences);
  useEffect(() => {
    if (restored) return;
    restored = true;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Partial<Preferences> | null;
      if (saved && typeof saved === "object") {
        const interests = Array.isArray(saved.interests) ? saved.interests.filter(i => (interestChips as readonly string[]).includes(i)) : [];
        prefs = { ...defaultPreferences, ...saved, interests: interests.length ? interests : defaultPreferences.interests, limit: [1, 3, 5].includes(Number(saved.limit)) ? saved.limit! : 3 };
      }
    } catch { /* keep defaults */ }
    emit();
  }, []);
  return value;
}
