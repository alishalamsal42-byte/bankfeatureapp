/** Pure bank-card points rules for the host bank (unnamed; shown as "Bank"). Kept out of merchant offers so it never gets a match score. */
import { BANK_NAME } from "./app-config";
export const BANK = { id: "chase", name: BANK_NAME, label: "Your bank card", points: "Credit points", card: "Student Credit Card •••• 7731", checking: 1248.55, pointValue: 0.01, startingPoints: 2340 } as const;

export const bankDollars = (points: number) => Math.round(points * BANK.pointValue * 100) / 100;

const typicalByCategory: Record<string, number> = { Coffee: 6, Food: 9.8, Grocery: 25, Online: 20, Shopping: 30, Travel: 15, Fun: 15 };
/** Typical purchase for a reward: its minimum spend, else a category typical, never below the reward value. */
export function typicalPurchase(o: { category: string; minSpend: number; value: number; bankFunded?: boolean | undefined }) {
  if (o.bankFunded) return o.value;
  const base = o.minSpend > 0 ? o.minSpend : typicalByCategory[o.category] ?? 12;
  return Math.max(base, o.value);
}

/** Split a purchase: merchant reward first, then credit points (whole points), then the card. */
export function paymentSplit(total: number, rewardValue: number, bankPoints: number, useBank: boolean) {
  const rewardCovered = Math.min(rewardValue, total);
  const rest = Math.round((total - rewardCovered) * 100) / 100;
  const bankPts = useBank ? Math.min(bankPoints, Math.round(rest * 100)) : 0;
  const bankCovered = bankDollars(bankPts);
  return { total, rewardCovered, bankPts, bankCovered, charged: Math.round((rest - bankCovered) * 100) / 100 };
}

/** True when credit points can cover everything the reward doesn't. */
export const bankCoversRest = (total: number, rewardValue: number, bankPoints: number) => paymentSplit(total, rewardValue, bankPoints, true).charged === 0;

/** The offer list and payment review use the same purchase estimate and split. */
/** Merchant reward applied before Credit points; bank-funded card offers have none (points pay the whole credit). */
export const offerRewardValue = (o: { value: number; bankFunded?: boolean | undefined }) => o.bankFunded ? 0 : o.value;

export function bankPointsForOffer(offer: Parameters<typeof typicalPurchase>[0], balance: number) {
  return paymentSplit(typicalPurchase(offer), offerRewardValue(offer), balance, true).bankPts;
}

/** Explicit offer spending overrides auto-use preferences, but requires a connected card. */
export const bankSelectionEnabled = (requested: boolean, autoUse: boolean, connected: boolean) => connected && (requested || autoUse);

/** Promote only the shared pick; preserve the engine's ordering for every other offer. */
export function bankOfferOrder<T extends { id: string }>(best: T | null | undefined, ranked: readonly T[], unscored: readonly T[]): T[] {
  const seen = new Set<string>();
  return [...(best ? [best] : []), ...ranked, ...unscored].filter(offer => {
    if (seen.has(offer.id)) return false;
    seen.add(offer.id);
    return true;
  });
}
