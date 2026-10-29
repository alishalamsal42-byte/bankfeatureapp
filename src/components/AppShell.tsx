import { Link, useRouter } from "@tanstack/react-router";
import { useRef, type ReactNode } from "react";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { RewardNotification } from "./RewardNotification";
import { RewardDemoPanel } from "./RewardDemoPanel";
import { Button } from "./ui/button";
import { Home, Sparkles, Store, Gift, SlidersHorizontal, Undo2, MessageCircle, Signal, Wifi, BatteryFull } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/for-you", label: "For You", icon: Sparkles },
  { to: "/smart-match", label: "Connect", icon: Store },
  { to: "/bank-rewards", label: "Points", icon: Gift },
  { to: "/preferences", label: "Prefs", icon: SlidersHorizontal },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-start justify-center sm:py-10">
      <div className="relative flex h-screen w-full max-w-[420px] flex-col overflow-hidden bg-background sm:h-[860px] sm:rounded-[3rem] sm:border-[10px] sm:border-card sm:shadow-phone">
        <RewardNotification />
        <RewardDemoPanel />
        <div className="flex shrink-0 items-center justify-between px-7 pt-4 pb-2 text-sm font-semibold">
          <span>8:15</span>
          <span className="flex items-center gap-1"><Signal className="h-4 w-4" /><Wifi className="h-4 w-4" /><BatteryFull className="h-5 w-5" /></span>
        </div>
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">{children}</main>
        <AskButton />
        <nav className="grid shrink-0 grid-cols-5 border-t bg-card px-2 pt-2 pb-5">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-foreground font-bold" }}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const router = useRouter();
  const titleTap = useDemoTitleTap();
  return (
    <header className="mt-3 mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <button onClick={() => router.history.back()} aria-label="Back" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-card">
        <Undo2 className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold"><Button variant="ghost" onClick={titleTap} className="h-auto max-w-full truncate p-0 text-xl font-bold hover:bg-transparent">{title}</Button></h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function useDemoTitleTap() {
  const { openPanel } = useRewardEngine();
  const taps = useRef({ count: 0, last: 0 });
  return () => {
    const now = Date.now();
    taps.current = { count: now - taps.current.last < 1500 ? taps.current.count + 1 : 1, last: now };
    if (taps.current.count === 3) { taps.current.count = 0; openPanel(); }
  };
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
    >
      {children}
    </button>
  );
}

export function Progress({ value, tone = "bg-primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function AskButton() {
  const router = useRouter();
  if (router.state.location.pathname === "/assistant") return null;
  return <Link to="/assistant" aria-label="Ask about your rewards" className="absolute right-5 bottom-24 z-30 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"><MessageCircle className="h-5 w-5" /></Link>;
}
