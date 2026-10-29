import { useRewardEngine } from "./recommendation-demo";
import { defaultHoursSinceLast } from "@/lib/mock-history";

/** Sample purchase history and distances until real account/store data is connected. */
export const demoHistory = { ...defaultHoursSinceLast, shopping: 72, travel: 24, fun: 168 };

export function useRecommendationState() {
  return useRewardEngine();
}

export function useRecommendations() {
  return useRecommendationState().ranked;
}