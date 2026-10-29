import { describe, expect, it } from 'vitest';
import { appCatalog, CONNECT_DELAY_MS, updateConnections, connectionTotal } from './connection-catalog';
import { rankRewards, unscoredRewards } from './model';
import { getOffer } from './rewards';
describe('mock app connections', () => {
 it('lists exactly the six requested apps', () => expect(appCatalog.map(app => app.merchant)).toEqual(['Panera','Target','Dunkin’','Wingstop','Ulta','Sephora']));
 it('connects once and disconnects without changing other apps', () => {
  expect(updateConnections(['coffee'], 'panera', true)).toEqual(['coffee','panera']);
  expect(updateConnections(['coffee','panera'], 'panera', true)).toEqual(['coffee','panera']);
  expect(updateConnections(['coffee','panera'], 'panera', false)).toEqual(['coffee']);
 });
 it('waits two seconds before connecting', () => expect(CONNECT_DELAY_MS).toBe(2000));
 it('adds and subtracts connected values exactly', () => {
  expect(connectionTotal([{ value: 94.8 }, { value: 5 }])).toBe(99.8);
  expect(connectionTotal([{ value: 94.8 }])).toBe(94.8);
 });
 it('scores food, coffee and grocery apps but never untrained beauty apps', () => {
  const ranked = rankRewards(appCatalog, { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20 } });
  expect(ranked.map(app => app.id).sort()).toEqual(['dunkin','panera','target','wingstop']);
  expect(unscoredRewards(appCatalog).map(app => app.id)).toEqual(['sephora','ulta']);
 });
 it('uses the same values in payment lookup', () => {
  for (const app of appCatalog) expect(getOffer(app.id)).toMatchObject({ points: app.points, value: app.value, merchant: app.merchant });
 });
});
