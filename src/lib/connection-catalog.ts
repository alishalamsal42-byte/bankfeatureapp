import type { Offer } from './rewards';

export const CONNECT_DELAY_MS = 2000;
/** Illustrative balances only; no merchant accounts or credentials are accessed. */
export const appCatalog: Offer[] = [
  { id: 'panera', merchant: 'Panera', category: 'Food', modelCategory: 'food', historyCategory: 'food', title: '$5 lunch reward', points: 500, value: 5, mapPoint: [0.5, 0.4], distanceMiles: 0.2 },
  { id: 'target', merchant: 'Target', category: 'Grocery', modelCategory: 'grocery', historyCategory: 'grocery', title: '$8 grocery reward', points: 800, value: 8, mapPoint: [2, 0.5], distanceMiles: 1.2 },
  { id: 'dunkin', merchant: 'Dunkin’', category: 'Coffee', modelCategory: 'coffee', historyCategory: 'coffee', title: 'Free coffee', points: 350, value: 4.5, mapPoint: [0.35, 0.35], distanceMiles: 0.08 },
  { id: 'wingstop', merchant: 'Wingstop', category: 'Food', modelCategory: 'food', historyCategory: 'food', title: '$6 meal reward', points: 600, value: 6, mapPoint: [0.6, 0.4], distanceMiles: 0.3 },
  { id: 'ulta', merchant: 'Ulta', category: 'Shopping', historyCategory: 'shopping', title: '$10 beauty reward', points: 1000, value: 10, distanceMiles: 0.8 },
  { id: 'sephora', merchant: 'Sephora', category: 'Shopping', historyCategory: 'shopping', title: '$12 beauty reward', points: 1200, value: 12, distanceMiles: 1.1 },
].map(reward => ({ ...reward, emoji: '', minSpend: 0, expires: '30 days', expiresInDays: 30, reason: '' })) as Offer[];

export function updateConnections(ids: readonly string[], id: string, connected: boolean) {
  return connected ? Array.from(new Set([...ids, id])) : ids.filter(value => value !== id);
}
export function connectionTotal(rewards: readonly Pick<Offer, 'value'>[]) {
  return Math.round(rewards.reduce((sum, reward) => sum + reward.value, 0) * 100) / 100;
}