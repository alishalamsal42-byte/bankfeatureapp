/** Pure builder for the data the rewards assistant may answer from. */
import { closedLabel, hoursLabel, isOpenAt, isValidAt, matchLabel, type OpenHours } from "./model";
import type { Purchase } from "./sarah-history";
import { formatWeekly, spendPaceLabel } from "./sarah-history";

type R = { id: string; merchant: string; title: string; category: string; points: number; value: number; minSpend: number; expires: string; validHours?: readonly [number, number] | undefined; openHours?: OpenHours | undefined; online?: boolean | undefined; distanceMiles?: number | undefined; scores?: { habit: number; match: number } | undefined };
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clock = (h: number) => `${Math.floor(h) % 12 || 12}${h % 1 ? `:${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : ""} ${h % 24 >= 12 ? "PM" : "AM"}`;

export function buildAssistantContext(a: {
  dayOfWeek: number; hour: number; place: string; ranked: readonly R[]; unscored: readonly R[]; topPickId: string | undefined;
  bank: { connected: boolean; points: number; dollars: number }; weekly: Record<string, number>; usualHour: Record<string, number>;
  purchases: readonly Purchase[]; prefs: Record<string, unknown>; spendVelocity?: number | undefined;
}) {
  const describe = (r: R, rank?: number) => {
    const open = isOpenAt(r, a.dayOfWeek, a.hour);
    const validNow = isValidAt(r, a.hour);
    return {
      id: r.id, rank, merchant: r.merchant, title: r.title, category: r.category, points: r.points, dollarValue: r.value,
      minimumPurchase: r.minSpend || null, expires: r.expires,
      rewardHours: r.validHours ? hoursLabel(r.validHours) : "All day", validNow,
      openingHours: r.openHours ? `${clock(r.openHours.open)}–${clock(r.openHours.close)}${r.openHours.closedDays?.length ? `, closed ${r.openHours.closedDays.map(d => days[d]).join(", ")}` : ""}` : r.online ? "Online" : "Not listed",
      open, closedNote: closedLabel(r, a.dayOfWeek, a.hour) ?? null,
      where: r.online ? "Online" : r.distanceMiles !== undefined ? `${Number(r.distanceMiles.toFixed(2))} mi away` : null,
      likelyNow: r.scores ? `${Math.round(r.scores.habit * 100)}%` : null, match: r.scores ? matchLabel(r.scores.match) : null,
    };
  };
  const all = [...a.ranked.map((r, i) => describe(r, i + 1)), ...a.unscored.map(r => describe(r))];
  return {
    context: {
      now: `${days[a.dayOfWeek]} ${clock(a.hour)}`, location: a.place,
      topPick: a.topPickId ? all.find(r => r.id === a.topPickId) ?? null : null,
      rankedByMatch: all.filter(r => r.rank !== undefined).map(r => `${r.rank}. ${r.merchant} ${r.title} (${r.match})`),
      rewards: all,
      chase: a.bank.connected ? { points: a.bank.points, dollars: a.bank.dollars, note: "1 point = 1 cent, usable anywhere with the card" } : "Not connected",
      sarah: {
        weeklyPurchases: Object.fromEntries(Object.entries(a.weekly).map(([k, v]) => [k, `about ${formatWeekly(v)}× a week`])),
        usualTimes: Object.fromEntries(Object.entries(a.usualHour).map(([k, v]) => [k, clock(v)])),
        spendingPaceThisWeek: a.spendVelocity === undefined ? "normal" : `${spendPaceLabel(a.spendVelocity)} (${a.spendVelocity.toFixed(2)}× her usual week)`,
        last5Purchases: a.purchases.slice(-5).reverse().map(p => `${new Date(p.at).toLocaleString("en-US", { weekday: "short", hour: "numeric" })} · ${p.category} · ${p.merchant}`),
      },
      preferences: a.prefs,
    },
    /** Only open, in-hours rewards can get a payment button. */
    allowedRewardIds: all.filter(r => r.open && r.validNow).map(r => r.id),
  };
}
