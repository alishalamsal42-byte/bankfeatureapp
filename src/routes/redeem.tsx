import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Smartphone, Nfc } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CODE_VALID_MS, formatCountdown, isCardOffer, minSpendShortfall, redemptionCode } from "@/lib/redemption";
import { BANK } from "@/lib/bank";
import { Input } from "@/components/ui/input";
import type { Offer } from "@/lib/rewards";
import { bankPointsForOffer, bankSelectionEnabled, offerRewardValue, paymentSplit, typicalPurchase } from "@/lib/bank";
import { Switch } from "@/components/ui/switch";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { getOffer, user } from "@/lib/rewards";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/redeem")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined; useBank?: boolean | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined, useBank: s["useBank"] === true || s["useBank"] === "true" ? true : undefined }),
  head: () => ({
    meta: [
      { title: `Redeem — ${APP_NAME_TITLE}` },
      { name: "description", content: "Review the terms and redeem your reward in a few taps." },
      { property: "og:title", content: `Redeem — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Review the terms and redeem your reward in a few taps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Redeem,
});

const steps = ["Review", "Confirm", "Use"];

function Redeem() {
  const { id, useBank: requestedBank } = Route.useSearch();
  const { redeemReward, returnReward, connectedApps, bank, prefs, payWithBank } = useRewardEngine();
  const isBank = id === BANK.id;
  const o = isBank ? bank.offer : getOffer(id ?? "coffee");
  const [step, setStep] = useState(0);
  const merchantBalance = connectedApps.find(a => a.id === o.id)?.points ?? o.points;
  const askTotal = isBank || o.minSpend > 0;
  const [amount, setAmount] = useState(() => isBank ? 12 : typicalPurchase(o));
  useEffect(() => { setAmount(isBank ? 12 : typicalPurchase(o)); }, [o.id]);
  const short = isBank ? 0 : minSpendShortfall(amount, o.minSpend);
  const invalid = !(amount > 0) || short > 0;
  const [useBank, setUseBank] = useState(true);
  const [paid, setPaid] = useState<ReturnType<typeof paymentSplit> | null>(null);
  useEffect(() => { setStep(0); setPaid(null); }, [o.id]);
  useEffect(() => { setUseBank(bankSelectionEnabled(requestedBank === true, prefs.bankAuto, bank.connected)); }, [requestedBank, prefs.bankAuto, bank.connected, o.id]);
  const split = paymentSplit(askTotal ? amount : typicalPurchase(o), isBank || short > 0 ? 0 : offerRewardValue(o), bank.points, isBank || (useBank && bank.connected));
  const confirm = () => { setPaid(split); if (isBank) payWithBank(split.total); else redeemReward(o, split.bankPts); };
  return (
    <AppShell>
      <ScreenHeader title="Spend your points" subtitle="Real reward, zero catch." />
      <section className="bg-goldglow rounded-3xl p-6 text-center">
        <div className="flex justify-center"><BrandLogo name={o.merchant} className="h-16 w-16" /></div>
        <p className="mt-2 text-2xl font-extrabold">{isBank ? `Pay with ${BANK.points}` : o.title}</p>
        <p className="text-sm opacity-80">{o.merchant}</p>
      </section>

      <div className="mt-5 flex items-center justify-between gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className="text-sm font-medium">{s}</span>
          </div>
        ))}
      </div>

      {step === 0 && askTotal && (
        <div className="shadow-soft mt-5 rounded-3xl bg-card p-5 text-sm">
          <label className="block font-semibold" htmlFor="purchase-total">Purchase total</label>
          <div className="mt-2 flex items-center gap-2"><span className="text-lg font-bold">$</span><Input id="purchase-total" type="number" inputMode="decimal" min={0} step="0.01" value={Number.isFinite(amount) ? amount : ""} onChange={e => setAmount(Number.parseFloat(e.target.value))} /></div>
          {short > 0 && <p role="alert" className="mt-2 font-semibold text-warning">Add ${short.toFixed(2)} more to use this reward</p>}
          {isBank && amount > 0 && <p className="mt-2 text-muted-foreground"><span className="font-bold text-foreground">{split.bankPts.toLocaleString()} {BANK.name} pts</span> will be used (${split.bankCovered.toFixed(2)}){split.charged > 0 ? ` · $${split.charged.toFixed(2)} charged to card` : ""}</p>}
        </div>
      )}
      {step === 0 && !isBank && (
        <div className="shadow-soft mt-5 space-y-3 rounded-3xl bg-card p-5 text-sm">
          {[
            ["Value", `$${o.value.toFixed(2)}`],
            ["Cost", o.bankFunded ? `${bankPointsForOffer(o, Infinity).toLocaleString()} ${BANK.points}` : o.points ? `${o.points.toLocaleString()} pts` : "No points needed"],
            ["Minimum spend", o.minSpend ? `$${o.minSpend}` : "None"],
            [o.renews ? "Renews" : "Expires", o.expires],
            ["Terms", "One per customer, eligible purchase only"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="text-right font-semibold">{v}</span></div>
          ))}
        </div>
      )}
      {step === 1 && isBank && (
        <div className="shadow-soft mt-5 space-y-1 rounded-3xl bg-card p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Purchase total</span><span>${split.total.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{BANK.points} ({split.bankPts.toLocaleString()} pts)</span><span>−${split.bankCovered.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Charged to card</span><span>${split.charged.toFixed(2)}</span></div>
        </div>
      )}
      {step === 1 && !isBank && (
        <div className="shadow-soft mt-5 rounded-3xl bg-card p-5 text-sm">
          {o.bankFunded ? <p className="font-semibold">Use {bankPointsForOffer(o, Infinity).toLocaleString()} {BANK.points} · ${o.value.toFixed(2)}</p> : <>
          <p className="font-semibold">Balance after redeeming</p>
          <p className="mt-1 text-3xl font-extrabold">{Math.max(0, merchantBalance - o.points).toLocaleString()} pts</p>
          <p className="text-muted-foreground">from {merchantBalance.toLocaleString()} {o.merchant} pts</p></>}
          {bank.connected && <div className="mt-4 border-t pt-4">
            <label className="flex items-center justify-between gap-3">
              <span><span className="block font-semibold">Use {BANK.points} for the rest</span><span className="text-xs text-muted-foreground">{bank.points.toLocaleString()} pts ≈ ${bank.dollars.toFixed(2)} available</span></span>
              <Switch checked={useBank} onCheckedChange={setUseBank} aria-label={`Use ${BANK.points} for the rest`} />
            </label>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">{o.bankFunded ? "Bill" : askTotal ? "Purchase total" : "Typical purchase"}</span><span>${split.total.toFixed(2)}</span></div>
              {!o.bankFunded && <div className="flex justify-between"><span className="text-muted-foreground">{o.merchant} reward</span><span>−${split.rewardCovered.toFixed(2)}</span></div>}
              {split.bankPts > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{BANK.points} ({split.bankPts.toLocaleString()} pts)</span><span>−${split.bankCovered.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold"><span>Charged to card</span><span>${split.charged.toFixed(2)}</span></div>
            </div>
          </div>}
        </div>
      )}
      {step === 2 && paid && (isBank || paid.bankPts > 0 || isCardOffer(o) ? <TapToPay split={paid} chase={paid.bankPts > 0} offerNote={!isBank && isCardOffer(o)} summary={[
        `${isBank ? `${paid.bankPts.toLocaleString()} ${BANK.name} pts` : [o.points ? `${o.points.toLocaleString()} ${o.merchant} pts` : o.bankFunded ? null : `$${o.value.toFixed(2)} off`, ...(paid.bankPts ? [`${paid.bankPts.toLocaleString()} ${BANK.name} pts`] : [])].filter(Boolean).join(' + ')} used · You saved $${(paid.rewardCovered + paid.bankCovered).toFixed(2)}`,
        ...(!isBank && o.points > 0 ? [`Remaining ${o.merchant} balance: ${(connectedApps.find(a => a.merchant === o.merchant)?.points ?? 0).toLocaleString()} pts`] : []),
        ...(paid.bankPts > 0 ? [`Remaining ${BANK.name} balance: ${bank.points.toLocaleString()} pts`] : []),
      ]} /> : <MerchantCode offer={o} balance={connectedApps.find(a => a.merchant === o.merchant)?.points ?? 0} onExpire={() => returnReward(o.id)} onRenew={() => redeemReward(o, 0)} />)}

      {step < 2 ? (
        <Button disabled={invalid || (isBank && split.bankPts === 0)} onClick={() => { if (step === 1) confirm(); setStep(step + 1); }} className="mt-5 h-12 w-full rounded-full">
          {step === 0 ? "Continue" : isBank ? "Confirm payment" : "Confirm redemption"}
        </Button>
      ) : (
        <div className="mt-5 text-center">
          <Button asChild className="h-12 w-full rounded-full"><Link to="/">Done</Link></Button>
          <Link to="/savings" className="mt-3 inline-block text-sm font-semibold text-primary">View my savings</Link>
        </div>
      )}
    </AppShell>
  );
}

function MerchantCode({ offer, balance, onExpire, onRenew }: { offer: Offer; balance: number; onExpire: () => void; onRenew: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(0);
  const issue = () => { setCode(redemptionCode(offer.id, 1000 + Math.floor(Math.random() * 9000))); const t = Date.now(); setExpiresAt(t + CODE_VALID_MS); setNow(t); };
  useEffect(() => { issue(); }, [offer.id]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = expiresAt - now;
  const expired = code !== null && left <= 0;
  useEffect(() => { if (expired) onExpire(); }, [expired]);
  if (!code) return null;
  return (
    <div className="shadow-soft mt-5 flex flex-col items-center rounded-3xl bg-card p-6 text-center">
      {expired ? <>
        <p className="font-bold">This code expired. Your points were returned.</p>
        <Button className="mt-4 rounded-full" onClick={() => { onRenew(); issue(); }}>Get a new code</Button>
      </> : <>
        <div className="rounded-2xl bg-card p-3 ring-1 ring-border"><QRCodeSVG value={code} size={176} level="M" aria-label={`QR code ${code}`} /></div>
        <p className="mt-3 font-bold">Show this at checkout</p>
        <p className="text-sm text-muted-foreground">Code {code}</p>
        <p role="timer" className="mt-1 text-sm font-semibold">Valid for {formatCountdown(left)}</p>
        <div className="mt-4 w-full border-t pt-4 text-sm">
          <p className="font-semibold">{offer.points.toLocaleString()} points used · You saved ${offer.value.toFixed(2)}</p>
          <p className="mt-1 text-muted-foreground">Remaining {offer.merchant} balance: {balance.toLocaleString()} pts</p>
        </div>
      </>}
    </div>
  );
}

function TapToPay({ split, chase, offerNote = false, summary = [] }: { split: ReturnType<typeof paymentSplit>; chase: boolean; offerNote?: boolean; summary?: string[] }) {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="shadow-soft mt-5 flex flex-col items-center rounded-3xl bg-card p-6 text-center">
      {!done ? <>
        <div className="relative h-36 w-36" aria-hidden>
          <Nfc className="absolute top-2 right-2 h-10 w-10 animate-ping text-success motion-reduce:animate-none" />
          <Smartphone className="tap-phone absolute bottom-0 left-6 h-24 w-24" strokeWidth={1.25} />
        </div>
        <p className="mt-3 text-lg font-bold">Tap to pay</p>
        <p className="text-sm text-muted-foreground">Hold near the card reader</p>
        {offerNote && <p className="mt-2 text-xs font-semibold">Offer applied automatically when you pay with your card.</p>}
      </> : <>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-success text-primary-foreground"><Check className="h-7 w-7" /></span>
        <p className="mt-3 text-xl font-extrabold">Paid</p>
        <div className="mt-4 w-full space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Order total</span><span className="font-semibold">${split.total.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{split.rewardCovered > 0 ? "Covered by reward" : "Reward"}</span><span className="font-semibold text-success">−${split.rewardCovered.toFixed(2)}</span></div>
          {split.bankPts > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{BANK.points} ({split.bankPts.toLocaleString()} pts)</span><span className="font-semibold text-success">−${split.bankCovered.toFixed(2)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Charged to card</span><span className="font-semibold">${split.charged.toFixed(2)}</span></div>
        </div>
        {offerNote && <p className="mt-3 text-xs font-semibold">Offer applied automatically when you pay with your card.</p>}
        {chase && <p className="mt-3 text-xs font-semibold text-success">{BANK.points} applied to this purchase.</p>}
        {summary.length > 0 && <div className="mt-4 w-full border-t pt-4 text-sm">{summary.map((line, k) => <p key={line} className={k === 0 ? "font-semibold" : "mt-1 text-muted-foreground"}>{line}</p>)}</div>}
      </>}
    </div>
  );
}
