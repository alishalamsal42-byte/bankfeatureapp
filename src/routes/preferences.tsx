import { BANK } from "@/lib/bank";
import { eventLabel, recentEvents } from "@/lib/learning";
import { resetLearning } from "@/hooks/learning-store";
import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AppShell, ScreenHeader, Chip } from "@/components/AppShell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/app-config";
import { interestChips, toggleInterest } from "@/lib/preferences";
import { setPreferences, usePreferences } from "@/hooks/preferences-store";
import { useRewardEngine } from "@/hooks/recommendation-demo";

export const Route = createFileRoute("/preferences")({
  head: () => ({
    meta: [
      { title: `Preferences & Privacy — ${APP_NAME_TITLE}` },
      { name: "description", content: "Choose your interests and control exactly which data the app uses." },
      { property: "og:title", content: `Preferences & Privacy — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Choose your interests and control exactly which data the app uses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Preferences,
});

const consents = [
  { k: "location", t: "Location", d: "Suggest rewards when you're near a participating store" },
  { k: "history", t: "Purchase history", d: "Learn your routine to time offers better" },
  { k: "notify", t: "Smart notifications", d: "" },
  { k: "quiet", t: "Quiet hours", d: "No notifications from 10 PM to 8 AM" },
  { k: "expiry", t: "Expiry alerts", d: "Remind me before a reward expires" },
  { k: "bankAuto", t: "Use bank points automatically", d: `Cover the rest of a purchase with your ${BANK.points}` },
] as const;

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-success" : "bg-muted"}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow-soft transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Preferences() {
  const prefs = usePreferences();
  const { skippedCategories, resetSkipped, learning } = useRewardEngine();
  const [confirm, setConfirm] = useState<"personalization" | "delete" | null>(null);
  return (
    <AppShell>
      <ScreenHeader title="Preferences" subtitle="You're in control of your data" />
      <h2 className="mb-3 text-lg font-bold">What do you care about?</h2>
      <div className="flex flex-wrap gap-2">
        {interestChips.map((i) => (
          <Chip key={i} active={prefs.interests.includes(i)} onClick={() => {
            const next = toggleInterest(prefs.interests, i);
            if (next.length === prefs.interests.length) { toast("Keep at least one category selected."); return; }
            setPreferences({ interests: next });
            toast("Your picks are updated.");
          }}>{i}</Chip>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-lg font-bold">Consent</h2>
      <div className="shadow-soft divide-y rounded-3xl bg-card">
        {consents.map((x) => (
          <div key={x.k} className="p-5">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1"><p className="font-semibold">{x.t}</p><p className="text-sm text-muted-foreground">{x.k === "notify" ? `Up to ${prefs.limit} per day, only when useful` : x.d}</p></div>
              <Switch label={x.t} on={prefs[x.k]} onClick={() => setPreferences({ [x.k]: !prefs[x.k] })} />
            </div>
            {x.k === "notify" && <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Daily notification limit">
              <span className="text-xs text-muted-foreground">Daily limit</span>
              {([1, 3, 5] as const).map(n => <Button key={n} role="radio" aria-checked={prefs.limit === n} size="sm" variant={prefs.limit === n ? "default" : "outline"} className="h-8 rounded-full px-4" onClick={() => setPreferences({ limit: n })}>{n}</Button>)}
            </div>}
          </div>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-lg font-bold">Learned from your feedback</h2>
      <div className="shadow-soft rounded-3xl bg-card p-5">
        {learning.events.length === 0 && skippedCategories.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet. Redeem a reward or tap “Not now” and {APP_NAME} will learn your routine.</p> : <>
          {learning.events.length > 0 && <ul aria-label="Recent learning events" className="space-y-1 text-sm">{recentEvents(learning).map(e => <li key={e.at + e.kind}>{eventLabel(e)}</li>)}</ul>}
          {skippedCategories.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Skipped today: {skippedCategories.map(cap).join(", ")}</p>}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { resetLearning(); resetSkipped(); toast("Learning reset to the original model."); }}>Reset learning</Button>
        </>}
      </div>

      <section className="bg-ink mt-6 mb-4 flex gap-4 rounded-3xl p-5">
        <ShieldCheck className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-bold">Privacy first</p>
          <p className="mt-1 opacity-80">{cap(APP_NAME)} uses your location and purchase history only to time your rewards. We never sell your data, and you can delete it anytime.</p>
          {confirm ? <div role="alertdialog" aria-label="Confirm" className="mt-3 rounded-2xl bg-card p-4 text-foreground">
            <p className="font-semibold">{confirm === "personalization" ? "Turn off personalization? Your picks will no longer be timed to your routine." : "Delete your purchase history? This resets your learned routine and can’t be undone."}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => {
                if (confirm === "personalization") setPreferences({ location: false, history: false });
                else { setPreferences({ historyDeleted: true }); resetSkipped(); resetLearning(); toast("Your history was deleted."); }
                setConfirm(null);
              }}>{confirm === "personalization" ? "Turn off" : "Delete"}</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
            </div>
          </div> : <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setConfirm("personalization")}>Turn off personalization</Button>
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setConfirm("delete")}>Delete my history</Button>
          </div>}
        </div>
      </section>
    </AppShell>
  );
}
