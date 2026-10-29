import { BANK } from "@/lib/bank";
import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Chip, ScreenHeader } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { APP_NAME } from "@/lib/app-config";
import type { Redemption } from "@/lib/redemption";
import { byCategory, byScope, isThisMonth, isThisWeek, paidWith, rescued, smartPicks, stats, topMerchants, toSavingsCategory, weekly } from "@/lib/savings";
import { matchLabel } from "@/lib/model";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: `Savings — ${APP_NAME_TITLE}` },
      { name: "description", content: "See how much you saved, rewards rescued before expiring, and your full redemption history." },
      { property: "og:title", content: `Savings — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "See how much you saved and your full redemption history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Savings,
});

const money = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Savings() {
  const { redemptions, expiredRewards } = useRewardEngine();
  const [scope, setScope] = useState<"month" | "all">("month");
  const [filter, setFilter] = useState<"all" | "week" | "month">("all");
  const [receipt, setReceipt] = useState<Redemption | null>(null);
  const now = useMemo(() => new Date(), [redemptions, expiredRewards]);
  const nowMs = now.getTime();
  const sorted = useMemo(() => [...redemptions].sort((a, b) => b.date.localeCompare(a.date)), [redemptions]);
  const scoped = byScope(sorted, scope, now);
  const s = stats(scoped);
  const weeks = weekly(sorted, now);
  const maxWeek = Math.max(1, ...weeks);
  const cats = byCategory(scoped);
  const maxCat = Math.max(1, ...cats.map(c => c.amount));
  const tops = topMerchants(scoped);
  const picks = smartPicks(sorted);
  const history = sorted.filter(r => filter === "all" || (filter === "week" ? isThisWeek(r, now) : isThisMonth(r, now)));
  const expired = [...expiredRewards].filter(o => o.expiresAt !== undefined && (filter === "all" || (filter === "week" ? nowMs - o.expiresAt! < 7 * 86_400_000 : new Date(o.expiresAt!).getMonth() === now.getMonth() && new Date(o.expiresAt!).getFullYear() === now.getFullYear()))).sort((a, b) => b.expiresAt! - a.expiresAt!);
  const scopeLabel = scope === "month" ? "This month" : "All time";

  return (
    <AppShell>
      <ScreenHeader title="Savings" subtitle="What your rewards have saved you" />
      <div role="tablist" aria-label="Time range" className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
        {(["month", "all"] as const).map(v => (
          <button key={v} role="tab" aria-selected={scope === v} onClick={() => setScope(v)} className={`rounded-full py-2 ${scope === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{v === "month" ? "This month" : "All time"}</button>
        ))}
      </div>

      <section className="bg-ink mt-4 rounded-3xl p-6">
        <p className="text-sm opacity-80">Rescued from expiring · {scopeLabel}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{money(rescued(scoped))}</p>
        <p className="text-sm font-semibold">used before it expired</p>
        <p className="mt-1 text-xs opacity-70">Rewards you used within 7 days of expiring.</p>
      </section>

      <h2 className="mt-6 mb-2 text-sm font-bold">{scopeLabel}</h2>
      <div className="grid grid-cols-3 gap-2">
        {[["Saved", money(s.saved)], ["Points used", s.points.toLocaleString()], ["Redeemed", String(s.count)]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-3"><p className="text-lg font-extrabold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
        ))}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold">Savings over time</h2>
      <div className="rounded-3xl border bg-card p-4">
        <div className="flex h-32 items-end gap-2">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1 h-full">
              <span className="text-[10px] text-muted-foreground">{w ? `$${Math.round(w)}` : ""}</span>
              <div aria-label={`Week ${i + 1}: ${money(w)}`} className={`w-full rounded-t-md ${i === weeks.length - 1 ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ height: `${(w / maxWeek) * 100}%`, minHeight: 2 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">{weeks.map((_, i) => <span key={i} className={`flex-1 text-center ${i === weeks.length - 1 ? "font-bold text-primary" : ""}`}>{i === weeks.length - 1 ? "Now" : `-${weeks.length - 1 - i}w`}</span>)}</div>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold">Where you saved · {scopeLabel}</h2>
      <div className="space-y-3 rounded-3xl border bg-card p-4">
        {cats.map(c => (
          <div key={c.category}>
            <div className="flex justify-between text-sm"><span className="font-semibold">{c.category}</span><span className="font-bold">{money(c.amount)}</span></div>
            <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(c.amount / maxCat) * 100}%` }} /></div>
          </div>
        ))}
        {tops.length > 0 && <div className="border-t pt-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Top merchants</p>
          {tops.map((t, i) => <div key={t.merchant} className="flex items-center gap-3 py-1"><span className="w-4 text-xs font-bold">{i + 1}</span><BrandLogo name={t.merchant} /><span className="flex-1 text-sm font-semibold">{t.merchant}</span><span className="text-sm font-bold">{money(t.amount)}</span></div>)}
        </div>}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold">Smart picks</h2>
      <div className="rounded-3xl border bg-card p-4">
        <p className="text-sm font-semibold">{picks.suggested} of {picks.total} rewards came from {APP_NAME} suggestions</p>
        <p className="mt-1 text-xs text-muted-foreground">Average match of redeemed picks: <span className="font-bold text-foreground">{picks.suggested ? `${matchLabel(picks.avgMatch)} · ${Math.round(picks.avgMatch * 100)}%` : "—"}</span></p>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold">History</h2>
      <div className="mb-2 flex gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
        <Chip active={filter === "week"} onClick={() => setFilter("week")}>This week</Chip>
        <Chip active={filter === "month"} onClick={() => setFilter("month")}>This month</Chip>
      </div>
      {expired.length > 0 && <div aria-label="Expired rewards" className="mb-3 divide-y rounded-3xl border border-destructive/30 bg-card px-4">
        {expired.map(o => (
          <div key={o.id} className="flex items-center gap-3 py-3">
            <BrandLogo name={o.merchant} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{o.merchant}</p>
              <p className="truncate text-xs text-muted-foreground">{fmtDate(new Date(o.expiresAt!).toISOString())} · {o.title}</p>
            </div>
            <span className="text-sm font-bold text-destructive">Expired · ${o.value.toFixed(2)} lost</span>
          </div>
        ))}
      </div>}
      {history.length === 0 ? <p className="text-sm text-muted-foreground">No redemptions in this period.</p> :
        <div className="divide-y rounded-3xl border bg-card px-4">
          {history.map(r => (
            <button key={r.id} onClick={() => setReceipt(r)} className="flex w-full items-center gap-3 py-3 text-left">
              <BrandLogo name={r.merchant} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.merchant}</p>
                <p className="truncate text-xs text-muted-foreground">{fmtDate(r.date)} · {paidWith(r)}</p>
              </div>
              <span className="text-sm font-bold text-success">{money(r.saved)}</span>
            </button>
          ))}
        </div>}

      <Dialog open={!!receipt} onOpenChange={o => !o && setReceipt(null)}>
        <DialogContent className="max-w-sm">
          {receipt && <>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><BrandLogo name={receipt.merchant} />Receipt</DialogTitle></DialogHeader>
            <dl className="space-y-2 text-sm">
              {[
                ["Merchant", receipt.merchant],
                ["Reward", receipt.title],
                ["Category", toSavingsCategory(receipt.category)],
                ["Date", new Date(receipt.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })],
                ["Merchant points", receipt.points ? `${receipt.points.toLocaleString()} pts` : "—"],
                ["Reward value", money(receipt.rewardValue ?? receipt.saved)],
                [BANK.points, receipt.bankPts ? `${receipt.bankPts.toLocaleString()} pts · ${money(receipt.bankPts / 100)}` : "—"],
                ["Suggested by " + APP_NAME, receipt.suggested && receipt.match !== undefined ? `Yes · ${matchLabel(receipt.match)}` : "No"],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
              <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">You saved</dt><dd className="font-extrabold text-success">{money(receipt.saved)}</dd></div>
            </dl>
          </>}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
