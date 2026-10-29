import { useEffect, useSyncExternalStore } from "react";
import { initialLearning, parseLearning, type LearningState } from "@/lib/learning";

const key = "rewardwise-learning";
const initial = initialLearning();
let state: LearningState = initial;
let restored = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function setLearning(next: LearningState) {
  state = next;
  try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* in-memory only */ }
  emit();
}
export const getLearning = () => state;
export const resetLearning = () => { state = initialLearning(); try { localStorage.removeItem(key); } catch { /* ignore */ } emit(); };

export function useLearning() {
  const value = useSyncExternalStore(subscribe, () => state, () => initial);
  useEffect(() => {
    if (restored) return;
    restored = true;
    try { const saved = parseLearning(JSON.parse(localStorage.getItem(key) ?? "null")); if (saved) { state = saved; emit(); } } catch { /* defaults */ }
  }, []);
  return value;
}
