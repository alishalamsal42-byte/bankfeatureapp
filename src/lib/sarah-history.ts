/** Sarah's mock purchase history: pure helpers for hours-since-last, weekly counts, last purchases and Savings seeds. */
import raw from "./sarah-history.json";
import type { ModelCategory } from "./model";
import { habitScore, locationScore, pointsScore } from "./model";
import type { Redemption } from "./redemption";

export const USER_NAME = "Sarah";
export type RawEntry = [daysAgo: number, hour: number, category: string, merchant: string];
export type Purchase = { at: number; category: string; merchant: string };
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const sarahHistory = raw as RawEntry[];
export const HISTORY_CATEGORIES: ModelCategory[] = ["coffee", "food", "grocery", "online", "ride"];

/** Entries as timestamps relative to `now`; today's entries later than the current hour are ignored. */
export function purchasesAsOf(now: Date, entries: readonly RawEntry[] = sarahHistory): Purchase[] {
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  return entries
    .filter(([d, h]) => !(d === 0 && h > now.getHours()))
    .map(([d, h, category, merchant]) => { const day = new Date(midnight); day.setDate(day.getDate() - d); return { at: day.getTime() + h * HOUR, category, merchant }; })
    .sort((a, b) => a.at - b.at);
}

/** Hours since the most recent purchase per category (168 when none; capped at 168). */
export function hoursSinceFromHistory(list: readonly Purchase[], nowMs: number, categories: readonly string[] = [...HISTORY_CATEGORIES, "shopping", "travel", "fun"]) {
  const out: Record<string, number> = {};
  for (const c of categories) {
    const last = list.filter(p => p.category === c && p.at <= nowMs).at(-1);
    out[c] = last ? Math.min(168, Math.max(0, (nowMs - last.at) / HOUR)) : 168;
  }
  return out as Record<ModelCategory | "shopping" | "travel" | "fun", number>;
}

/** Purchases in each category over the last 4 weeks ÷ 4. */
export function weeklyCounts(list: readonly Purchase[], nowMs: number): Record<ModelCategory, number> {
  const recent = list.filter(p => p.at <= nowMs && nowMs - p.at < 28 * DAY);
  return Object.fromEntries(HISTORY_CATEGORIES.map(c => [c, recent.filter(p => p.category === c).length / 4])) as Record<ModelCategory, number>;
}
/** Spend velocity, as in training: purchases in the last 7 days ÷ (purchases in the last 28 days ÷ 4), all categories, capped at 2.5; 1.0 when there are none. */
export function spendVelocityFromHistory(list: readonly Purchase[], nowMs: number): number {
  const last7 = list.filter(p => p.at < nowMs && nowMs - p.at <= 7 * DAY).length;
  const last28 = list.filter(p => p.at < nowMs && nowMs - p.at <= 28 * DAY).length;
  if (last28 === 0) return 1;
  return Math.min(last7 / (last28 / 4), 2.5);
}
/** "normal", "a bit higher than usual" or "lighter than usual" (below 0.9 lighter, above 1.1 higher). */
export const spendPaceLabel = (velocity: number) => velocity < 0.9 ? "lighter than usual" : velocity > 1.1 ? "a bit higher than usual" : "normal";
export const formatWeekly = (n: number) => String(Math.round(n * 10) / 10);
export const likelyNowLabel = (habit: number, category: string, weekly: Partial<Record<string, number>>) => {
  const w = weekly[category];
  return `${Math.round(habit * 100)}%${w ? ` · ${category} about ${formatWeekly(w)}× a week` : ""}`;
};

export const lastPurchases = (list: readonly Purchase[], n = 5) => list.slice(-n).reverse();

type RewardLike = { id: string; merchant: string; title: string; points: number; value: number; category: string; expiresInDays?: number | undefined; distanceMiles?: number | undefined; online?: boolean | undefined; modelCategory?: ModelCategory | undefined };
/** Savings seed: entries in the last 8 weeks at merchants that have a reward; match is replayed with the trained model. */
export function seedFromHistory(list: readonly Purchase[], rewards: readonly RewardLike[], nowMs: number, weeks = 8): Redemption[] {
  const out: Redemption[] = [];
  list.forEach((p, i) => {
    const r = rewards.find(x => x.merchant === p.merchant);
    if (!r || nowMs - p.at >= weeks * 7 * DAY || p.at > nowMs) return;
    const prev = list.slice(0, i).filter(x => x.category === p.category).at(-1);
    const hrs = prev ? (p.at - prev.at) / HOUR : 168;
    const d = new Date(p.at);
    const match = r.modelCategory ? habitScore(r.modelCategory, d.getHours(), d.getDay(), hrs) * locationScore(r.distanceMiles ?? 0, r.online) * pointsScore(r.value) : undefined;
    out.push({ id: `seed-${i}`, rewardId: `seed-${i}`, merchant: r.merchant, title: r.title, category: r.category, rewardValue: r.value, points: r.points, bankPts: 0, saved: r.value, expiresInDays: r.expiresInDays, match, suggested: match !== undefined && match >= 0.1, date: d.toISOString() });
  });
  return out.reverse();
}
