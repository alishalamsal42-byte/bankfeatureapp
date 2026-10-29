import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { bankDollars, bankOfferOrder, paymentSplit, typicalPurchase, BANK } from "@/lib/bank";

export const Route = createFileRoute("/bank-rewards")({
  head: () => ({
    meta: [
      { title: `Bank points — ${APP_NAME_TITLE}` },
      { name: "description", content: "Spend your Bank points on offers picked for you, ranked by your time and routine." },
      { property: "og:title", content: `Bank points — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Spend your Bank points on offers picked for you, ranked by your time and routine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BankRewards,
});

function BankRewards() {
  const { bank, bestNow, topPick, ranked, unscored, redemptions, now } = useRewardEngine();
  const offers = bankOfferOrder(bestNow, ranked, unscored);
  const history = redemptions.filter(r => (r.bankPts ?? 0) > 0).map(r => ({ ...r, bankPts: r.bankPts ?? 0 })).slice(0, 5);

  if (!bank.connected) return (
    <AppShell>
      <ScreenHeader title={`${BANK.name} points`} subtitle={BANK.card} />
      <p className="rounded-3xl border bg-card p-5 text-sm text-muted-foreground">Your card isn’t connected. <Link to="/smart-match" className="font-semibold text-primary">Connect it on the Connect page</Link> to use your points.</p>
    </AppShell>
  );

  return (
    <AppShell>
      <ScreenHeader title={`${BANK.name} points`} subtitle={`${BANK.card} · 1 pt = 1¢`} />
      <section aria-label="Points balance" className="bg-ink rounded-3xl p-6">
        <div className="flex items-center gap-3"><BrandLogo name={BANK.name} /><p className="text-sm opacity-80">Your {BANK.points}</p></div>
        <p className="mt-3 text-4xl font-extrabold">{bank.points.toLocaleString()} pts</p>
        <p className="mt-1 text-lg font-semibold text-success">≈ ${bank.dollars.toFixed(2)}</p>
      </section>

      <h2 className="mt-6 mb-3 text-base font-bold">Use your points on offers picked for you</h2>
      <div className="divide-y border-y">
        {offers.map(offer => {
          const total = typicalPurchase(offer);
          const split = paymentSplit(total, offer.value, bank.points, true);
          return (
            <article key={offer.id} aria-label={`${offer.merchant} offer`} className="py-4">
              {offer.id === bestNow?.id && <p className="mb-2 text-xs font-bold text-success">{topPick ? "AI top pick" : "Good option right now"}</p>}
              <div className="flex items-center gap-3">
                <BrandLogo name={offer.merchant} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{offer.merchant}</p>
                  <p className="text-sm text-muted-foreground">{offer.title}</p>
                  <p className="mt-1 text-xs font-semibold text-points">Typical ${total.toFixed(2)} order: ${split.rewardCovered.toFixed(2)} reward + {split.bankPts.toLocaleString()} {BANK.points} = ${split.charged.toFixed(2)} out of pocket</p>
                </div>
                <Button asChild size="sm" className="shrink-0"><Link to="/redeem" search={{ id: offer.id, useBank: true }}>Use points</Link></Button>
              </div>
            </article>
          );
        })}
      </div>
      {offers.length === 0 && <p role="status" className="mt-4 text-sm text-muted-foreground">{now ? "No offers available right now." : "Finding your offers…"}</p>}

      {history.length > 0 && <>
        <h2 className="mt-6 mb-2 text-sm font-bold">Recent points activity</h2>
        <div className="divide-y rounded-3xl border bg-card px-4">
          {history.map(r => <div key={r.id} className="flex items-center gap-3 py-3">
            <BrandLogo name={r.merchant} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{r.merchant}</p><p className="text-xs text-muted-foreground">{r.title} · {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p></div>
            <p className="shrink-0 text-right text-sm"><span className="block font-bold text-success">${bankDollars(r.bankPts).toFixed(2)}</span><span className="block text-xs text-muted-foreground">{r.bankPts.toLocaleString()} pts</span></p>
          </div>)}
        </div>
      </>}
    </AppShell>
  );
}
