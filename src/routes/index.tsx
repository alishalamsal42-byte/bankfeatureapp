import { APP_NAME_TITLE } from "@/lib/app-config";
// ============= Full file contents =============

import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, LoaderCircle } from "lucide-react";
import { APP_NAME } from "@/lib/app-config";
import { AppShell, useDemoTitleTap } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { user, merchantWebsite, closestProgress, isLocked } from "@/lib/rewards";
import { useEffect, useState } from "react";
import { useRecommendationState } from "@/hooks/use-recommendations";
import { matchLabel } from "@/lib/model";
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
  const { bestNow, banner, connectedApps, prefs, bank } = useRecommendationState();
  const totalValue = connectionTotal(connectedApps) + bank.dollars;
  const totalPoints = connectedApps.reduce((sum, o) => sum + (o.points || 0), 0) + bank.points;
  const expiring = connectedApps.filter(o => !isLocked(o) && o.expiresInDays !== undefined && Number.isFinite(o.expiresInDays) && o.expiresInDays <= 3).sort((a, b) => (a.expiresInDays ?? 0) - (b.expiresInDays ?? 0)).slice(0, 3);
  const nearest = closestProgress(connectedApps);
  const [handoff, setHandoff] = useState<string | null>(null);
  const top = bestNow;
  const titleTap = useDemoTitleTap();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <AppShell>
      {/* Bank app frame: this prototype is the Rewards section of the bank's app. */}
      <section aria-label="Your bank" className="-mx-5 -mt-1 rounded-b-3xl bg-[#0b4ea2] px-5 pt-3 pb-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{greeting()}</p>
            <h1><Button variant="ghost" className="h-auto p-0 text-xl font-bold text-white hover:bg-transparent hover:text-white" onClick={titleTap}>{user.name}</Button></h1>
          </div>
          <Button variant="ghost" size="icon" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)} className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25 hover:text-white"><Bell className="h-5 w-5" /></Button>
        </div>
        <nav aria-label="Bank sections" className="mt-4 flex gap-5 text-sm font-semibold">
          {["Accounts", "Pay & transfer"].map(tab => <button key={tab} type="button" onClick={() => toast("This demo shows the Rewards section.")} className="pb-1.5 opacity-70">{tab}</button>)}
          <span aria-current="page" className="border-b-2 border-white pb-1.5">Rewards</span>
        </nav>
        <div className="mt-4 rounded-2xl bg-white p-4 text-foreground">
          <div className="flex items-center justify-between text-sm"><span className="font-semibold">{BANK.card}</span><span className="text-xs text-muted-foreground">Checking</span></div>
          <p className="mt-1 text-2xl font-extrabold">${BANK.checking.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground">Available balance</p>
          <Link to="/bank-rewards" className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm"><span>{BANK.points}</span><span className="font-bold text-points">{bank.points.toLocaleString()} pts · ${bank.dollars.toFixed(2)}</span></Link>
        </div>
      </section>
      {notificationsOpen && <div className="mt-3 rounded-2xl border bg-card p-4 text-sm">
        {banner ? <div><p className="font-bold">{banner.merchant} · {banner.title}</p><Button asChild className="mt-2"><Link to="/redeem" search={{ id: banner.id }}>View reward</Link></Button></div> : <p className="text-muted-foreground">No reward alerts right now</p>}
      </div>}

      <div className="bg-ink relative mt-5 rounded-3xl p-6">
        <Link to="/smart-match" aria-label="Rewards available, view all" className="absolute inset-0 rounded-3xl" />
        <div className="flex items-center justify-between"><p className="text-sm opacity-80">All your rewards</p><span aria-hidden className="text-xs font-semibold opacity-80">View all →</span></div>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">${totalValue.toFixed(2)}</p>
        <div className="mt-1 flex items-center justify-between"><p className="text-sm opacity-70">{totalPoints.toLocaleString()} pts</p><Link to="/savings" className="relative z-10 text-xs font-semibold underline-offset-2 hover:underline">View savings →</Link></div>
      </div>

      <p className="mt-6 text-sm font-semibold text-muted-foreground">Right now (AI pick)</p>
      {top && <section aria-label="AI pick" className="mt-2 rounded-3xl border-2 border-primary bg-card p-4">
        <div className="flex items-center gap-3">
          <BrandLogo name={top.merchant} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{top.title}</p>
            <p className="text-sm text-muted-foreground">{top.merchant}{top.online ? " · Online" : prefs.location ? ` · ${Number((top.distanceMiles ?? 0).toFixed(1))} mi away` : ""}</p>
          </div>
          <span className="bg-peach shrink-0 rounded-full px-3 py-1 text-xs font-semibold">{matchLabel(top.scores.match)}</span>
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
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{o.title}</p><p className="text-xs text-muted-foreground">{o.merchant} · {o.expiresInDays === 0 ? "Expires today" : o.expiresInDays === 1 ? "Expires tomorrow" : `Expires in ${o.expiresInDays} days`}</p></div>
            <span className="text-sm font-bold">${o.value.toFixed(2)}</span>
          </Link>)}
        </section>
      </>}

      {nearest && <section aria-label="Reward progress" className="mt-4 mb-4 rounded-3xl border bg-card p-5">
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
        <p className="mt-3 text-sm">Your next order could unlock it</p>
        <Button variant="outline" className="mt-2 w-full rounded-2xl" onClick={() => setHandoff(nearest.merchant)}>Order on {nearest.merchant} →</Button>
      </section>}
      {handoff && <MerchantHandoff merchant={handoff} onClose={() => setHandoff(null)} />}

    </AppShell>
  );
}
