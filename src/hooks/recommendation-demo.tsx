import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Context as ReactContext } from 'react';
import { pickBestNow, pickTop, rankRewards, unscoredRewards, type MapPoint, type ModelCategory } from '@/lib/model';
import { mockPlaces } from '@/lib/model-fixtures';
import { offers, demoOffers, partners, isLocked, examplePartnerIds, type Offer } from '@/lib/rewards';
import { appCatalog, updateConnections } from '@/lib/connection-catalog';
import { BANNER_DURATION_MS, canNotify, gpsDistanceMiles, localDay, recordNotification, type DailyNotifications, type RankedOffer } from '@/lib/notifications';
import { useRecommendationSession } from './recommendation-session';
import type { Redemption } from '@/lib/redemption';
import { hoursSinceFromHistory, purchasesAsOf, seedFromHistory, spendVelocityFromHistory, weeklyCounts, type Purchase } from '@/lib/sarah-history';
import { toast } from 'sonner';
import { DEMO_START_KEY, DEMO_STATE_KEYS, withLiveExpiry } from '@/lib/expiry';
import type { RewardCategory } from '@/lib/model';
import { APP_NAME } from '@/lib/app-config';
import { learn, isModelCategory, type LearningKind } from '@/lib/learning';
import { useLearning, setLearning, getLearning } from '@/hooks/learning-store';
import { defaultHoursSinceLast, msUntilMidnight } from '@/lib/mock-history';
import { BANK, bankDollars } from '@/lib/bank';
import { usePreferences } from './preferences-store';
import { bannersAllowed, byExpiryThenValue, expiryAlertCandidate, interestsFirst, isInterested } from '@/lib/preferences';
/** spendPace overrides the spend velocity calculated from Sarah's history (0.6–1.4; 1.0 = normal week). */
export type DemoControls = { dayOfWeek: number; hour: number; place: keyof typeof mockPlaces; hoursSinceLast: Record<ModelCategory, number>; spendPace: number };
const history = { ...defaultHoursSinceLast };
export const presets: Record<string, DemoControls> = {
  'Morning coffee': { dayOfWeek: 2, hour: 8, place: 'Library', hoursSinceLast: { ...history, coffee: 20 }, spendPace: 1 },
  'Lunch break': { dayOfWeek: 2, hour: 12, place: 'Student Union', hoursSinceLast: { ...history, food: 5 }, spendPace: 1 },
  'Sunday errands': { dayOfWeek: 0, hour: 15, place: 'Town Center', hoursSinceLast: { ...history, grocery: 150 }, spendPace: 1 },
  'Quiet night': { dayOfWeek: 3, hour: 21, place: 'Residence halls', hoursSinceLast: { ...history, food: 2 }, spendPace: 1 },
  'Late-night food': { dayOfWeek: 3, hour: 22, place: 'Residence halls', hoursSinceLast: { ...history, food: 4 }, spendPace: 1 },
  'Heading home': { dayOfWeek: 2, hour: 15.5, place: 'Library', hoursSinceLast: { ...history, food: 3 }, spendPace: 1 },
};
function useStateEngine() {
  const session = useRecommendationSession();
  const prefs = usePreferences();
  const [now, setNow] = useState<Date | null>(null);
  const [controls, setControls] = useState<DemoControls | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [gps, setGps] = useState<MapPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [ledger, setLedger] = useState<DailyNotifications | null>(null);
  const [banner, setBanner] = useState<(Offer & { scores?: RankedOffer['scores']; expiryAlert?: boolean }) | null>(null);
  const [connectedIds, setConnectedIds] = useState(() => [...offers.filter(o => partners.some(p => p === o.merchant)).map(o => o.id), ...examplePartnerIds]);
  const originalIds = useMemo(() => [...offers.filter(o => partners.some(p => p === o.merchant)).map(o => o.id), ...examplePartnerIds], []);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  /** In-app redemptions appended to Sarah's history (browser-local). */
  const [added, setAdded] = useState<Purchase[]>([]);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem('rewardwise-added-purchases') ?? '[]'); if (Array.isArray(v)) setAdded(v.filter((p): p is Purchase => p && typeof p.at === 'number' && typeof p.category === 'string' && typeof p.merchant === 'string')); } catch { /* defaults */ } }, []);
  const recordPurchase = (category: string, merchant: string) => {
    const t = Date.now();
    setAdded(prev => { const next = [...prev, { at: t, category, merchant }]; try { localStorage.setItem('rewardwise-added-purchases', JSON.stringify(next)); } catch { /* session only */ } return next; });
    setControls(c => c ? { ...c, hoursSinceLast: { ...c.hoursSinceLast, [category]: 0 } } : c);
    setNow(new Date(t));
  };
  useEffect(() => { const d = new Date(); setRedemptions(list => list.some(r => r.id.startsWith('seed-')) ? list : [...list, ...seedFromHistory(purchasesAsOf(d), [...offers, ...appCatalog], d.getTime())]); }, []);
  const [bankConnected, setBankConnected] = useState(true);
  const [bankPoints, setBankPoints] = useState<number>(BANK.startingPoints);
  const bank = useMemo(() => ({ connected: bankConnected, points: bankConnected ? bankPoints : 0, dollars: bankConnected ? bankDollars(bankPoints) : 0,
    offer: { id: BANK.id, merchant: BANK.name, emoji: '', category: 'Shopping', title: 'Use on your offers', points: bankPoints, value: bankDollars(bankPoints), minSpend: 0, expires: 'No expiry', reason: '', historyCategory: 'shopping' } as Offer }), [bankConnected, bankPoints]);
  /** Redeemed rewards spend their balance: 0 pts / $0 everywhere. */
  const [demoStart, setDemoStart] = useState<number | null>(null);
  useEffect(() => {
    let start = Number(localStorage.getItem(DEMO_START_KEY));
    if (!Number.isFinite(start) || start <= 0) { start = Date.now(); try { localStorage.setItem(DEMO_START_KEY, String(start)); } catch { /* session only */ } }
    setDemoStart(start);
  }, []);
  const nowMs = now?.getTime() ?? 0;
  /** Expiry is fixed from the first-open date and counts down live; before hydration, labels stay static. */
  const live = <T extends Offer>(list: readonly T[]) => demoStart === null ? list.map(o => ({ ...o, expired: false })) : list.map(o => withLiveExpiry(o, demoStart, nowMs));
  const expiredRewards = useMemo(() => live([...offers, ...appCatalog]).filter(o => o.expired && connectedIds.includes(o.id) && !redeemedIds.includes(o.id) && !isLocked(o)).map(o => ({ ...o, expiresAt: ("expiresAt" in o ? o.expiresAt : undefined) ?? nowMs })), [demoStart, nowMs, connectedIds, redeemedIds]);
  /** Redeemed rewards spend their balance: 0 pts / $0 everywhere; expired rewards leave Connect. */
  const connectedApps = useMemo(() => live([...offers, ...appCatalog]).filter(o => connectedIds.includes(o.id) && !o.expired).map(o => redeemedIds.includes(o.id) ? (({ expiresInDays: _e, ...rest }) => ({ ...rest, points: 0, value: 0 }))(o) as typeof o : o), [connectedIds, redeemedIds, demoStart, nowMs]);
  const availableRewards = useMemo(() => live([ ...(controls ? demoOffers : offers).filter(o => !originalIds.includes(o.id) || connectedIds.includes(o.id)), ...appCatalog.filter(o => connectedIds.includes(o.id)) ]).filter(o => !o.expired && !isLocked(o) && !redeemedIds.includes(o.id) && (!o.bankFunded || bankConnected)), [bankConnected, controls, connectedIds, originalIds, redeemedIds, demoStart, nowMs]);
  useEffect(() => {
    setNow(new Date());
    try {
      const saved = JSON.parse(localStorage.getItem('rewardwise-daily-notifications') ?? 'null');
      setLedger(saved && typeof saved.day === 'string' && Array.isArray(saved.rewardIds) ? { day: saved.day, rewardIds: saved.rewardIds.filter((id: unknown) => typeof id === 'string') } : { day: '', rewardIds: [] });
    } catch { setLedger({ day: '', rewardIds: [] }); }
    const clock = setInterval(() => setNow(new Date()), 60000);
    let midnight: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => { midnight = setTimeout(() => { const d = new Date(); setNow(d); setLedger({ day: localDay(d), rewardIds: [] }); scheduleMidnight(); }, msUntilMidnight(new Date()) + 1000); };
    scheduleMidnight();
    let active = true;
    const check = async () => {
      if (!navigator.permissions || !navigator.geolocation) return;
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state !== 'granted' || !active) return;
        navigator.geolocation.getCurrentPosition(position => {
          if (!active) return;
          setGps([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('Location checked · demo places use sample distances');
        }, () => { if (active) setLocationStatus('Location unavailable · using sample places'); }, { timeout: 10000, maximumAge: 60000 });
      } catch { /* Browser location is optional. */ }
    };
    void check();
    const locationTimer = setInterval(() => { void check(); }, 60000);
    return () => { active = false; clearInterval(clock); clearInterval(locationTimer); clearTimeout(midnight); };
  }, []);
  const hour = controls?.hour ?? now?.getHours() ?? 0;
  const learning = useLearning();
  const dayOfWeek = controls?.dayOfWeek ?? now?.getDay() ?? 0;
  /** Sarah's history (today's later entries hidden) plus in-app redemptions. */
  const purchases = useMemo(() => now ? [...purchasesAsOf(now), ...added].sort((a, b) => a.at - b.at) : [], [now, added]);
  const historyHours = useMemo(() => hoursSinceFromHistory(purchases, nowMs), [purchases, nowMs]);
  const weekly = useMemo(() => weeklyCounts(purchases, nowMs), [purchases, nowMs]);
  const deletedHours = { coffee: 168, food: 168, grocery: 168, online: 168, ride: 168, shopping: 168, travel: 168, fun: 168 };
  const currentHours = useMemo(() => controls?.hoursSinceLast ?? (prefs.historyDeleted ? deletedHours : historyHours), [controls, prefs.historyDeleted, historyHours]);
  /** Spend velocity from Sarah's history; the demo panel's Spending pace slider overrides it. */
  const historyVelocity = useMemo(() => spendVelocityFromHistory(purchases, nowMs), [purchases, nowMs]);
  const spendVelocity = controls ? (controls.spendPace ?? 1) : prefs.historyDeleted ? 1 : historyVelocity;
  const learnEvent = (category: string, kind: LearningKind) => {
    if (!isModelCategory(category) || !prefs.history) return;
    const hrs = (currentHours as Record<string, number>)[category] ?? 168;
    setLearning(learn(getLearning(), category, kind, { hour, dayOfWeek, hoursSinceLast: hrs, spendVelocity }));
    toast(`Got it. ${APP_NAME.charAt(0).toUpperCase() + APP_NAME.slice(1)} is learning your routine.`);
  };
  const ranked = useMemo(() => {
    if (!now || !prefs.history) return [];
    const rewards = availableRewards.map(reward => gps && reward.gps && !controls ? { ...reward, distanceMiles: gpsDistanceMiles(gps, reward.gps) } : reward);
    const scored = rankRewards(rewards, { hour, dayOfWeek, hoursSinceLast: currentHours, location: controls ? mockPlaces[controls.place] : undefined, ignoreLocation: !prefs.location, learned: learning, spendVelocity });
    return interestsFirst(scored, prefs.interests);
  }, [now, controls, gps, learning, availableRewards, prefs.history, prefs.location, prefs.interests, prefs.historyDeleted, hour, currentHours, dayOfWeek, spendVelocity]);
  /** Top pick only when it belongs to a selected interest. */
  const topPick = pickTop(ranked, hour, r => isInterested(r.category, prefs.interests), dayOfWeek);
  /** What Home and For You show: the strong top pick, or else the best option right now (never a notification). */
  const bestNow = topPick ?? pickBestNow(ranked, hour, r => isInterested(r.category, prefs.interests), dayOfWeek);
  // Re-evaluate on scoring changes, not on dismissal or ledger writes.
  useEffect(() => {
    if (!now || !ledger) return;
    if (!bannersAllowed(prefs, hour)) { setBanner(null); return; }
    const day = localDay(now);
    const shown = ledger.day === day ? ledger.rewardIds : [];
    let next: typeof banner = null;
    if (topPick && canNotify(topPick, ledger, day, { limit: prefs.limit, locationOn: prefs.location })) next = topPick;
    else if (prefs.expiry && shown.length < prefs.limit) {
      const alert = expiryAlertCandidate(availableRewards, shown);
      if (alert) next = { ...ranked.find(r => r.id === alert.id), ...alert, expiryAlert: true };
    }
    if (!next) return;
    const nextLedger = recordNotification(ledger, day, next.id);
    setLedger(nextLedger);
    try { localStorage.setItem('rewardwise-daily-notifications', JSON.stringify(nextLedger)); } catch { /* In-memory daily cap remains active. */ }
    setBanner(next);
  }, [ranked, Boolean(ledger), prefs.notify, prefs.quiet, prefs.limit, prefs.expiry, prefs.location, hour]);
  // A suggestion banner that no longer matches the moment (e.g. after switching demo presets) is cleared right away.
  useEffect(() => { setBanner(b => b && !b.expiryAlert && b.id !== topPick?.id ? null : b); }, [topPick?.id]);
  useEffect(() => {
    if (!banner) return;
    // Expiry alerts are reminders, not predictions, so ignoring one doesn't train the model.
    const timer = setTimeout(() => { setBanner(null); if (!banner.expiryAlert) learnEvent(banner.historyCategory, 'ignored'); }, BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [banner]);
  const unscored = useMemo(() => prefs.history ? interestsFirst(unscoredRewards(availableRewards), prefs.interests) : interestsFirst(byExpiryThenValue(availableRewards), prefs.interests), [availableRewards, prefs.history, prefs.interests]);
  return { ...session, prefs, topPick, bestNow, now, ranked, unscored, connectedIds, connectedApps,
    redemptions, learning, expiredRewards, demoStart, purchases, weekly, hour, dayOfWeek, currentHours, availableRewards, spendVelocity,
    resetDemo: () => {
      try { DEMO_STATE_KEYS.forEach(k => localStorage.removeItem(k)); localStorage.setItem(DEMO_START_KEY, String(Date.now())); sessionStorage.removeItem('rewardwise-skipped-categories'); } catch { /* ignore */ }
      window.location.reload();
    },
    skipCategory: (category: RewardCategory) => { session.skipCategory(category); learnEvent(category, 'skip'); },
    bank,
    redeemReward: (reward: Offer, bankPts = 0) => {
      if (redeemedIds.includes(reward.id)) return;
      const rankedMatch = ranked.find(r => r.id === reward.id)?.scores.match;
      const used = Math.min(bankPts, bankConnected ? bankPoints : 0);
      setRedeemedIds(ids => [...ids, reward.id]);
      learnEvent(reward.historyCategory, 'redeem');
      recordPurchase(reward.historyCategory, reward.merchant);
      if (used > 0) setBankPoints(p => p - used);
      setRedemptions(list => [{ id: `${reward.id}-${Date.now()}`, rewardId: reward.id, merchant: reward.merchant, title: reward.title, saved: reward.value + bankDollars(used), points: reward.points, rewardValue: reward.value, bankPts: used, date: new Date().toISOString(), category: reward.category, expiresInDays: reward.expiresInDays, match: rankedMatch, suggested: rankedMatch !== undefined }, ...list]);
      setBanner(current => current?.id === reward.id ? null : current);
    },
    /** Chase-only card purchase: points cover part or all of the total. */
    payWithBank: (total: number) => {
      const used = Math.min(bankConnected ? bankPoints : 0, Math.round(total * 100));
      if (used <= 0) return 0;
      setBankPoints(p => p - used);
      setRedemptions(list => [{ id: `chase-${Date.now()}`, rewardId: `chase-${Date.now()}`, merchant: BANK.name, title: 'Card purchase', saved: bankDollars(used), points: 0, rewardValue: 0, bankPts: used, date: new Date().toISOString(), category: 'Shopping', suggested: false }, ...list]);
      return used;
    },
    /** Expired code: points return, the reward becomes available again. */
    returnReward: (id: string) => {
      setRedeemedIds(ids => ids.filter(x => x !== id));
      setRedemptions(list => { const i = list.findIndex(r => r.rewardId === id); return i < 0 ? list : [...list.slice(0, i), ...list.slice(i + 1)]; });
    },
    connectApp: (id: string) => id === BANK.id ? setBankConnected(true) : setConnectedIds(ids => updateConnections(ids, id, true)),
    disconnectApp: (id: string) => { if (id === BANK.id) { setBankConnected(false); return; } setConnectedIds(ids => updateConnections(ids, id, false)); setBanner(current => current?.id === id ? null : current); },
    banner, dismissBanner: () => setBanner(null), panelOpen, setPanelOpen, controls, setControls, locationStatus,
    openPanel: () => { setControls(current => current ?? { dayOfWeek: now?.getDay() ?? 2, hour: Math.min(23, Math.max(7, Math.floor((now?.getHours() ?? 8) * 2) / 2)), place: 'Library', hoursSinceLast: { coffee: historyHours.coffee, food: historyHours.food, grocery: historyHours.grocery, online: historyHours.online, ride: historyHours.ride }, spendPace: Math.round(Math.min(1.4, Math.max(0.6, historyVelocity)) * 20) / 20 }); setPanelOpen(true); },
  };
}
type Engine = ReturnType<typeof useStateEngine>;
// Keep one context instance across hot reloads so the root provider and pages never disagree.
const contextStore = globalThis as typeof globalThis & { __rewardEngineContext?: ReactContext<Engine | null> };
const Context = (contextStore.__rewardEngineContext ??= createContext<Engine | null>(null));
export function RecommendationProvider({ children }: { children: ReactNode }) {
  const value = useStateEngine();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useRewardEngine() {
  const value = useContext(Context);
  if (!value) throw new Error('Recommendations require RecommendationProvider');
  return value;
}
