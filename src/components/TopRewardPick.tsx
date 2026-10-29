import { likelyNowLabel } from "@/lib/sarah-history";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Progress } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { matchLabel, type scoreReward } from "@/lib/model";
import type { Offer } from "@/lib/rewards";
import { pickReason } from "@/lib/pick-context";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { bankCoversRest, typicalPurchase } from "@/lib/bank";

type RankedOffer = Offer & { scores: ReturnType<typeof scoreReward> };
const formatHour = (hour: number) => `${Math.floor(hour) % 12 || 12}${hour % 1 ? ":30" : ""} ${hour >= 12 ? "PM" : "AM"}`;

export function TopRewardPick({ reward, onSkip, hour, showLocation = true, isStrong = true }: { reward: RankedOffer; onSkip: () => void; hour: number; showLocation?: boolean; isStrong?: boolean }) {
  const { bank, learning, weekly } = useRewardEngine();
  const bankLine = bank.connected && bankCoversRest(typicalPurchase(reward), reward.value, bank.points) && typicalPurchase(reward) > reward.value;
  const { scores } = reward;
  const usual = scores.atUsualTime && scores.usualHour !== undefined ? ` · around your usual ${formatHour(scores.usualHour)} ${reward.historyCategory}` : "";
  const location = reward.online ? "Online" : `${Number((reward.distanceMiles ?? 0).toFixed(2))} mi away`;
  const value = `${reward.points ? `${reward.points.toLocaleString()} pts` : reward.bankFunded ? CARD_OFFER_LABEL : "Card offer"} · $${reward.value.toFixed(2)}`;
  const reason = pickReason({ merchant: reward.merchant, hour, category: reward.historyCategory, atUsualTime: Boolean(scores.atUsualTime), usualHour: scores.usualHour, online: reward.online, distanceMiles: reward.distanceMiles, hideDistance: !showLocation, expiresInDays: reward.expiresInDays });
  const strong = scores.match >= 0.10;
  const rows = [
    { label: "Likely now", text: likelyNowLabel(scores.visitRate, reward.modelCategory ?? reward.historyCategory, weekly), value: scores.visitRate, tone: "bg-primary" },
    ...(showLocation ? [{ label: "Location", text: location, value: scores.location, tone: "bg-primary" }] : []),
    { label: "Points", text: value, value: scores.points, tone: "bg-primary" },
  ];
  return <section aria-label="Top pick" className="border-t-2 border-primary pt-4 pb-5">
    <div className="mb-4 flex items-center justify-between gap-2">
      <p className="text-xs font-bold uppercase tracking-widest">{isStrong ? "Your top pick" : "Good option right now"}</p>
      <span className={scores.match >= 0.10 ? "text-xs font-bold text-success" : "text-xs font-bold text-muted-foreground"}>{matchLabel(scores.match)}</span>
    </div>
    <div className="flex items-center gap-4">
      <BrandLogo name={reward.merchant} className="h-16 w-16" />
      <div className="min-w-0"><p className="text-sm text-muted-foreground">{reward.merchant}</p><h2 className="text-2xl font-extrabold break-words">{reward.title}</h2></div>
    </div>
    <div className="mt-5 space-y-4" aria-label="Score breakdown">
      {rows.map(row => <div key={row.label}>
        <p className="text-xs font-bold">{row.label}</p>
        <p className="mt-1 mb-2 text-sm text-muted-foreground">{row.text}</p>
        <div role="progressbar" aria-label={row.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(row.value * 100)}><Progress value={row.value * 100} tone={row.tone} /></div>
      </div>)}
    </div>
    <p className="mt-4 text-sm text-muted-foreground">{reason}</p>
    {learning.events.length > 0 && <p className="mt-2 text-xs font-semibold text-primary">Updated from your last {learning.events.length} {learning.events.length === 1 ? "action" : "actions"}.</p>}
    {bankLine && <p className="mt-2 text-sm font-semibold text-success">Pay $0 with {reward.merchant} {reward.title.toLowerCase()} + {bank.offer.merchant} points.</p>}
    <Button asChild className="mt-4 h-12 w-full"><Link to="/redeem" search={{ id: reward.id }}>Pay with points<ArrowRight /></Link></Button>
    <div className="mt-1 text-center"><Button variant="link" onClick={onSkip} className="text-muted-foreground">Not now</Button></div>
  </section>;
}