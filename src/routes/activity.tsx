import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { BANK } from "@/lib/bank";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: `Activity — ${APP_NAME_TITLE}` },
      { name: "description", content: "Your redeemed rewards and how much you saved." },
      { property: "og:title", content: `Activity — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Your redeemed rewards and how much you saved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Activity,
});

function Activity() {
  const { redemptions } = useRewardEngine();
  const total = redemptions.reduce((s, r) => s + r.saved, 0);
  return (
    <AppShell>
      <ScreenHeader title="Activity" subtitle="Your redemptions and savings" />
      <section className="bg-ink rounded-3xl p-6 text-center">
        <p className="text-sm opacity-70">Total saved</p>
        <p aria-label="Total saved" className="mt-1 text-4xl font-extrabold">${total.toFixed(2)}</p>
        <p className="mt-1 text-sm opacity-80">{redemptions.length} {redemptions.length === 1 ? "reward" : "rewards"} used</p>
      </section>
      {redemptions.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">No redemptions yet. Redeem a reward and it will show up here.</p> :
        <div className="mt-5 divide-y rounded-3xl border bg-card px-4">
          {redemptions.map(r => (
            <div key={r.id} className="flex items-center gap-3 py-3">
              <BrandLogo name={r.merchant} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.merchant}</p>
                <p className="text-xs text-muted-foreground">{r.bankPts ? `$${(r.rewardValue ?? 0).toFixed(2)} ${r.title.toLowerCase()} + ${r.bankPts.toLocaleString()} ${BANK.points}` : r.title} · {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <span className="text-sm font-bold text-success">${r.saved.toFixed(2)} saved</span>
            </div>
          ))}
        </div>}
    </AppShell>
  );
}
