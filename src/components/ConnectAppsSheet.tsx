import { BANK } from '@/lib/bank';
import { APP_NAME } from '@/lib/app-config';
import { useEffect, useState } from 'react';
import { Check, LoaderCircle, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BrandLogo } from './BrandLogo';
import { appCatalog, CONNECT_DELAY_MS } from '@/lib/connection-catalog';
import type { Offer } from '@/lib/rewards';
import { useRewardEngine } from '@/hooks/recommendation-demo';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { MerchantHandoff } from './MerchantHandoff';
import { detailAction, expiryDays } from '@/lib/redemption';
type Stage = 'catalog' | 'consent' | 'signin' | 'permission' | 'connecting' | 'connected' | 'details';
export function ConnectAppsSheet({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (open: boolean) => void; initial: Offer | null }) {
  const { connectedIds, connectApp, disconnectApp, bank } = useRewardEngine();
  const [stage, setStage] = useState<Stage>('catalog');
  const [selected, setSelected] = useState<Offer | null>(null);
  const [query, setQuery] = useState('');
  useEffect(() => { if (open) { setSelected(initial); setStage(initial ? 'details' : 'catalog'); setQuery(''); } }, [open, initial]);
  useEffect(() => {
    if (!open || !selected) return;
    if (stage === 'connecting') {
      const timer = setTimeout(() => { connectApp(selected.id); setStage('connected'); }, CONNECT_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (stage === 'connected') {
      const timer = setTimeout(() => onOpenChange(false), 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stage, open, selected]);
  const midFlow = stage === 'consent' || stage === 'signin' || stage === 'permission';
  const cancel = () => { if (selected && midFlow) toast(`${selected.merchant} wasn’t connected.`); onOpenChange(false); };
  const handleOpenChange = (next: boolean) => { if (!next) cancel(); else onOpenChange(true); };
  const merchantScreen = (stage === 'signin' || stage === 'permission') && selected;
  const title = stage === 'catalog' ? 'Add app' : stage === 'consent' ? `Connect ${selected?.merchant} to ${APP_NAME}` : stage === 'details' ? selected?.merchant ?? 'App details' : selected?.merchant ?? 'Demo sign-in';
  const available = [...(bank.connected ? [] : [bank.offer]), ...appCatalog].filter(app => !connectedIds.includes(app.id) && app.merchant.toLowerCase().includes(query.toLowerCase()));
  return <Sheet open={open} onOpenChange={handleOpenChange}><SheetContent side="bottom" className={merchantScreen ? `merchant-page merchant-${merchantScreen.id} mx-auto h-[100dvh] max-h-[100dvh] w-full max-w-[420px] overflow-y-auto bg-card p-0` : "mx-auto max-h-[85dvh] w-full max-w-[420px] overflow-y-auto rounded-t-2xl bg-card p-5"}>
    <SheetHeader className={merchantScreen ? "sr-only" : "pr-8"}><SheetTitle>{title}</SheetTitle><SheetDescription>{stage === 'catalog' ? 'Your reward apps' : stage === 'details' ? 'Connected · demo account' : 'Demo connection'}</SheetDescription></SheetHeader>
    {stage === 'catalog' && <><div className="relative my-4"><Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search apps" placeholder="Search apps" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" /></div><div className="divide-y">{available.map(app => <Button key={app.id} variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none px-0 py-3" onClick={() => { setSelected(app); setStage('consent'); }}><BrandLogo name={app.merchant} /><span className="min-w-0 flex-1 text-left"><span className="block font-bold">{app.merchant}</span><span className="text-xs text-muted-foreground">{app.points.toLocaleString()} pts</span></span><span className="font-bold">${app.value.toFixed(2)}</span></Button>)}</div>{available.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No apps found</p>}</>}
    {stage === 'consent' && selected && <div className="mt-5"><div className="mb-5 flex justify-center"><BrandLogo name={selected.merchant} className="h-16 w-16" /></div><p className="text-sm">By continuing, you allow {APP_NAME} to view your points balance and reward expiration dates.</p><Button className="mt-5 w-full" onClick={() => setStage('signin')}>Continue</Button><Button variant="ghost" className="mt-1 w-full" onClick={cancel}>Cancel</Button></div>}
    {merchantScreen && selected && <div className="flex min-h-full flex-col">
      <div className="merchant-band flex flex-col items-center gap-3 px-6 pt-12 pb-8"><BrandLogo name={selected.merchant} className="h-20 w-20" /><p className="text-2xl font-extrabold">{selected.merchant}</p><span className="rounded-full bg-card/20 px-3 py-1 text-xs font-bold">Demo sign-in</span></div>
      {stage === 'signin' ? <form className="flex flex-1 flex-col gap-4 p-6" onSubmit={e => { e.preventDefault(); setStage('permission'); }}>
        <h3 className="text-lg font-bold">Sign in to {selected.merchant} Rewards</h3>
        <label className="text-sm font-semibold">Email<Input readOnly tabIndex={-1} aria-readonly value="sarah.demo@example.com" className="mt-1 cursor-not-allowed bg-muted" /></label>
        <label className="text-sm font-semibold">Password<Input readOnly tabIndex={-1} aria-readonly type="password" value="demopassword" className="mt-1 cursor-not-allowed bg-muted" /></label>
        <p className="text-xs text-muted-foreground">Sample account · fields can’t be edited</p>
        <Button type="submit" className="merchant-primary mt-2 h-12 w-full">Sign in</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={cancel}>Cancel</Button>
      </form> : <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="text-lg font-bold">Allow {APP_NAME} to access your {selected.merchant} Rewards?</h3>
        <ul className="space-y-2 text-sm">{['View your points balance', 'View reward expiration dates'].map(item => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{item}</li>)}</ul>
        <Button className="merchant-primary mt-4 h-12 w-full" onClick={() => setStage('connecting')}>Allow</Button>
        <Button variant="outline" className="w-full" onClick={cancel}>Deny</Button>
      </div>}
    </div>}
    {(stage === 'connecting' || stage === 'connected') && <div role="status" className="flex flex-col items-center gap-5 py-12">{stage === 'connecting' ? <LoaderCircle className="h-12 w-12 animate-spin text-success motion-reduce:animate-none" /> : <Check className="h-12 w-12 text-success" />}<p className="text-xl font-bold">{stage === 'connecting' ? 'Connecting…' : 'Connected'}</p></div>}
    {stage === 'details' && selected && <MerchantDetails offer={selected} onClose={() => onOpenChange(false)} onDisconnect={() => { disconnectApp(selected.id); onOpenChange(false); }} />}
  </SheetContent></Sheet>;
}

function MerchantDetails({ offer, onClose, onDisconnect }: { offer: Offer; onClose: () => void; onDisconnect: () => void }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const action = detailAction(offer);
  const days = expiryDays(offer.expires);
  const soon = days !== undefined && days <= 7;
  const toGo = offer.unlock ? offer.unlock.goal - offer.points : 0;
  const go = () => { onClose(); if (action === 'bank') void navigate({ to: '/bank-rewards' }); else void navigate({ to: '/redeem', search: { id: offer.id } }); };
  const label = action === 'bank' ? `Use ${BANK.points}` : action === 'offer' ? 'Use offer' : 'Use reward';
  return <div className="mt-6">
    <div className="flex items-center gap-4"><BrandLogo name={offer.merchant} className="h-16 w-16" /><div><p className="text-xl font-bold">{offer.points.toLocaleString()} pts</p><p className="text-success">${offer.value.toFixed(2)} value</p></div></div>
    <dl className="mt-5 divide-y text-sm">
      <div className="flex justify-between py-3"><dt>Reward</dt><dd>{offer.title}</dd></div>
      {offer.minSpend > 0 && <div className="flex justify-between py-3"><dt>Minimum purchase</dt><dd>${offer.minSpend}</dd></div>}
      <div className="flex justify-between py-3"><dt>Expires</dt><dd className={soon ? 'font-semibold text-warning' : ''}>{soon ? (days === 0 ? 'Expires today' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`) : offer.expires}</dd></div>
    </dl>
    {action === 'handoff' ? <>
      <Button className="mt-5 h-12 w-full rounded-full" onClick={() => setHandoff(true)}>Order on {offer.merchant} →</Button>
      <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">{toGo} pts to go</p>
    </> : <Button className="mt-5 h-12 w-full rounded-full" onClick={go}>{label}</Button>}
    {confirming ? <div role="alertdialog" aria-label="Confirm removal" className="mt-4 rounded-2xl border p-4">
      <p className="text-sm font-bold">Remove {offer.merchant}?</p>
      <p className="mt-1 text-sm text-muted-foreground">Your points will remain in your {offer.merchant} account.</p>
      <div className="mt-3 flex gap-2"><Button variant="destructive" className="flex-1" onClick={onDisconnect}>Remove</Button><Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Cancel</Button></div>
    </div> : <button type="button" onClick={() => setConfirming(true)} className="mt-4 block w-full text-center text-xs font-semibold text-muted-foreground hover:text-destructive">Disconnect</button>}
    {handoff && <MerchantHandoff merchant={offer.merchant} onClose={() => setHandoff(false)} />}
  </div>;
}
