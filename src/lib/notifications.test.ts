import { describe, expect, it } from 'vitest';
import { BANNER_DURATION_MS, canNotify, recordNotification, localDay, gpsDistanceMiles } from './notifications';
import { rankRewards, unscoredRewards } from './model';
import { mockPlaces } from './model-fixtures';
import { demoOffers, offers, getOffer } from './rewards';
import { presets } from '../hooks/recommendation-demo';
const top = rankRewards(demoOffers, { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20 }, location: mockPlaces.Library })[0];
if (!top) throw new Error('Missing fixture');
const empty = { day: '2026-10-28', rewardIds: [] };
describe('notification eligibility', () => {
  it('requires top match >=0.115', () => {
    expect(canNotify({ ...top, scores: { ...top.scores, match: 0.1149 } }, empty, empty.day)).toBe(false);
    expect(canNotify({ ...top, scores: { ...top.scores, match: 0.115 } }, empty, empty.day)).toBe(true);
  });
  it('requires within 0.1 mile or online', () => {
    expect(canNotify({ ...top, distanceMiles: 0.1 }, empty, empty.day)).toBe(true);
    expect(canNotify({ ...top, distanceMiles: 0.10001 }, empty, empty.day)).toBe(false);
    expect(canNotify({ ...top, distanceMiles: undefined }, empty, empty.day)).toBe(false);
    expect(canNotify({ ...top, distanceMiles: 50, online: true }, empty, empty.day)).toBe(true);
  });
  it('notifies a reward only once per day', () => {
    const ledger = recordNotification(empty, empty.day, top.id);
    expect(canNotify(top, ledger, empty.day)).toBe(false);
    expect(canNotify(top, ledger, '2026-10-29')).toBe(true);
  });
  it('permits the third notification and blocks the fourth', () => {
    expect(canNotify(top, { ...empty, rewardIds: ['one', 'two'] }, empty.day)).toBe(true);
    expect(canNotify(top, { ...empty, rewardIds: ['one', 'two', 'three'] }, empty.day)).toBe(false);
    expect(recordNotification({ ...empty, rewardIds: ['one', 'two', 'three'] }, '2026-10-29', top.id).rewardIds).toEqual([top.id]);
  });
  it('auto-dismiss delay is eight seconds', () => expect(BANNER_DURATION_MS).toBe(8000));
  it('uses the local calendar day', () => expect(localDay(new Date(2026, 9, 28, 23, 59))).toBe('2026-10-28'));
  it('keeps Campus Brew 200 points and $7 in payment lookup', () => {
    expect(getOffer('campus-brew')).toMatchObject({ points: 200, value: 7 });
  });
  it('Morning coffee ranks Starbucks first with the required trained scores and data', () => {
    expect(top).toMatchObject({ id: 'coffee', merchant: 'Starbucks', category: 'Coffee', modelCategory: 'coffee', points: 750, value: 5.25, mapPoint: mockPlaces.Library });
    expect(top.scores.visitRate).toBeCloseTo(0.45, 2);
    expect(top.scores).toMatchObject({ trained: true, atUsualTime: true, usualHour: 9, location: 1, points: 0.7625 });
    expect(top.distanceMiles).toBeLessThanOrEqual(0.1);
    expect(top.scores.match).toBeGreaterThanOrEqual(0.10);
    expect(getOffer('coffee')).toMatchObject({ points: 750, value: 5.25 });
  });
  it('untrained categories never enter scored rankings or notifications', () => {
    const ranked = rankRewards(offers, { hour: 8, dayOfWeek: 2, hoursSinceLast: { coffee: 20 } });
    expect(ranked.some(r => ['movie', 'nike', 'tjx', 'bb'].includes(r.id))).toBe(false);
    expect(ranked.filter(r => r.modelCategory === 'ride').map(r => r.id).sort()).toEqual(['lyft', 'ride']);
    expect(ranked.every(r => r.scores.trained)).toBe(true);
    expect(canNotify({ ...top, modelCategory: undefined, historyCategory: 'travel' }, empty, empty.day)).toBe(false);
  });
  it('untrained rewards have no scores and are sorted by descending dollars', () => {
    const unscored = unscoredRewards(demoOffers);
    expect(unscored.map(r => r.id)).toEqual(['bb', 'nike', 'tjx', 'movie']);
    expect(unscored.every(r => !('scores' in r))).toBe(true);
    expect(unscoredRewards(offers).map(r => r.value)).toEqual([20, 18, 15, 14]);
  });
  it('uses supplied presets', () => {
    expect(presets['Morning coffee']).toMatchObject({ dayOfWeek: 2, hour: 8, place: 'Library', hoursSinceLast: { coffee: 20 } });
    expect(presets['Lunch break']).toMatchObject({ dayOfWeek: 2, hour: 12, place: 'Student Union', hoursSinceLast: { food: 5 } });
    expect(presets['Sunday errands']).toMatchObject({ dayOfWeek: 0, hour: 15, place: 'Town Center', hoursSinceLast: { grocery: 150 } });
    expect(presets['Quiet night']).toMatchObject({ dayOfWeek: 3, hour: 21, place: 'Residence halls' });
  });
  it('converts GPS degrees to miles separately from fictional maps', () => {
    expect(gpsDistanceMiles([0, 0], [0, 1])).toBeCloseTo(69.09, 1);
  });
});
