/** Pure redemption helpers: code, countdown, reward type and card payment split. */
export const CODE_VALID_MS = 15 * 60 * 1000;

export const redemptionCode = (id: string, n: number) => `RW-${id.toUpperCase()}-${String(n).padStart(4, "0")}`;

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Bank card offers cost no merchant points; they're paid by tapping the card. */
export const isCardOffer = (o: { points: number }) => o.points === 0;

/** Sample order total: the minimum spend, or $12 when there is none. */
export function cardPayment(o: { value: number; minSpend: number }) {
  const total = o.minSpend > 0 ? o.minSpend : 12;
  const covered = Math.min(o.value, total);
  return { total, covered, charged: Math.round((total - covered) * 100) / 100 };
}

export type Redemption = { id: string; rewardId: string; merchant: string; title: string; saved: number; points: number; rewardValue?: number; bankPts?: number; date: string; category?: string | undefined; expiresInDays?: number | undefined; match?: number | undefined; suggested?: boolean };

/** How much more to spend before a minimum-purchase reward applies (0 when it qualifies). */
export const minSpendShortfall = (total: number, minSpend: number) => Math.max(0, Math.round((minSpend - total) * 100) / 100);

export type DetailAction = "bank" | "handoff" | "offer" | "reward";
/** Main button in the Connect detail popup. */
export function detailAction(o: { id: string; points: number; unlock?: { goal: number } | undefined }, bankId = "chase"): DetailAction {
  if (o.id === bankId) return "bank";
  if (o.unlock && o.points < o.unlock.goal) return "handoff";
  return o.points === 0 ? "offer" : "reward";
}

/** Days until expiry from an offer's label ("Today", "Tomorrow", "6 days"); undefined if none. */
export function expiryDays(expires: string): number | undefined {
  if (expires === "Today") return 0;
  if (expires === "Tomorrow") return 1;
  const n = Number.parseInt(expires, 10);
  return Number.isFinite(n) ? n : undefined;
}
