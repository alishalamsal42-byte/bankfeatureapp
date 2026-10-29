/** Default mock purchase history shared by scoring, demo panel and UI labels. */
export const defaultHoursSinceLast = { coffee: 12, food: 7, grocery: 72, online: 100, ride: 22 } as const;
/** Typical purchases per week by category, from the same mock history. */
export const weeklyVisits: Record<string, number> = { coffee: 4, food: 6, grocery: 1, online: 2 };
export const likelyNowText = (habitScore: number, category: string) =>
  `${Math.round(habitScore * 100)}%${weeklyVisits[category] ? ` · ${category} about ${weeklyVisits[category]}× a week` : ""}`;

export type LastPurchases = Partial<Record<string, number>>;
/** Hours since last purchase: real elapsed time for categories redeemed in-app, otherwise the mock default (capped at 168). */
export function hoursSinceLast<T extends Record<string, number>>(defaults: T, last: LastPurchases, nowMs: number): T {
  const out: Record<string, number> = { ...defaults };
  for (const [cat, t] of Object.entries(last)) if (typeof t === "number") out[cat] = Math.min(168, Math.max(0, (nowMs - t) / 3_600_000));
  return out as T;
}
/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now: Date) {
  const next = new Date(now); next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
