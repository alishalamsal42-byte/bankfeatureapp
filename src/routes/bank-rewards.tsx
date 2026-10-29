import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, Check, ChevronRight, CreditCard, Gift, Zap } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { allCashBack, bankDollars, BANK, canAfford, CASH_BACK_AMOUNTS, GIFT_CARD_AMOUNTS, GIFT_CARD_MERCHANTS, giftCardCode, pointsFor } from "@/lib/bank";

export const Route = createFileRoute("/bank-rewards")({
  head: () => ({
    meta: [
      { title: `Rewards — ${APP_NAME_TITLE}` },
      { name: "description", content: "Use your bank points at checkout, as instant cash back, or as a gift card." },
      { property: "og:title", content: `Rewards — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Use your bank points at checkout, as instant cash back, or as a gift card." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BankRewards,
});

type Done = { kind: "cash" | "gift"; dollars: number; points: number; merchant?: string; code?: string };

function BankRewards() {
  const { bank, redeemBankPoints, redemptions } = useRewardEngine();
  const [open, setOpen] = useState<"cash" | "gift" | null>(null);
  const [cash, setCash] = useState<number>(10);
  const [giftMerchant, setGiftMerchant] = useState<(typeof GIFT_CARD_MERCHANTS)[number]>("Starbucks");
  const [gift, setGift] = useState<number>(10);
  const [done, setDone] = useState<Done | null>(null);
  const all = allCashBack(bank.points);
  const history = redemptions.filter(r => (r.bankPts ?? 0) > 0).map(r => ({ ...r, bankPts: r.bankPts ?? 0 })).slice(0, 5);

  if (!bank.connected) return (
    <AppShell>
      <ScreenHeader title={`${BANK.name} points`} subtitle={BANK.card} />
      <p className="rounded-3xl border bg-card p-5 text-sm text-muted-foreground">Your card isn’t connected. <Link to="/smart-match" className="font-semibold text-primary">Connect it on the Connect page</Link> to use your points.</p>
    </AppShell>
  );

  if (done) return (
    <AppShell>
      <ScreenHeader title={`${BANK.name} points`} subtitle={BANK.card} />
      <section role="status" className="flex flex-col items-center rounded-3xl border bg-card p-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-success text-white"><Check className="h-7 w-7" /></span>
        {done.kind === "cash" ? <>
          <p className="mt-4 text-2xl font-extrabold">${done.dollars.toFixed(2)} deposited</p>
          <p className="mt-1 text-sm text-muted-foreground">Sent to your checking account instantly through FIS real-time payments (simulated).</p>
          <div className="mt-5 w-full space-y-2 text-left text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3"><span className="text-muted-foreground">Usual cash-out today</span><span className="font-semibold">3–4 business days</span></div>
            <div className="flex items-center justify-between rounded-2xl bg-success/10 px-4 py-3"><span className="font-semibold text-success">With Rewards</span><span className="font-bold text-success">Instant</span></div>
          </div>
        </> : <>
          <div className="mt-4 flex items-center gap-3"><BrandLogo name={done.merchant ?? ""} /><p className="text-2xl font-extrabold">${done.dollars} gift card</p></div>
          <p className="mt-1 text-sm text-muted-foreground">Your {done.merchant} gift card is ready to use.</p>
          <p aria-label="Gift card code" className="mt-4 rounded-2xl border border-dashed px-4 py-3 font-mono text-lg font-bold tracking-wider">{done.code}</p>
          <p className="mt-1 text-xs text-muted-foreground">Demo code</p>
        </>}
        <p className="mt-5 text-sm"><span className="font-semibold">{done.points.toLocaleString()} {BANK.name} pts</span> used · {bank.points.toLocaleString()} pts left (${bank.dollars.toFixed(2)})</p>
        <div className="mt-5 flex w-full flex-col gap-2">
          <Button className="h-12 w-full rounded-full" onClick={() => { setDone(null); setOpen(null); }}>Done</Button>
          <Button asChild variant="link" className="text-muted-foreground"><Link to="/savings">View my savings</Link></Button>
        </div>
      </section>
    </AppShell>
  );

  const confirmCash = () => { const pts = redeemBankPoints(pointsFor(cash), "Cash back · instant deposit"); if (pts) setDone({ kind: "cash", dollars: cash, points: pts }); };
  const confirmGift = () => { const pts = redeemBankPoints(pointsFor(gift), `$${gift} gift card`, giftMerchant); if (pts) setDone({ kind: "gift", dollars: gift, points: pts, merchant: giftMerchant, code: giftCardCode(giftMerchant, Date.now()) }); };
  const amountChip = (value: number, selected: boolean, onPick: () => void, label = `$${value}`) => (
    <Button key={label} type="button" size="sm" variant={selected ? "default" : "outline"} aria-pressed={selected} disabled={!canAfford(bank.points, value)} onClick={onPick} className="rounded-full">{label}</Button>
  );

  return (
    <AppShell>
      <ScreenHeader title={`${BANK.name} points`} subtitle={`${BANK.card} · 1 pt = 1¢`} />
      <section aria-label="Points balance" className="bg-ink rounded-3xl p-6">
        <div className="flex items-center gap-3"><BrandLogo name={BANK.name} /><p className="text-sm opacity-80">Your {BANK.points}</p></div>
        <p className="mt-3 text-4xl font-extrabold tracking-tight">{bank.points.toLocaleString()} pts</p>
        <p className="mt-1 text-lg font-semibold text-success">≈ ${bank.dollars.toFixed(2)}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs opacity-80"><Zap className="h-3.5 w-3.5" />Every option below is instant. No 3–4 day wait.</p>
      </section>

      <h2 className="mt-6 mb-3 text-sm font-bold">How do you want to use them?</h2>
      <div className="space-y-3">
        <Link to="/redeem" search={{ id: BANK.id }} className="flex items-center gap-4 rounded-3xl border bg-card p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted"><CreditCard className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Pay at checkout</span><span className="block text-sm text-muted-foreground">Tap to pay anywhere. Points cover the purchase.</span></span>
          <span className="shrink-0 text-xs font-bold text-success">Instant</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <div className="rounded-3xl border bg-card p-4">
          <button type="button" aria-expanded={open === "cash"} onClick={() => setOpen(open === "cash" ? null : "cash")} className="flex w-full items-center gap-4 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted"><Banknote className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">Cash back</span><span className="block text-sm text-muted-foreground">Into your checking account, right now.</span></span>
            <span className="shrink-0 text-right text-xs"><span className="block font-bold text-success">Instant</span><span className="block text-muted-foreground line-through">3–4 days</span></span>
          </button>
          {open === "cash" && <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {CASH_BACK_AMOUNTS.map(v => amountChip(v, cash === v, () => setCash(v)))}
              {all > 0 && !(CASH_BACK_AMOUNTS as readonly number[]).includes(all) && amountChip(all, cash === all, () => setCash(all), `All $${all}`)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Uses {pointsFor(cash).toLocaleString()} pts · {(bank.points - pointsFor(cash)).toLocaleString()} pts left</p>
            <Button className="mt-3 h-12 w-full rounded-full" disabled={!canAfford(bank.points, cash)} onClick={confirmCash}>Get ${cash} cash back now</Button>
          </div>}
        </div>

        <div className="rounded-3xl border bg-card p-4">
          <button type="button" aria-expanded={open === "gift"} onClick={() => setOpen(open === "gift" ? null : "gift")} className="flex w-full items-center gap-4 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted"><Gift className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">Gift card</span><span className="block text-sm text-muted-foreground">For places you already go.</span></span>
            <span className="shrink-0 text-xs font-bold text-success">Instant</span>
          </button>
          {open === "gift" && <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Gift card store">
              {GIFT_CARD_MERCHANTS.map(m => <button key={m} type="button" role="radio" aria-checked={giftMerchant === m} onClick={() => setGiftMerchant(m)} className={`flex flex-col items-center gap-1 rounded-2xl border p-2 text-xs font-semibold ${giftMerchant === m ? "border-primary ring-2 ring-primary" : ""}`}><BrandLogo name={m} />{m}</button>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{GIFT_CARD_AMOUNTS.map(v => amountChip(v, gift === v, () => setGift(v)))}</div>
            <p className="mt-3 text-sm text-muted-foreground">Uses {pointsFor(gift).toLocaleString()} pts · {(bank.points - pointsFor(gift)).toLocaleString()} pts left</p>
            <Button className="mt-3 h-12 w-full rounded-full" disabled={!canAfford(bank.points, gift)} onClick={confirmGift}>Get ${gift} {giftMerchant} gift card</Button>
          </div>}
        </div>
      </div>

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
