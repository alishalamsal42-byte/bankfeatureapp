import type { Offer } from './rewards';
import type { scoreReward, MapPoint } from './model';
import { isTrainedReward, NOTIFY_THRESHOLD } from './model';
export type RankedOffer = Offer & { scores: ReturnType<typeof scoreReward> };
export type DailyNotifications = { day: string; rewardIds: string[] };
export const BANNER_DURATION_MS = 8000;
export const localDay = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
export function canNotify(reward: RankedOffer | undefined, ledger: DailyNotifications, day: string, opts: { limit?: number; locationOn?: boolean } = {}) {
  const limit = opts.limit ?? 3; const locationOn = opts.locationOn ?? true;
  const ids = ledger.day === day ? ledger.rewardIds : [];
  return Boolean(reward && isTrainedReward(reward) && reward.scores.trained && reward.scores.match >= NOTIFY_THRESHOLD && (reward.online || (locationOn && reward.distanceMiles !== undefined && reward.distanceMiles <= 0.1)) && !ids.includes(reward.id) && ids.length < limit);
}
export function recordNotification(ledger: DailyNotifications, day: string, id: string): DailyNotifications {
  return { day, rewardIds: [...(ledger.day === day ? ledger.rewardIds : []), id] };
}
export const formatHour = (hour: number) => `${Math.floor(hour) % 12 || 12}${hour % 1 ? ':30' : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
const dollars = (value: number) => Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
export function notificationContent(reward: Offer & { scores?: RankedOffer['scores'] }, opts: { showDistance?: boolean | undefined; expiry?: boolean | undefined } = {}) {
  const title = reward.points
    ? `Redeem ${reward.points.toLocaleString()} ${reward.merchant} points for ${reward.title.toLowerCase()} (${dollars(reward.value)} value)`
    : `Use your ${reward.title.toLowerCase()} at ${reward.merchant} (${dollars(reward.value)} off)`;
  const reason = opts.expiry ? 'expires tomorrow' : reward.scores?.atUsualTime && reward.scores.usualHour !== undefined
    ? `your usual ${formatHour(reward.scores.usualHour)} ${reward.historyCategory}`
    : reward.expiresInDays !== undefined && reward.expiresInDays <= 7 ? `expires in ${reward.expiresInDays} days` : '';
  return { title, detail: [reward.merchant, reward.online ? 'Online' : opts.showDistance === false ? '' : `${Number((reward.distanceMiles ?? 0).toFixed(2))} mi away`, reason].filter(Boolean).join(' · ') };
}
/** GPS coordinates are latitude/longitude, never the fictional mile-map points. */
export function gpsDistanceMiles(a: MapPoint, b: MapPoint) {
  const rad = Math.PI / 180;
  const h = Math.sin((b[0] - a[0]) * rad / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin((b[1] - a[1]) * rad / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
