import type { MapPoint, ScorableReward } from "./model";

/** Supplied scoring examples, kept separate from the app's Connect partners. */
export const mockPlaces = {
  Library: [0.30, 0.32],
  "Student Union": [0.50, 0.42],
  "Residence halls": [0.45, 0.75],
  "Town Center": [2.00, 0.50],
} as const satisfies Record<string, MapPoint>;

export const mockRewards = [
  { id: "campus-brew", merchant: "Campus Brew", title: "Free drink", modelCategory: "coffee", historyCategory: "coffee", points: 200, value: 7, mapPoint: [0.30, 0.30] },
  { id: "campus-grill", merchant: "Campus Grill", title: "15% off lunch", modelCategory: "food", historyCategory: "food", points: 0, value: 1.80, mapPoint: [0.50, 0.40] },
  { id: "fresh-basket", merchant: "Fresh Basket", title: "$3 off", modelCategory: "grocery", historyCategory: "grocery", points: 300, value: 3, mapPoint: [2.00, 0.50] },
  { id: "online-store", merchant: "Online store", title: "$10 voucher", modelCategory: "online", historyCategory: "online", points: 1000, value: 10, online: true },
] as const satisfies readonly (ScorableReward & { id: string; merchant: string; title: string; points: number })[];