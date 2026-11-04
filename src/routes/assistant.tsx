import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { askAssistant } from "@/lib/assistant.functions";
import { buildAssistantContext } from "@/lib/assistant-context";
import { BANK } from "@/lib/bank";
import { APP_NAME_TITLE } from "@/lib/app-config";
import { USER_NAME } from "@/lib/sarah-history";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: `Ask about your rewards — ${APP_NAME_TITLE}` },
      { name: "description", content: "Ask which reward to use right now, what's expiring and how many points you have." },
      { property: "og:title", content: `Ask about your rewards — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Ask which reward to use right now, what's expiring and how many points you have." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string; rewardId?: string | null; error?: boolean };
const suggestions = ["What should I use right now?", "What's expiring soon?", `How many ${BANK.points} do I have?`];

function Assistant() {
  const engine = useRewardEngine();
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const all = [...engine.ranked, ...engine.unscored];

  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    const { context, allowedRewardIds } = buildAssistantContext({
      dayOfWeek: engine.dayOfWeek, hour: engine.controls?.hour ?? engine.hour, place: engine.controls?.place ?? "Near campus (sample distances)",
      ranked: engine.ranked, unscored: engine.unscored, topPickId: engine.bestNow?.id, bank: engine.bank, weekly: engine.weekly,
      usualHour: engine.learning.usualHour, purchases: engine.purchases, prefs: engine.prefs as unknown as Record<string, unknown>, spendVelocity: engine.spendVelocity,
    });
    const history = msgs.filter(m => !m.error).slice(-10).map(({ role, content }) => ({ role, content }));
    setMsgs(m => [...m, { role: "user", content: q }]); setText(""); setBusy(true);
    try {
      const reply = await ask({ data: { question: q, history, context, allowedRewardIds } });
      setMsgs(m => [...m, { role: "assistant", content: reply.answer, rewardId: reply.rewardId }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong.", error: true }]);
    } finally { setBusy(false); }
  };

  return (
    <AppShell>
      <ScreenHeader title="Ask" subtitle={`Rewards help for ${USER_NAME}`} />
      <div className="space-y-3" aria-live="polite">
        {msgs.length === 0 && <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Ask about your rewards. I only answer from what's in your app, and I never use a reward without you tapping.</p>
          {suggestions.map(s => <Button key={s} variant="outline" size="sm" className="mr-2 rounded-full" onClick={() => void send(s)}>{s}</Button>)}
        </div>}
        {msgs.map((m, i) => {
          const reward = m.rewardId ? all.find(r => r.id === m.rewardId) : undefined;
          return <div key={i} className={m.role === "user" ? "ml-10 rounded-2xl bg-primary p-3 text-sm text-primary-foreground" : `mr-6 rounded-2xl border bg-card p-3 text-sm ${m.error ? "text-destructive" : ""}`}>
            <p>{m.content}</p>
            {reward && <Button asChild size="sm" className="mt-3 w-full"><Link to="/redeem" search={{ id: reward.id, useBank: reward.bankFunded || undefined }}>Use {reward.merchant} {reward.title}<ArrowRight /></Link></Button>}
          </div>;
        })}
        {busy && <p className="mr-6 rounded-2xl border bg-card p-3 text-sm text-muted-foreground">Thinking…</p>}
      </div>
      <form className="sticky bottom-0 mt-4 flex gap-2 bg-background py-2" onSubmit={e => { e.preventDefault(); void send(text); }}>
        <Input aria-label="Your question" placeholder="Ask about your rewards…" value={text} onChange={e => setText(e.target.value)} maxLength={500} />
        <Button type="submit" size="icon" aria-label="Send" disabled={busy || !text.trim()}><Send /></Button>
      </form>
    </AppShell>
  );
}
