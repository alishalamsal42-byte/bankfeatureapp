/** Pure helpers for the bank side of the demo: accounts, recent transactions and spending, built from Sarah's purchase history. */
import { BANK } from "./bank";
import type { Purchase } from "./sarah-history";

const DAY = 86_400_000;

export const accounts = {
  checking: { name: "Student Checking", last4: "4821", balance: BANK.checking },
  savings: { name: "Savings", last4: "0912", balance: 3420 },
  card: { name: "Student Credit Card", last4: "7731", balance: 214.37, limit: 1500 },
} as const;

/** Typical amount Sarah spends per purchase, by category (demo values). */
export const typicalAmount: Record<string, number> = { coffee: 5.75, food: 11.4, grocery: 38.2, online: 24.99, ride: 14.2 };
/** The rewards card earns 1 point per dollar. */
export const pointsEarned = (amount: number) => Math.floor(amount);

export type Transaction = { id: string; at: number; merchant: string; category: string; amount: number; points: number };
/** Most recent card transactions, newest first. */
export function recentTransactions(list: readonly Purchase[], nowMs: number, n = 6): Transaction[] {
  return list.filter(p => p.at <= nowMs).slice(-n).reverse().map((p, i) => {
    const amount = typicalAmount[p.category] ?? 12;
    return { id: `t-${p.at}-${i}`, at: p.at, merchant: p.merchant, category: p.category, amount, points: pointsEarned(amount) };
  });
}

/** Dollars spent in a window ending now. */
const spentIn = (list: readonly Purchase[], nowMs: number, days: number) =>
  list.filter(p => p.at < nowMs && nowMs - p.at <= days * DAY).reduce((s, p) => s + (typicalAmount[p.category] ?? 12), 0);

/** This week's spending vs her usual week (last 28 days ÷ 4). */
export function spendingSummary(list: readonly Purchase[], nowMs: number) {
  const thisWeek = Math.round(spentIn(list, nowMs, 7) * 100) / 100;
  const usualWeek = Math.round((spentIn(list, nowMs, 28) / 4) * 100) / 100;
  const byCategory = Object.keys(typicalAmount).map(category => ({
    category,
    amount: Math.round(list.filter(p => p.category === category && p.at < nowMs && nowMs - p.at <= 28 * DAY).length * (typicalAmount[category] ?? 0) * 100) / 100,
  })).sort((a, b) => b.amount - a.amount);
  return { thisWeek, usualWeek, byCategory };
}

const label: Record<string, string> = { coffee: "Coffee", food: "Food & dining", grocery: "Groceries", online: "Online shopping", ride: "Rides" };
export const categoryLabel = (c: string) => label[c] ?? c;
