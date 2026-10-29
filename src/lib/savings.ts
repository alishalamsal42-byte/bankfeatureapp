import { BANK } from "./bank";
/** Pure savings stats over redemption history. Seed history is example data relative to "now". */
import type { Redemption } from "./redemption";

export type SavingsCategory = "Coffee" | "Food" | "Groceries" | "Shopping";
export const SAVINGS_CATEGORIES: SavingsCategory[] = ["Coffee", "Food", "Groceries", "Shopping"];
export const RESCUE_DAYS = 7;
const DAY = 86_400_000;

export const toSavingsCategory = (c?: string): SavingsCategory =>
  c === "Coffee" ? "Coffee" : c === "Food" ? "Food" : c === "Grocery" || c === "Groceries" ? "Groceries" : "Shopping";

type Seed = [daysAgo: number, merchant: string, title: string, cat: SavingsCategory, rewardValue: number, points: number, bankPts: number, expiresInDays: number, match?: number];
const SEEDS: Seed[] = [
  [1, "Starbucks", "Free drink", "Coffee", 5.25, 750, 0, 1, 0.31],
  [3, "Chick-fil-A", "Free sandwich", "Food", 6.5, 1200, 330, 9, 0.36],
  [6, "Amazon", "$10 voucher", "Shopping", 10, 1000, 0, 1, 0.22],
  [10, "Taco Bell", "$8 off $25+", "Food", 8, 0, 0, 5, 0.28],
  [15, "Starbucks", "Free drink", "Coffee", 5.25, 750, 0, 12, 0.3],
  [20, "Chipotle", "15% off lunch", "Food", 1.8, 0, 0, 20],
  [24, "Target", "$5 off groceries", "Groceries", 5, 500, 0, 9, 0.18],
  [30, "McDonald's", "Free fries", "Food", 3.25, 300, 0, 4],
  [36, "TJ Maxx", "$15 voucher", "Shopping", 15, 1500, 0, 20],
  [42, "Burger King", "$5 off $15+", "Food", 5, 0, 0, 3, 0.25],
  [48, "Starbucks", "Free drink", "Coffee", 5.25, 750, 0, 30, 0.27],
  [53, "Nike", "20% off shoes", "Shopping", 18, 2500, 0, 40],
];

export function seedRedemptions(now: Date): Redemption[] {
  return SEEDS.map(([d, merchant, title, category, rewardValue, points, bankPts, expiresInDays, match], i) => ({
    id: `seed-${i}`, rewardId: `seed-${i}`, merchant, title, category, rewardValue, points, bankPts, expiresInDays, match,
    suggested: match !== undefined, saved: Math.round((rewardValue + bankPts / 100) * 100) / 100,
    date: new Date(now.getTime() - d * DAY).toISOString(),
  }));
}

const round = (n: number) => Math.round(n * 100) / 100;
export const isThisMonth = (r: Redemption, now: Date) => { const d = new Date(r.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); };
export const isThisWeek = (r: Redemption, now: Date) => now.getTime() - new Date(r.date).getTime() < 7 * DAY;
export const byScope = (list: Redemption[], scope: "month" | "all", now: Date) => scope === "all" ? list : list.filter(r => isThisMonth(r, now));

export const rescued = (list: Redemption[]) => round(list.filter(r => r.expiresInDays !== undefined && r.expiresInDays <= RESCUE_DAYS).reduce((s, r) => s + r.saved, 0));

export const stats = (list: Redemption[]) => ({
  saved: round(list.reduce((s, r) => s + r.saved, 0)),
  points: list.reduce((s, r) => s + r.points + (r.bankPts ?? 0), 0),
  count: list.length,
});

/** Dollars saved per week, oldest first; last entry is the current week (last 7 days). */
export function weekly(list: Redemption[], now: Date, weeks = 8): number[] {
  const out = Array<number>(weeks).fill(0);
  for (const r of list) {
    const w = Math.floor((now.getTime() - new Date(r.date).getTime()) / (7 * DAY));
    if (w >= 0 && w < weeks) out[weeks - 1 - w] = (out[weeks - 1 - w] ?? 0) + r.saved;
  }
  return out.map(round);
}

export const byCategory = (list: Redemption[]) =>
  SAVINGS_CATEGORIES.map(category => ({ category, amount: round(list.filter(r => toSavingsCategory(r.category) === category).reduce((s, r) => s + r.saved, 0)) }));

export function topMerchants(list: Redemption[], n = 3) {
  const m = new Map<string, number>();
  for (const r of list) m.set(r.merchant, (m.get(r.merchant) ?? 0) + r.saved);
  return [...m].map(([merchant, amount]) => ({ merchant, amount: round(amount) })).sort((a, b) => b.amount - a.amount).slice(0, n);
}

export function smartPicks(list: Redemption[]) {
  const s = list.filter(r => r.suggested && r.match !== undefined);
  return { suggested: s.length, total: list.length, avgMatch: s.length ? s.reduce((a, r) => a + (r.match ?? 0), 0) / s.length : 0 };
}

export const paidWith = (r: Redemption) =>
  r.bankPts ? `${r.title} + ${r.bankPts.toLocaleString()} ${BANK.name} pts` : r.points ? `${r.title} · ${r.points.toLocaleString()} pts` : r.title;
