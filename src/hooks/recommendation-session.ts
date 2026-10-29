import { useEffect, useSyncExternalStore } from "react";
import type { RewardCategory } from "@/lib/model";

const storageKey = "rewardwise-skipped-categories";
const empty: readonly RewardCategory[] = [];
let skipped: readonly RewardCategory[] = empty;
let restored = false;
const listeners = new Set<() => void>();
const categories: readonly RewardCategory[] = ["coffee", "food", "grocery", "online", "ride", "shopping", "travel", "fun"];
const emit = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function useRecommendationSession() {
  const skippedCategories = useSyncExternalStore(subscribe, () => skipped, () => empty);
  useEffect(() => {
    if (restored) return;
    restored = true;
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) skipped = saved.filter((value): value is RewardCategory => categories.includes(value));
    } catch { /* In-memory feedback still works when storage is unavailable. */ }
    emit();
  }, []);
  return { skippedCategories, resetSkipped: () => {
    skipped = empty;
    try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
    emit();
  }, skipCategory: (category: RewardCategory) => {
    skipped = [...skipped.filter(value => value !== category), category];
    try { sessionStorage.setItem(storageKey, JSON.stringify(skipped)); } catch { /* Keep feedback for this page session. */ }
    emit();
  } };
}