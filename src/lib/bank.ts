/** Pure bank-card points rules for the host bank (unnamed; shown as "Bank"). Kept out of merchant offers so it never gets a match score. */
import { BANK_NAME } from "./app-config";
export const BANK = { id: "chase", name: BANK_NAME, label: "Your bank card", points: `${BANK_NAME} points`, card: "Student Debit •••• 4821", checking: 1248.55, pointValue: 0.01, startingPoints: 2340 } as const;

export const bankDollars = (points: number) => Math.round(points * BANK.pointValue * 100) / 100;

const typicalByCategory: Record<string, number> = { Coffee: 6, Food: 9.8, Grocery: 25, Online: 20, Shopping: 30, Travel: 15, Fun: 15 };
/** Typical purchase for a reward: its minimum spend, else a category typical, never below the reward value. */
export function typicalPurchase(o: { category: string; minSpend: number; value: number }) {
  const base = o.minSpend > 0 ? o.minSpend : typicalByCategory[o.category] ?? 12;
  return Math.max(base, o.value);
}

/** Split a purchase: merchant reward first, then bank points (whole points), then the card. */
export function paymentSplit(total: number, rewardValue: number, bankPoints: number, useBank: boolean) {
  const rewardCovered = Math.min(rewardValue, total);
  const rest = Math.round((total - rewardCovered) * 100) / 100;
  const bankPts = useBank ? Math.min(bankPoints, Math.round(rest * 100)) : 0;
  const bankCovered = bankDollars(bankPts);
  return { total, rewardCovered, bankPts, bankCovered, charged: Math.round((rest - bankCovered) * 100) / 100 };
}

/** True when bank points can cover everything the reward doesn't. */
export const bankCoversRest = (total: number, rewardValue: number, bankPoints: number) => paymentSplit(total, rewardValue, bankPoints, true).charged === 0;

/** Ways to use bank points on the bank Rewards screen. Cash back is instant through FIS real-time payments (simulated). */
export type BankRedeemKind = "checkout" | "cash" | "gift";
export const GIFT_CARD_MERCHANTS = ["Starbucks", "Amazon", "Chick-fil-A"] as const;
export const CASH_BACK_AMOUNTS = [5, 10] as const;
export const GIFT_CARD_AMOUNTS = [5, 10, 20] as const;
/** Points needed for a dollar amount (1 point = 1 cent). */
export const pointsFor = (dollars: number) => Math.round(dollars / BANK.pointValue);
export const canAfford = (points: number, dollars: number) => dollars > 0 && pointsFor(dollars) <= points;
/** "Use all" cash back: every whole dollar the balance covers. */
export const allCashBack = (points: number) => Math.floor(bankDollars(points));
/** Demo gift card code, stable for the same merchant and time. */
export const giftCardCode = (merchant: string, at: number) => {
  const n = Math.abs([...`${merchant}${at}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 100_000_000;
  return `${merchant.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}-${String(n).padStart(8, "0").replace(/(\d{4})(\d{4})/, "$1-$2")}`;
};
