import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRewardEngine } from "@/hooks/recommendation-demo";
import { RewardNotification } from "./RewardNotification";
import { RewardDemoPanel } from "./RewardDemoPanel";
import { Button } from "./ui/button";
import { Home, Sparkles, SlidersHorizontal, Undo2, MessageCircle, Signal, Wifi, BatteryFull, ArrowLeftRight, PieChart } from "lucide-react";

// Bank-app tabs; the AI rewards feature lives under Benefits.
const tabs = [
  { to: "/", label: "Accounts", icon: Home },
  { to: "/pay", label: "Pay", icon: ArrowLeftRight },
  { to: "/for-you", label: "Benefits", icon: Sparkles },
  { to: "/plan", label: "Plan & track", icon: PieChart },
  { to: "/preferences", label: "More", icon: SlidersHorizontal },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { now, controls } = useRewardEngine();
  const hour = controls?.hour;
  const clock = hour === undefined ? now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false }) ?? "—" : `${String(Math.floor(hour)).padStart(2, "0")}:${String(Math.round((hour % 1) * 60)).padStart(2, "0")}`;
  const scale = usePhoneScale();
  return (
    <div className="phone-stage" style={{ "--phone-scale": scale } as CSSProperties}>
      <div className="phone-device">
        <RewardNotification />
        <RewardDemoPanel />
        <div className="grid w-full shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-5 pt-3 pb-2 text-sm font-semibold">
          <span>{clock}</span>
          <AskButton />
          <span className="flex shrink-0 items-center justify-end gap-1"><Signal className="h-4 w-4" /><Wifi className="h-4 w-4" /><BatteryFull className="h-5 w-5" /></span>
        </div>
        <main className="no-scrollbar min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-5 pb-6">{children}</main>
        <nav aria-label="Main navigation" className="mobile-app-nav shrink-0 border-t bg-card">
          <div className="grid w-full grid-cols-5 px-2 pt-2">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] text-muted-foreground transition-colors"
              activeProps={{ className: "bg-secondary text-foreground font-bold", "aria-current": "page" }}
            >
              <t.icon className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">{t.label}</span>
            </Link>
          ))}
          </div>
          <span aria-hidden className="phone-home-indicator" />
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
  return <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Link to="/assistant" aria-label="Ask about your rewards"><MessageCircle className="h-5 w-5" /></Link></Button>;
}

// A 6.3-inch phone screen is 420 x 915 CSS px; the bezel adds 9px per side.
const PHONE_W = 420 + 18;
const PHONE_H = 915 + 18;

/**
 * Renders the device at true phone size and shrinks it (never stretches it)
 * so it still fits a short window. Returns a zoom factor for --phone-scale.
 */
function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const s = Math.min(1, (window.innerHeight - 16) / PHONE_H, (window.innerWidth - 16) / PHONE_W);
      setScale(Math.max(0.4, s));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}
