import { APP_NAME_TITLE } from "@/lib/app-config";
// ============= Full file contents =============

import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, LoaderCircle, Lock, Send, Camera, Receipt, ArrowLeftRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { accounts, categoryLabel, recentTransactions } from "@/lib/banking";
import { APP_NAME } from "@/lib/app-config";
import { AppShell, useDemoTitleTap } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { user, merchantWebsite, closestProgress, isLocked, expiryLabel } from "@/lib/rewards";
import { useEffect, useState } from "react";
import { useRecommendationState } from "@/hooks/use-recommendations";
import { connectionTotal } from "@/lib/connection-catalog";
import { Button } from "@/components/ui/button";
import { MerchantHandoff } from "@/components/MerchantHandoff";
import { BANK } from "@/lib/bank";
import { toast } from "sonner";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME_TITLE} — Make every reward count` },
      { name: "description", content: "See your rewards balance and the benefits that matter right now." },
      { property: "og:title", content: `${APP_NAME_TITLE} — Make every reward count` },
      { property: "og:description", content: "See your rewards balance and the benefits that matter right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const { bestNow, banner, connectedApps, prefs, bank, purchases, now } = useRecommendationState();
  const totalValue = connectionTotal(connectedApps) + bank.dollars;
  const totalPoints = bank.points + connectedApps.reduce((sum, offer) => sum + offer.points, 0);
  const expiring = connectedApps.filter(o => !isLocked(o) && o.expiresInDays !== undefined && Number.isFinite(o.expiresInDays) && o.expiresInDays <= 3).sort((a, b) => (a.expiresInDays ?? 0) - (b.expiresInDays ?? 0)).slice(0, 3);
  const nearest = closestProgress(connectedApps);
  const [handoff, setHandoff] = useState<string | null>(null);
  const top = bestNow;
  const titleTap = useDemoTitleTap();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  useEffect(() => { try { setLocked(localStorage.getItem("bank-card-locked") === "1"); } catch { /* default */ } }, []);
  const toggleLock = (on: boolean) => { setLocked(on); try { localStorage.setItem("bank-card-locked", on ? "1" : "0"); } catch { /* session only */ } toast(on ? "Card locked. New purchases will be declined." : "Card unlocked."); };
  const transactions = now ? recentTransactions(purchases, now.getTime(), 5) : [];
  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <AppShell>
      {/* Bank app home: accounts first, with the AI rewards feature inside Benefits & offers. */}
      <section aria-label="Your bank" className="-mx-5 -mt-1 bg-[#0b4ea2] px-5 pt-3 pb-14 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{greeting()}</p>
            <h1><Button variant="ghost" className="h-auto p-0 text-xl font-bold text-white hover:bg-transparent hover:text-white" onClick={titleTap}>{user.name}</Button></h1>
          </div>
          <Button variant="ghost" size="icon" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)} className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25 hover:text-white"><Bell className="h-5 w-5" /></Button>
        </div>
      </section>
      {notificationsOpen && <div className="relative z-10 -mt-12 mb-14 rounded-2xl border bg-card p-4 text-sm">
        {banner ? <div><p className="font-bold">{banner.merchant} · {banner.title}</p><Button asChild className="mt-2"><Link to="/redeem" search={{ id: banner.id }}>View reward</Link></Button></div> : <p className="text-muted-foreground">No reward alerts right now</p>}
      </div>}

      <section aria-label="Bank accounts" className="relative -mt-10 rounded-3xl border bg-card shadow-soft">
        <p className="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank accounts</p>
        {[accounts.checking, accounts.savings].map(a => <Link key={a.last4} to="/pay" className="flex items-center justify-between border-b px-4 py-3 last:border-0">
          <span><span className="block text-sm font-semibold">{a.name} (…{a.last4})</span><span className="text-xs text-muted-foreground">Available balance</span></span>
          <span className="text-lg font-bold tabular-nums">{money(a.balance)}</span>
        </Link>)}
      </section>

      <section aria-label="Credit card" className="mt-4 rounded-3xl border bg-card p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Credit card</p>
        <div className="mt-2 flex items-center justify-between">
          <span><span className="block text-sm font-semibold">{accounts.card.name} (…{accounts.card.last4})</span><span className="text-xs text-muted-foreground">Current balance</span></span>
          <span className="text-lg font-bold tabular-nums">{money(accounts.card.balance)}</span>
        </div>
        <Link to="/bank-rewards" className="mt-3 flex items-center justify-between rounded-2xl bg-muted px-3 py-2.5 text-sm">
          <span className="min-w-0"><span className="block font-semibold">{BANK.points} · Use on offers picked for you</span></span>
          <span className="shrink-0 text-right font-bold text-points">{bank.points.toLocaleString()} pts<span className="block">{money(bank.dollars)}</span></span>
        </Link>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2"><Lock className="h-4 w-4" />{locked ? <span className="font-semibold text-destructive">Card locked</span> : "Lock card"}</span>
          <Switch checked={locked} onCheckedChange={toggleLock} aria-label="Lock card" />
        </div>
      </section>

      <section aria-label="All your rewards" className="mt-4 rounded-3xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-bold">All your rewards</h2><Link to="/smart-match" className="text-sm font-semibold text-primary">View all →</Link></div>
        <p className="mt-3 text-3xl font-extrabold text-points">{money(totalValue)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{totalPoints.toLocaleString()} total points</p>
        <Link to="/savings" className="mt-3 inline-block text-sm font-semibold text-primary">View savings →</Link>
      </section>

      <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Quick actions">
        {quickActions.map(a => <Link key={a.label} to="/pay" className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card px-1 py-3 text-center text-[11px] font-semibold"><a.icon className="h-5 w-5 text-[#0b4ea2]" />{a.label}</Link>)}
      </div>

      <div className="mt-6 flex items-center justify-between"><h2 className="text-base font-bold">Benefits &amp; offers</h2><Link to="/smart-match" className="text-sm font-semibold text-primary">{money(totalValue)} in rewards →</Link></div>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">Right now (AI pick)</p>
      {top && <section aria-label="AI pick" className="mt-2 rounded-3xl border-2 border-primary bg-card p-4">
        <div className="flex items-center gap-3">
          <BrandLogo name={top.merchant} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{top.title}</p>
            <p className="text-sm text-muted-foreground">{top.merchant}{top.online ? " · Online" : prefs.location ? ` · ${Number((top.distanceMiles ?? 0).toFixed(1))} mi away` : ""}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button asChild className="h-11 flex-1 rounded-2xl"><Link to="/redeem" search={{ id: top.id }}>Pay with rewards</Link></Button>
          <Link to="/for-you" className="text-sm font-semibold text-primary">See why →</Link>
        </div>
      </section>}

      {expiring.length > 0 && <>
        <p className="mt-6 text-sm font-semibold text-muted-foreground">Use it or lose it</p>
        <section className="mt-2 divide-y rounded-3xl border bg-card px-4">
          {expiring.map(o => <Link key={o.id} to="/redeem" search={{ id: o.id }} className="flex items-center gap-3 py-3">
            <BrandLogo name={o.merchant} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{o.title}</p><p className="text-xs text-muted-foreground">{o.merchant} · {expiryLabel(o)}</p></div>
            <span className="text-sm font-bold">${o.value.toFixed(2)}</span>
          </Link>)}
        </section>
      </>}

      {nearest && <section aria-label="Reward progress" className="mt-4 rounded-3xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <BrandLogo name={nearest.merchant} />
          <div className="flex-1">
            <p className="font-bold">A few points away from a free {nearest.reward}</p>
            <p className="text-sm text-muted-foreground">{nearest.merchant} · {nearest.toGo.toLocaleString()} pts to go</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-ember h-full rounded-full" style={{ width: `${Math.min(100, (nearest.balance / nearest.goal) * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{nearest.balance.toLocaleString()} / {nearest.goal.toLocaleString()} pts</p>
        <Button variant="outline" className="mt-3 w-full rounded-2xl" onClick={() => setHandoff(nearest.merchant)}>Order on {nearest.merchant} →</Button>
      </section>}

      {transactions.length > 0 && <>
        <div className="mt-6 flex items-center justify-between"><h2 className="text-base font-bold">Recent transactions</h2><Link to="/plan" className="text-sm font-semibold text-primary">Spending →</Link></div>
        <section aria-label="Recent transactions" className="mt-2 mb-4 divide-y rounded-3xl border bg-card px-4">
          {transactions.map(t => <div key={t.id} className="flex items-center gap-3 py-3">
            <BrandLogo name={t.merchant} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{t.merchant}</p><p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString(undefined, { weekday: "short", hour: "numeric" })} · {categoryLabel(t.category)}</p></div>
            <span className="text-right text-sm"><span className="block font-bold tabular-nums">−{money(t.amount)}</span><span className="block text-xs font-semibold text-points">+{t.points} pts</span></span>
          </div>)}
        </section>
      </>}
      {handoff && <MerchantHandoff merchant={handoff} onClose={() => setHandoff(null)} />}
    </AppShell>
  );
}

const quickActions = [
  { label: "Send money", icon: Send },
  { label: "Deposit checks", icon: Camera },
  { label: "Pay bills", icon: Receipt },
  { label: "Transfer", icon: ArrowLeftRight },
] as const;
