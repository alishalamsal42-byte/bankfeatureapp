/** Online learning for the likely-now model: SGD on logistic weights plus usual-hour drift. Pure and browser-safe. */
import { calculateInputs, habitScore, models, usual_hour, type Features, type LearnedParams, type ModelCategory } from "./model";

export const LEARNING_RATE = 0.3;
export const USUAL_HOUR_SHIFT = 0.2;
export type LearningKind = "redeem" | "skip" | "ignored";
export type LearningEvent = { category: ModelCategory; kind: LearningKind; dayOfWeek: number; hour: number; at: string };
export type LearningState = LearnedParams & { events: LearningEvent[] };
export type LearningContext = { hour: number; dayOfWeek: number; hoursSinceLast: number; spendVelocity?: number | undefined };

export const initialLearning = (): LearningState => ({ models: structuredClone(models), usualHour: { ...usual_hour }, events: [] });
export const isModelCategory = (c: string): c is ModelCategory => Object.hasOwn(models, c);

const outcomeOf: Record<LearningKind, number> = { redeem: 1, skip: 0, ignored: 0 };
const rateOf: Record<LearningKind, number> = { redeem: LEARNING_RATE, skip: LEARNING_RATE, ignored: LEARNING_RATE / 2 };

/** weight += rate × (outcome − predicted) × input; intercept uses input 1. Redeems also pull the usual hour 20% toward now. */
export function learn(state: LearningState, category: ModelCategory, kind: LearningKind, ctx: LearningContext, at = new Date().toISOString()): LearningState {
  const predicted = habitScore(category, ctx.hour, ctx.dayOfWeek, ctx.hoursSinceLast, state, ctx.spendVelocity);
  const inputs = calculateInputs(ctx.hour, ctx.dayOfWeek, ctx.hoursSinceLast, category, state.usualHour, ctx.spendVelocity);
  const step = rateOf[kind] * (outcomeOf[kind] - predicted);
  const m = state.models[category];
  const weights = { ...m.weights };
  for (const k of Object.keys(inputs) as (keyof Features)[]) weights[k] = weights[k] + step * inputs[k];
  const usualHour = { ...state.usualHour };
  if (kind === "redeem") {
    const key = `${category}_${ctx.dayOfWeek >= 1 && ctx.dayOfWeek <= 5 ? "weekday" : "weekend"}` as const;
    usualHour[key] = usualHour[key] + USUAL_HOUR_SHIFT * (ctx.hour - usualHour[key]);
  }
  return {
    models: { ...state.models, [category]: { intercept: m.intercept + step, weights } },
    usualHour,
    events: [...state.events, { category, kind, dayOfWeek: ctx.dayOfWeek, hour: ctx.hour, at }],
  };
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const kindLabel: Record<LearningKind, string> = { redeem: "Redeemed", skip: "Not now", ignored: "Notification ignored" };
const hourLabel = (h: number) => `${Math.floor(h) % 12 || 12}${h % 1 ? ":30" : ""} ${h >= 12 ? "PM" : "AM"}`;
export const eventLabel = (e: LearningEvent) => `${e.category[0]!.toUpperCase()}${e.category.slice(1)} · ${kindLabel[e.kind]} · ${days[e.dayOfWeek]} ${hourLabel(e.hour)}`;
export const recentEvents = (s: LearningState, n = 5) => s.events.slice(-n).reverse();

export function parseLearning(raw: unknown): LearningState | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<LearningState>;
  if (!v.models || !v.usualHour || !Array.isArray(v.events)) return null;
  const base = initialLearning();
  // Learning saved for an older model (e.g. before spend velocity) is discarded so it restarts from the new trained weights.
  for (const c of Object.keys(base.models) as ModelCategory[]) {
    const m = v.models[c];
    if (!m || typeof m.intercept !== "number" || !m.weights) return null;
    for (const k of Object.keys(base.models[c].weights)) if (typeof (m.weights as Record<string, unknown>)[k] !== "number") return null;
  }
  return { models: v.models, usualHour: { ...base.usualHour, ...v.usualHour }, events: v.events };
}
