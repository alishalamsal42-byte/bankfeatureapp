/** Fixed demo expiry dates: offset from a saved start date, counting down in real time. Pure. */
export const DAY_MS = 86_400_000;
export const DEMO_START_KEY = "rewardwise-demo-start";
/** Browser keys cleared by "Reset demo" (preferences are kept). */
export const DEMO_STATE_KEYS = [DEMO_START_KEY, "rewardwise-learning", "rewardwise-last-purchase", "rewardwise-added-purchases", "rewardwise-daily-notifications"];

const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function liveExpiry(baseDays: number, startMs: number, nowMs: number) {
  const expiresAt = startMs + baseDays * DAY_MS;
  const expired = nowMs >= expiresAt;
  const daysLeft = Math.round((startOfDay(expiresAt) - startOfDay(nowMs)) / DAY_MS);
  const expires = expired ? "Expired" : daysLeft <= 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`;
  return { expiresAt, expired, daysLeft: Math.max(0, daysLeft), expires };
}

/** Apply live expiry to an offer whose expiresInDays is its base offset; offers without one are untouched. */
export function withLiveExpiry<T extends { expires: string; expiresInDays?: number | undefined }>(o: T, startMs: number, nowMs: number): T & { expired?: boolean; expiresAt?: number } {
  if (o.expiresInDays === undefined || !Number.isFinite(o.expiresInDays)) return o;
  const e = liveExpiry(o.expiresInDays, startMs, nowMs);
  return { ...o, expires: e.expires, expiresInDays: e.daysLeft, expired: e.expired, expiresAt: e.expiresAt };
}
