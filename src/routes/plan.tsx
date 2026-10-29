import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Progress, ScreenHeader } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { categoryLabel, spendingSummary } from "@/lib/banking";
import { spendPaceLabel } from "@/lib/sarah-history";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: `Plan & track — ${APP_NAME_TITLE}` },
      { name: "description", content: "Your spending this week, by category, plus your credit score and autosave." },
      { property: "og:title", content: `Plan & track — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Your spending this week, by category, plus your credit score and autosave." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Plan,
});

function Plan() {
  const { purchases, now, spendVelocity } = useRewardEngine();
  const [autosave, setAutosave] = useState(false);
  useEffect(() => { try { setAutosave(localStorage.getItem("bank-autosave") === "1"); } catch { /* default */ } }, []);
  const s = now ? spendingSummary(purchases, now.getTime()) : { thisWeek: 0, usualWeek: 0, byCategory: [] };
  const max = Math.max(...s.byCategory.map(c => c.amount), 1);
  const pace = spendPaceLabel(spendVelocity);
  return (
    <AppShell>
      <ScreenHeader title="Plan & track" subtitle="Spending from your card, last 4 weeks" />

      <section aria-label="Spending this week" className="rounded-3xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Spent this week</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">${s.thisWeek.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">Your usual week: ${s.usualWeek.toFixed(2)} · pace <span className="font-semibold text-foreground">{pace}</span></p>
        <div className="mt-4 space-y-2">
          <div><p className="mb-1 text-xs">This week</p><Progress value={(s.thisWeek / Math.max(s.thisWeek, s.usualWeek, 1)) * 100} /></div>
          <div><p className="mb-1 text-xs">Usual week</p><Progress value={(s.usualWeek / Math.max(s.thisWeek, s.usualWeek, 1)) * 100} tone="bg-muted-foreground" /></div>
        </div>
        <p className="mt-4 flex gap-2 rounded-2xl bg-muted p-3 text-sm"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" /><span>Smart Match uses your spending pace. When a week runs {pace === "lighter than usual" ? "light, like this one" : "tight"}, it leans toward rewards that cover what you’d buy anyway. <Link to="/for-you" className="font-semibold text-primary">See your offers</Link></span></p>
      </section>

      <h2 className="mt-6 mb-2 text-sm font-bold">Where it went</h2>
      <section aria-label="Spending by category" className="space-y-3 rounded-3xl border bg-card p-5">
        {s.byCategory.map(c => <div key={c.category}>
          <div className="mb-1 flex justify-between text-sm"><span>{categoryLabel(c.category)}</span><span className="font-semibold tabular-nums">${c.amount.toFixed(2)}</span></div>
          <Progress value={(c.amount / max) * 100} />
        </div>)}
      </section>

      <h2 className="mt-6 mb-2 text-sm font-bold">Credit score</h2>
      <section className="rounded-3xl border bg-card p-5">
        <div className="flex items-end gap-3"><p className="text-4xl font-extrabold">742</p><p className="pb-1 text-sm font-semibold text-success">Good</p></div>
        <p className="mt-1 text-sm text-muted-foreground">Demo score. Paying your card in full each month helps it grow.</p>
      </section>

      <section className="mt-4 mb-4 flex items-center justify-between gap-3 rounded-3xl border bg-card p-5">
        <span><span className="block font-bold">Autosave</span><span className="text-sm text-muted-foreground">Move $10 to savings every Friday</span></span>
        <Switch checked={autosave} aria-label="Autosave" onCheckedChange={on => { setAutosave(on); try { localStorage.setItem("bank-autosave", on ? "1" : "0"); } catch { /* session only */ } toast(on ? "Autosave on: $10 every Friday." : "Autosave off."); }} />
      </section>
    </AppShell>
  );
}
