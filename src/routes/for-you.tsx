import { offerCostShort } from "@/lib/rewards";
import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { useRecommendationState } from "@/hooks/use-recommendations";
import { closedLabel, hoursLabel, isValidAt, matchLabel, pickForNow, pickTop } from "@/lib/model";
import { BrandLogo } from "@/components/BrandLogo";
import { TopRewardPick } from "@/components/TopRewardPick";
import { Button } from "@/components/ui/button";
import { pickedForLabel } from "@/lib/pick-context";
import { spendPaceLabel } from "@/lib/sarah-history";
import { byExpiryThenValue, isInterested } from "@/lib/preferences";

export const Route = createFileRoute("/for-you")({
  head: () => ({
    meta: [
      { title: `For You — ${APP_NAME_TITLE}` },
      { name: "description", content: "Personalized offers ranked by time, place and your routine." },
      { property: "og:title", content: `For You — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Personalized offers ranked by time, place and your routine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForYou,
});

const cats = ["All", "Coffee", "Food", "Grocery", "Online", "Shopping", "Travel", "Fun"] as const;

function ForYou() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const { ranked, unscored, skippedCategories, skipCategory, now, controls, prefs, dayOfWeek, spendVelocity } = useRecommendationState();
  const hour = controls?.hour ?? (now ? now.getHours() + now.getMinutes() / 60 : 0);
  const pickedFor = controls ? pickedForLabel(controls.dayOfWeek, controls.hour, controls.place) : now ? pickedForLabel(now.getDay(), now.getHours() + now.getMinutes() / 60) : "Picked for your time and routine";
  const list = ranked.filter((o) => cat === "All" || o.category === cat);
  const strongTop = pickTop(list, hour, o => isInterested(o.category, prefs.interests), dayOfWeek);
  // Always show a pick when one is reachable: the strong top pick, or else the best option right now.
  const top = prefs.history ? pickForNow(list, hour, o => isInterested(o.category, prefs.interests), dayOfWeek) : undefined;
  const noPick = prefs.history && !top && list.length > 0;
  const more = noPick ? byExpiryThenValue([...list, ...unscored.filter(o => cat === "All" || o.category === cat)]).map(o => ({ ...o, scores: undefined })) : [...list.filter(o => o !== top).map(o => ({ ...o, scores: o.scores })), ...unscored.filter(o => cat === "All" || o.category === cat).map(o => ({ ...o, scores: undefined }))];
  const skipped = skippedCategories[skippedCategories.length - 1];
  return (
    <AppShell>
      <ScreenHeader title="Benefits & offers" subtitle={pickedFor} />
      {prefs.history && now && <p aria-label="Spending pace" className="-mt-2 mb-4 text-xs text-muted-foreground">Spending pace: {spendPaceLabel(spendVelocity)}</p>}
      <div className="mb-4 grid grid-cols-2 gap-2 text-sm font-semibold">
        <Link to="/bank-rewards" className="rounded-2xl border bg-card px-3 py-2.5">Credit points →<span className="block text-xs font-normal text-muted-foreground">Use on your offers</span></Link>
        <Link to="/smart-match" className="rounded-2xl border bg-card px-3 py-2.5">Connected programs →<span className="block text-xs font-normal text-muted-foreground">Starbucks, Chick-fil-A…</span></Link>
      </div>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5" aria-label="Reward categories">
        {cats.map((c) => <Button variant={c === cat ? "default" : "outline"} size="sm" aria-pressed={c === cat} className="shrink-0 rounded-full" key={c} onClick={() => setCat(c)}>{c}</Button>)}
      </div>
      {!prefs.history && <p role="note" className="mb-4 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Personalized picks are off. Turn on purchase history in Preferences.</p>}
      {top && <TopRewardPick isStrong={Boolean(strongTop)} showLocation={prefs.location} reward={top} hour={Math.floor(hour)} onSkip={() => skipCategory(top.historyCategory)} />}
      {noPick && <section aria-label="No top pick" className="shadow-soft rounded-3xl bg-card p-5">
        <p className="font-bold">No offers available to use right now</p>
        <p className="mt-1 text-sm text-muted-foreground">Your offers are below, with their available hours.</p>
      </section>}
      {more.length > 0 && <h2 className="mt-5 mb-2 text-sm font-bold">{noPick ? "Your rewards" : "More for you"}</h2>}
      <div className="divide-y border-t">
        {more.map((o) => (
          <div key={o.id} aria-label={`${o.merchant} reward`} className="py-4">
            <div className="flex items-center gap-3">
              <BrandLogo name={o.merchant} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{o.merchant}</p>
                <p className="text-xs text-muted-foreground">{o.title}</p>
                <p className="mt-1 text-xs font-bold text-points">{offerCostShort(o)}</p>
              </div>
              <Button asChild size="sm"><Link to="/redeem" search={{ id: o.id, useBank: o.bankFunded || undefined }}>{o.bankFunded ? "Use points" : "Get"}</Link></Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="min-w-0">{o.online ? "Online" : prefs.location ? `${Number((o.distanceMiles ?? 0).toFixed(2))} mi away` : ""}</span>
              {closedLabel(o, dayOfWeek, hour) ? <span className="shrink-0 font-semibold text-warning">{closedLabel(o, dayOfWeek, hour)}</span> : o.validHours && !isValidAt(o, hour) && <span className="shrink-0 font-semibold text-warning">{hoursLabel(o.validHours)}</span>}
              {o.scores && <span className={`shrink-0 font-bold ${o.scores.match >= 0.10 ? "text-success" : "text-muted-foreground"}`}>{matchLabel(o.scores.match)}</span>}
            </div>
          </div>
        ))}
      </div>
      {ranked.length === 0 && more.length === 0 && <p className="mt-5 text-sm text-muted-foreground">Finding rewards…</p>}
      {skipped && <p role="status" className="mt-5 text-xs text-muted-foreground">You skipped {skipped}, so you’ll see it less today.</p>}
    </AppShell>
  );
}
