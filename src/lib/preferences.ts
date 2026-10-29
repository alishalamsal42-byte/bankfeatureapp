/** Pure preference rules: interest ordering, history-off sorting, and notification gating. */
export const interestChips = ["Coffee", "Food", "Groceries", "Shopping", "Travel", "Fun"] as const;
export type Interest = (typeof interestChips)[number];
export type DailyLimit = 1 | 3 | 5;
export type Preferences = {
  interests: Interest[];
  location: boolean;
  history: boolean;
  notify: boolean;
  limit: DailyLimit;
  quiet: boolean;
  expiry: boolean;
  historyDeleted: boolean;
  bankAuto: boolean;
};
export const defaultPreferences: Preferences = {
  interests: ["Coffee", "Food", "Groceries", "Shopping", "Travel", "Fun"],
  location: true, history: true, notify: true, limit: 3, quiet: false, expiry: true, historyDeleted: false, bankAuto: true,
};

/** Maps an offer category to its interest chip (online rewards count as Shopping). */
export function interestOf(category: string): Interest {
  if (category === "Grocery") return "Groceries";
  if (category === "Online") return "Shopping";
  return (interestChips as readonly string[]).includes(category) ? (category as Interest) : "Shopping";
}
export const isInterested = (category: string, interests: readonly Interest[]) => interests.includes(interestOf(category));

/** At least one interest must stay selected. */
export function toggleInterest(interests: readonly Interest[], chip: Interest): Interest[] {
  if (interests.includes(chip)) return interests.length > 1 ? interests.filter(i => i !== chip) : [...interests];
  return [...interests, chip];
}

/** Stable: selected interests first, unselected lower. */
export function interestsFirst<T extends { category: string }>(list: readonly T[], interests: readonly Interest[]): T[] {
  return [...list.filter(o => isInterested(o.category, interests)), ...list.filter(o => !isInterested(o.category, interests))];
}

/** Purchase history off: sort by soonest expiry, then dollar value. */
export function byExpiryThenValue<T extends { expiresInDays?: number | undefined; value: number }>(list: readonly T[]): T[] {
  const exp = (o: T) => (o.expiresInDays !== undefined && Number.isFinite(o.expiresInDays) ? o.expiresInDays : Infinity);
  return [...list].sort((a, b) => exp(a) - exp(b) || b.value - a.value);
}

/** Quiet hours: 10 PM to 8 AM. */
export const inQuietHours = (hour: number) => hour >= 22 || hour < 8;

/** Whether any banner may appear right now, before reward-specific rules. */
export const bannersAllowed = (prefs: Pick<Preferences, "notify" | "quiet">, hour: number) => prefs.notify && !(prefs.quiet && inQuietHours(hour));

/** Expiry alert: one banner the day before a reward expires, regardless of match. */
export function expiryAlertCandidate<T extends { id: string; expiresInDays?: number | undefined }>(list: readonly T[], alreadyShown: readonly string[]): T | undefined {
  return list.find(o => o.expiresInDays === 1 && !alreadyShown.includes(o.id));
}
