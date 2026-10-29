import { BANK } from "@/lib/bank";
import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import type { Offer } from "@/lib/rewards";
import { BrandLogo } from "@/components/BrandLogo";
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConnectAppsSheet } from '@/components/ConnectAppsSheet';
import { useRewardEngine } from '@/hooks/recommendation-demo';
import { useCountedTotal } from '@/hooks/use-counted-total';
import { connectionTotal } from '@/lib/connection-catalog';

export const Route = createFileRoute("/smart-match")({
  head: () => ({
    meta: [
      { title: `Merchants — ${APP_NAME_TITLE}` },
      { name: "description", content: "Our partner brands: points and dollar value for each, plus total savings." },
      { property: "og:title", content: `Merchants — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Our partner brands: points and dollar value for each, plus total savings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SmartMatch,
});

function BrandIcon({ name, className = "" }: { name: string; className?: string }) {
  return <BrandLogo name={name} className={`h-14 w-14 ${className}`} />;
}

function SmartMatch() {
  const { connectedApps, connectApp, disconnectApp, bank } = useRewardEngine();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<Offer | null>(null);
  const remove = (offer: Offer) => {
    disconnectApp(offer.id);
    setConfirm(null);
    toast(`${offer.merchant} removed`, { duration: 5000, action: { label: "Undo", onClick: () => connectApp(offer.id) } });
  };
  const totalSavings = useCountedTotal(connectionTotal(connectedApps) + bank.dollars);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);

  return (
    <AppShell>
      <ScreenHeader title="Merchants" subtitle={`${connectedApps.length} partner brands · points and value`} />

      <section className="bg-ink rounded-3xl p-6 text-center">
        <p className="text-sm opacity-70">Total savings available</p>
        <p aria-label="Total savings" className="mt-1 text-4xl font-extrabold">${totalSavings.toFixed(2)}</p>
        <p className="mt-1 text-sm opacity-80">across all {connectedApps.length} partner brands</p>
      </section>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Bank card</h2>
        <Button variant="ghost" size="sm" onClick={() => { setEditing(e => !e); setConfirm(null); }}>{editing ? "Done" : "Edit"}</Button>
      </div>
      {bank.connected ? <div className="relative">
        {editing && <button type="button" aria-label={`Remove ${BANK.name}`} onClick={() => setConfirm(bank.offer)} className="absolute -top-1.5 -left-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft"><Minus className="h-4 w-4" /></button>}
        <Button variant="ghost" aria-label={`${BANK.name} rewards connected`} onClick={() => { if (editing) { setConfirm(bank.offer); return; } setSelected(bank.offer); setOpen(true); }} className="shadow-soft flex h-auto w-full items-center justify-start gap-4 rounded-3xl bg-card p-4 text-left whitespace-normal">
          <BrandLogo name={BANK.name} className="h-14 w-14" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{BANK.card}</span>
            <span className="block font-bold">{BANK.points}</span>
            <span className="block text-sm font-bold text-success">{bank.points.toLocaleString()} pts ≈ ${bank.dollars.toFixed(2)}</span>
            <span className="block text-xs text-muted-foreground">Use on your offers</span>
          </span>
          <span className="text-[10px] font-bold text-success">Connected</span>
        </Button>
      </div> : <p className="text-sm text-muted-foreground">{BANK.name} isn’t connected. Tap “Add app” to connect it.</p>}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Connected apps</h2>
      </div>
      {confirm && <div role="alertdialog" aria-label="Confirm removal" className="mb-4 rounded-2xl border bg-card p-4 shadow-soft">
        <p className="text-sm font-bold">Remove {confirm.merchant}?</p>
        <p className="mt-1 text-sm text-muted-foreground">Your points will remain in your {confirm.merchant} account.</p>
        <div className="mt-3 flex gap-2"><Button variant="destructive" className="flex-1" onClick={() => remove(confirm)}>Remove</Button><Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button></div>
      </div>}
      <div className="grid grid-cols-3 gap-3">
        {connectedApps.map((offer) => {
          const p = offer.merchant;
          return (
            <div key={p} className="relative">
            {editing && <button type="button" aria-label={`Remove ${p}`} onClick={() => setConfirm(offer)} className="absolute -top-1.5 -left-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft"><Minus className="h-4 w-4" /></button>}
            <Button variant="ghost" aria-label={`${p} connected app`} onClick={() => { if (editing) { setConfirm(offer); return; } setSelected(offer); setOpen(true); }} className="w-full shadow-soft flex h-auto min-h-40 flex-col items-center gap-0 rounded-3xl bg-card p-3 text-center whitespace-normal">
              <BrandIcon name={p} />
              <p className="mt-2 w-full truncate text-xs font-bold">{p}</p>
              <p className="mt-1 text-xs font-bold text-success">{offer && offer.points > 0 ? `${offer.points.toLocaleString()} pts` : "Card offer"}</p>
              <p className="text-xs text-muted-foreground">{offer ? `≈ $${offer.value.toFixed(2)}` : ""}</p>
              <span className="mt-2 text-[10px] font-bold text-success">Connected</span>
            </Button>
            </div>
          );
        })}
        {!editing && <Button variant="ghost" aria-label="Add app" onClick={() => { setSelected(null); setOpen(true); }} className="flex h-auto min-h-40 flex-col gap-3 rounded-3xl border border-dashed bg-card p-3"><Plus className="h-8 w-8 text-muted-foreground" /><span className="text-xs font-bold">Add app</span></Button>}
      </div>
      <ConnectAppsSheet open={open} onOpenChange={setOpen} initial={selected} />
    </AppShell>
  );
}
