import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftRight, Camera, ChevronRight, Receipt, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accounts } from "@/lib/banking";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: `Pay & transfer — ${APP_NAME_TITLE}` },
      { name: "description", content: "Send money, pay bills, transfer between accounts and pay with points." },
      { property: "og:title", content: `Pay & transfer — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Send money, pay bills, transfer between accounts and pay with points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pay,
});

const contacts = ["Alex", "Jordan", "Priya"] as const;
const bills = [{ name: "Phone bill", amount: 45, due: "Due Nov 3" }, { name: "Music streaming (student)", amount: 5.99, due: "Due Nov 8" }] as const;

function Pay() {
  const [to, setTo] = useState<(typeof contacts)[number]>("Alex");
  const [amount, setAmount] = useState(20);
  const [transfer, setTransfer] = useState(50);
  return (
    <AppShell>
      <ScreenHeader title="Pay & transfer" subtitle={`${accounts.checking.name} (…${accounts.checking.last4})`} />

      <Button asChild variant="outline" className="h-auto w-full justify-start rounded-3xl bg-card p-4 text-left whitespace-normal"><Link to="/bank-rewards">Use your Bank points on today’s offers →</Link></Button>

      <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold"><Send className="h-4 w-4" />Send money</h2>
      <section className="rounded-3xl border bg-card p-4">
        <div className="flex gap-2" role="radiogroup" aria-label="Send to">
          {contacts.map(c => <button key={c} type="button" role="radio" aria-checked={to === c} onClick={() => setTo(c)} className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border p-2 text-xs font-semibold ${to === c ? "border-primary ring-2 ring-primary" : ""}`}><span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-bold">{c[0]}</span>{c}</button>)}
        </div>
        <label htmlFor="send-amount" className="mt-3 block text-sm font-semibold">Amount</label>
        <div className="mt-1 flex items-center gap-2"><span className="font-bold">$</span><Input id="send-amount" type="number" min={1} step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
        {amount > accounts.checking.balance && <p className="mt-2 text-xs text-destructive">More than your ${accounts.checking.balance.toFixed(2)} checking balance.</p>}
        <Button className="mt-3 h-11 w-full rounded-full" disabled={!(amount > 0) || amount > accounts.checking.balance} onClick={() => toast(`Demo: $${amount.toFixed(2)} sent to ${to}.`)}>Send ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"} to {to}</Button>
      </section>

      <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold"><Receipt className="h-4 w-4" />Pay bills</h2>
      <section className="divide-y rounded-3xl border bg-card px-4">
        {bills.map(b => <div key={b.name} className="flex items-center justify-between gap-3 py-3">
          <span className="min-w-0"><span className="block text-sm font-semibold">{b.name}</span><span className="text-xs text-muted-foreground">{b.due}</span></span>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => toast(`Demo: ${b.name} paid ($${b.amount.toFixed(2)}).`)}>Pay ${b.amount.toFixed(2)}</Button>
        </div>)}
      </section>

      <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold"><ArrowLeftRight className="h-4 w-4" />Transfer to savings</h2>
      <section className="rounded-3xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">From {accounts.checking.name} (…{accounts.checking.last4}) to {accounts.savings.name} (…{accounts.savings.last4})</p>
        <div className="mt-2 flex items-center gap-2"><span className="font-bold">$</span><Input aria-label="Transfer amount" type="number" min={1} step="1" value={transfer} onChange={e => setTransfer(Number(e.target.value))} /></div>
        {transfer > accounts.checking.balance && <p className="mt-2 text-xs text-destructive">More than your ${accounts.checking.balance.toFixed(2)} checking balance.</p>}
        <Button variant="outline" className="mt-3 h-11 w-full rounded-full" disabled={!(transfer > 0) || transfer > accounts.checking.balance} onClick={() => toast(`Demo: $${transfer.toFixed(2)} moved to savings.`)}>Transfer</Button>
      </section>

      <button type="button" onClick={() => toast("Demo: point your camera at a check to deposit it.")} className="mt-6 mb-4 flex w-full items-center gap-4 rounded-3xl border bg-card p-4 text-left">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-muted"><Camera className="h-5 w-5" /></span>
        <span className="flex-1"><span className="block font-bold">Deposit checks</span><span className="text-sm text-muted-foreground">Snap a photo of a check</span></span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </AppShell>
  );
}
