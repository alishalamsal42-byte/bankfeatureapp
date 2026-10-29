export type ModelCategory = "coffee" | "food" | "grocery" | "online" | "ride";
export type Features = Record<"morning" | "lunch" | "afternoon" | "evening" | "late_night" | "weekday" | "weekday_morning" | "weekend_afternoon" | "at_usual_time" | "hours_from_usual" | "spend_velocity" | "days_since_last" | "bought_recently", number>;

/** Coefficients exported from the supplied Python logistic regression training (retrained with spend velocity and rides). */
export const models: Record<ModelCategory, { intercept: number; weights: Features }> = {
  coffee: { intercept: -3.8075, weights: { morning: 0.8199, lunch: -0.9079, afternoon: -0.7684, evening: 0.1797, late_night: 0.6605, weekday: 0.2883, weekday_morning: 0.0349, weekend_afternoon: -0.0262, at_usual_time: 2.4152, hours_from_usual: 0.399, spend_velocity: 0.6702, days_since_last: 0.0017, bought_recently: -1.6845 } },
  food: { intercept: -2.2603, weights: { morning: -1.5135, lunch: 1.5759, afternoon: -1.1965, evening: 0.2869, late_night: 0.8087, weekday: 0.7028, weekday_morning: -0.4626, weekend_afternoon: 0.2385, at_usual_time: 0.1013, hours_from_usual: -0.5578, spend_velocity: 0.3583, days_since_last: -0.1037, bought_recently: -1.8761 } },
  grocery: { intercept: -3.8509, weights: { morning: 0.2149, lunch: -0.5042, afternoon: 0.2787, evening: -0.202, late_night: 0.1727, weekday: -1.0517, weekday_morning: 0.4104, weekend_afternoon: 0.9169, at_usual_time: 0.2788, hours_from_usual: -0.2685, spend_velocity: -0.2718, days_since_last: 0.1414, bought_recently: 0.2288 } },
  online: { intercept: -5.0453, weights: { morning: -0.2429, lunch: -0.716, afternoon: -0.0059, evening: 0.0807, late_night: 0.7756, weekday: 0.8691, weekday_morning: 0.0301, weekend_afternoon: 0.1752, at_usual_time: 0.7076, hours_from_usual: -0.8697, spend_velocity: -0.5932, days_since_last: 0.0466, bought_recently: -0.4054 } },
  ride: { intercept: -3.4689, weights: { morning: -0.5153, lunch: 0.9166, afternoon: 0.2521, evening: -0.5652, late_night: -0.1071, weekday: 0.7018, weekday_morning: -0.4309, weekend_afternoon: -0.5238, at_usual_time: 0.9859, hours_from_usual: -2.395, spend_velocity: 0.2543, days_since_last: 0.189, bought_recently: -0.5316 } },
};

export const usual_hour = {
  coffee_weekend: 13, coffee_weekday: 9,
  food_weekend: 15, food_weekday: 13,
  grocery_weekend: 15, grocery_weekday: 17,
  online_weekend: 15, online_weekday: 20,
  ride_weekend: 22, ride_weekday: 15,
} as const;

export type CategoryModel = { intercept: number; weights: Features };
export type UsualHours = Record<keyof typeof usual_hour, number>;
export type LearnedParams = { models: Record<ModelCategory, CategoryModel>; usualHour: UsualHours };

/** Spend velocity is capped at 2.5, as in training. 1.0 = a normal week. */
export const MAX_SPEND_VELOCITY = 2.5;
export function calculateInputs(hour: number, dayOfWeek: number, hoursSinceLast: number, category: ModelCategory = "coffee", usualHours: UsualHours = usual_hour, spendVelocity = 1): Features {
  hour = Math.floor(hour);
  const morning = Number(hour >= 7 && hour <= 10);
  const afternoon = Number(hour >= 14 && hour <= 17);
  const weekday = Number(dayOfWeek >= 1 && dayOfWeek <= 5); // JS: Sunday = 0
  const difference = Math.abs(hour - usualHours[`${category}_${weekday ? "weekday" : "weekend"}`]);
  return {
    morning, lunch: Number(hour >= 11 && hour <= 13), afternoon,
    evening: Number(hour >= 18 && hour <= 20), late_night: Number(hour >= 21),
    weekday, weekday_morning: morning * weekday, weekend_afternoon: afternoon * (1 - weekday),
    at_usual_time: Number(difference <= 1), hours_from_usual: difference / 12,
    spend_velocity: Math.min(Math.max(spendVelocity, 0), MAX_SPEND_VELOCITY) - 1,
    days_since_last: Math.min(hoursSinceLast, 168) / 24, bought_recently: Number(hoursSinceLast < 4),
  };
}

export function habitScore(category: ModelCategory, hour: number, dayOfWeek: number, hoursSinceLast: number, learned?: LearnedParams, spendVelocity = 1) {
  const model = (learned?.models ?? models)[category];
  const inputs = calculateInputs(hour, dayOfWeek, hoursSinceLast, category, learned?.usualHour, spendVelocity);
  const logit = (Object.keys(inputs) as (keyof Features)[]).reduce((sum, key) => sum + (model.weights[key] ?? 0) * inputs[key], model.intercept);
  return 1 / (1 + Math.exp(-logit));
}

export const visitRate = habitScore;
export type MapPoint = readonly [number, number];
export const distanceMiles = (a: MapPoint, b: MapPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function locationScore(distanceMiles: number, online = false) {
  if (online || distanceMiles < 0.1) return 1;
  if (distanceMiles < 0.5) return 0.6;
  if (distanceMiles < 1) return 0.3;
  return 0.1;
}

export const pointsScore = (dollarValue: number) => 0.5 + 0.5 * Math.min(dollarValue / 10, 1);
export const matchLabel = (match: number) => match >= 0.10 ? "High match" : match >= 0.03 ? "Medium" : "Low";
/** Minimum likely-now for a top pick, the Home "Right now" card or a notification. */
export const TOP_PICK_MIN_LIKELY = 0.08;
/** Top picks and notifications must be online or within this many miles. */
export const TOP_PICK_MAX_MILES = 1;
type Pickable = HasHours & { scores: { habit: number }; online?: boolean | undefined; distanceMiles?: number | undefined; validHours?: readonly [number, number] | undefined };
/** Reward hours [start, end); rewards without hours are always valid. */
export const isValidAt = (r: { validHours?: readonly [number, number] | undefined }, hour: number) => !r.validHours || (hour >= r.validHours[0] && hour < r.validHours[1]);
export const isTopPickEligible = (r: Pickable, hour: number, day?: number) =>
  r.scores.habit >= TOP_PICK_MIN_LIKELY && isValidAt(r, hour) && (day === undefined || isOpenAt(r, day, hour)) && (Boolean(r.online) || (r.distanceMiles !== undefined && r.distanceMiles <= TOP_PICK_MAX_MILES));
/** Highest-match reward (ranked is sorted by match) that passes likely-now, hours and distance rules. */
/** Pass `day` to also require the merchant to be open. */
export const pickTop = <T extends Pickable>(ranked: readonly T[], hour: number, allow: (r: T) => boolean = () => true, day?: number) => ranked.find(r => isTopPickEligible(r, hour, day) && allow(r));
/**
 * When nothing is a strong match, the app still shows its best option: the open, in-hours, reachable reward
 * she is most likely to use right now (highest likely now, then match). Not used for notifications.
 */
export const pickBestNow = <T extends Pickable & { scores: { habit: number; match?: number } }>(ranked: readonly T[], hour: number, allow: (r: T) => boolean = () => true, day?: number) =>
  ranked.filter(r => isValidAt(r, hour) && (day === undefined || isOpenAt(r, day, hour)) && (Boolean(r.online) || (r.distanceMiles !== undefined && r.distanceMiles <= TOP_PICK_MAX_MILES)) && allow(r))
    .reduce<T | undefined>((best, r) => !best || r.scores.habit > best.scores.habit || (r.scores.habit === best.scores.habit && (r.scores.match ?? 0) > (best.scores.match ?? 0)) ? r : best, undefined);
const fmtH = (h: number) => `${h % 12 || 12} ${h >= 12 && h < 24 ? "PM" : "AM"}`;
export const hoursLabel = (h: readonly [number, number]) => `Available ${fmtH(h[0])}–${fmtH(h[1])}`;
/** Minimum match for a suggestion notification. */
export const NOTIFY_THRESHOLD = 0.115;
export const shouldNotify = (topMatch: number | undefined) => topMatch !== undefined && topMatch >= NOTIFY_THRESHOLD;
/** Opening hours in local 24h time; close > 24 runs past midnight (25 = 1 AM). */
export type OpenHours = { open: number; close: number; closedDays?: readonly number[] };
type HasHours = { openHours?: OpenHours | undefined };
const openOn = (h: OpenHours, day: number) => !h.closedDays?.includes(((day % 7) + 7) % 7);
export function isOpenAt(r: HasHours, day: number, hour: number) {
  const h = r.openHours; if (!h) return true;
  if (openOn(h, day) && hour >= h.open && hour < h.close) return true;
  return h.close > 24 && openOn(h, day - 1) && hour < h.close - 24;
}
const fmtClock = (h: number) => `${Math.floor(h) % 12 || 12}${h % 1 ? `:${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : ""} ${h % 24 >= 12 ? "PM" : "AM"}`;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** "Closed · opens 6:30 AM" (today/tomorrow) or "Closed · opens Mon 6:30 AM"; undefined when open. */
export function closedLabel(r: HasHours, day: number, hour: number) {
  const h = r.openHours; if (!h || isOpenAt(r, day, hour)) return undefined;
  for (let i = 0; i < 8; i++) {
    if (!openOn(h, day + i) || (i === 0 && hour >= h.open)) continue;
    return `Closed · opens ${i > 1 ? `${dayNames[(day + i) % 7]} ` : ""}${fmtClock(h.open)}`;
  }
  return "Closed";
}

export type RewardCategory = ModelCategory | "travel" | "fun" | "shopping";
export type ScoringContext = { hour: number; dayOfWeek: number; hoursSinceLast: Partial<Record<RewardCategory, number>>; location?: MapPoint | undefined; ignoreLocation?: boolean; learned?: LearnedParams | undefined; spendVelocity?: number | undefined };
export type ScorableReward = { modelCategory?: ModelCategory | undefined; historyCategory: RewardCategory; distanceMiles?: number | undefined; mapPoint?: MapPoint; gps?: MapPoint; online?: boolean; value: number };

export function strongestFactor(scores: { visitRate: number; location: number; points: number }): "visitRate" | "location" | "points" {
  if (scores.visitRate >= scores.location && scores.visitRate >= scores.points) return "visitRate";
  return scores.location >= scores.points ? "location" : "points";
}

export function scoreReward(reward: ScorableReward, context: ScoringContext) {
  if (!reward.modelCategory || !Object.hasOwn(models, reward.modelCategory)) throw new Error("Visit-rate scoring requires a trained category");
  const hoursSinceLast = context.hoursSinceLast[reward.historyCategory] ?? 168;
  const inputs = reward.modelCategory ? calculateInputs(context.hour, context.dayOfWeek, hoursSinceLast, reward.modelCategory, context.learned?.usualHour, context.spendVelocity) : undefined;
  const habit = habitScore(reward.modelCategory, context.hour, context.dayOfWeek, hoursSinceLast, context.learned, context.spendVelocity);
  const distance = reward.mapPoint && context.location ? distanceMiles(reward.mapPoint, context.location) : reward.distanceMiles;
  if (!reward.online && distance === undefined) throw new Error("Offline reward scoring requires a distance or reward and user map points");
  const location = context.ignoreLocation ? 1 : locationScore(distance ?? 0, reward.online);
  const points = pointsScore(reward.value);
  const usualHour = reward.modelCategory ? (context.learned?.usualHour ?? usual_hour)[`${reward.modelCategory}_${context.dayOfWeek >= 1 && context.dayOfWeek <= 5 ? "weekday" : "weekend"}`] : undefined;
  return { habit, visitRate: habit, location, points, match: habit * location * points, trained: Boolean(reward.modelCategory), atUsualTime: inputs?.at_usual_time === 1, usualHour };
}

export function rankRewards<T extends ScorableReward>(rewards: readonly T[], context: ScoringContext) {
  return rewards.filter(isTrainedReward).map(reward => ({ ...reward, distanceMiles: reward.mapPoint && context.location ? distanceMiles(reward.mapPoint, context.location) : reward.distanceMiles, scores: scoreReward(reward, context) })).sort((a, b) => b.scores.match - a.scores.match);
}

export const isTrainedReward = (reward: ScorableReward) => Boolean(reward.modelCategory && Object.hasOwn(models, reward.modelCategory));
export function unscoredRewards<T extends ScorableReward>(rewards: readonly T[]) {
  return rewards.filter(reward => !isTrainedReward(reward)).sort((a, b) => b.value - a.value);
}