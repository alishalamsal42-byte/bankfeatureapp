import { APP_NAME, APP_NAME_TITLE } from '@/lib/app-config';
import { Link } from '@tanstack/react-router';
import { Gift } from 'lucide-react';
import { Button } from './ui/button';
import { useRewardEngine } from '@/hooks/recommendation-demo';
import { notificationContent } from '@/lib/notifications';
export function RewardNotification() {
  const { banner, dismissBanner, skipCategory, prefs } = useRewardEngine();
  if (!banner) return null;
  const content = notificationContent(banner, { showDistance: prefs.location, expiry: banner.expiryAlert });
  return <aside role="status" aria-label="Reward suggestion" className="notification-slide absolute inset-x-2 top-2 z-50 rounded-xl border bg-card p-4 shadow-soft">
    <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground" aria-label={`${APP_NAME} app icon`}><Gift className="h-5 w-5" /></span><div className="min-w-0"><p className="mb-1 text-xs font-bold text-muted-foreground">{APP_NAME_TITLE} · Rewards</p><p className="text-sm font-bold break-words">{content.title}</p><p className="mt-1 text-xs text-muted-foreground">{content.detail}</p></div></div>
    <div className="mt-3 flex gap-2"><Button asChild className="flex-1" size="sm"><Link to="/redeem" search={{ id: banner.id }} onClick={dismissBanner}>Redeem now</Link></Button><Button variant="outline" size="sm" onClick={() => { dismissBanner(); skipCategory(banner.historyCategory); }}>Not now</Button></div>
  </aside>;
}
