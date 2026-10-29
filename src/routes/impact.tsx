import { APP_NAME_TITLE } from "@/lib/app-config";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { AppShell, ScreenHeader, Progress } from "@/components/AppShell";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: `My Impact — ${APP_NAME_TITLE}` },
      { name: "description", content: "Track how much you've saved and the rewards you've actually used." },
      { property: "og:title", content: `My Impact — ${APP_NAME_TITLE}` },
      { property: "og:description", content: "Track how much you've saved and the rewards you've actually used." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Impact,
});

const badges = [
  { e: "🏅", n: "Pro Saver", bg: "bg-lilac" },
  { e: "🏆", n: "No Expiry", bg: "bg-mint" },
  { e: "☕", n: "Coffee Pro", bg: "bg-peach" },
  { e: "🎯", n: "Smart Pick", bg: "bg-sky" },
];

const data = {
  Weekly: [
    { e: "☕", n: "Coffee", s: "6 rewards used", v: 18.5, g: 25, tone: "bg-points" },
    { e: "🥗", n: "Restaurants", s: "Almost at goal", v: 12.3, g: 15, tone: "bg-success" },
    { e: "🎬", n: "Entertainment", s: "On track", v: 7.6, g: 20, tone: "bg-primary" },
  ],
  Monthly: [
    { e: "☕", n: "Coffee", s: "21 rewards used", v: 64, g: 80, tone: "bg-points" },
    { e: "🥗", n: "Restaurants", s: "Doing great!", v: 41, g: 50, tone: "bg-success" },
    { e: "🎬", n: "Entertainment", s: "On track", v: 22, g: 60, tone: "bg-primary" },
  ],
};

function Impact() {
  const [period, setPeriod] = useState<keyof typeof data>("Weekly");
  return (
    <AppShell>
      <ScreenHeader title="My Impact" subtitle="15% ahead of your savings goal" action={<button aria-label="More" className="grid h-11 w-11 place-items-center rounded-full border bg-card"><MoreVertical className="h-5 w-5" /></button>} />
      <section className="bg-ember rounded-3xl p-5">
        <div className="flex justify-between">
          <div><p className="text-lg font-bold">🎯 Total saved</p><p className="text-sm opacity-70">Top 8% of students</p></div>
          <div className="text-right"><p className="text-lg font-bold">0 expired</p><p className="text-sm opacity-70">rewards this year</p></div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-card/20"><div className="h-full w-[68%] rounded-full bg-destructive" /></div>
        <div className="mt-3 flex justify-between text-sm opacity-80"><span>68% of $200 goal</span><span>$136.20 saved</span></div>
      </section>

      <div className="mt-6 mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Achievements</h2><span className="text-sm text-muted-foreground">View all</span></div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {badges.map((b) => (
          <div key={b.n}><div className={`${b.bg} mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl`}>{b.e}</div><p className="mt-2 font-medium">{b.n}</p></div>
        ))}
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Rewards used</h2>
        <div className="flex rounded-full bg-muted p-1 text-sm">
          {(Object.keys(data) as (keyof typeof data)[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1 ${p === period ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {data[period].map((c) => (
          <div key={c.n} className="shadow-soft rounded-3xl bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{c.e}</span>
              <div className="min-w-0 flex-1"><p className="font-bold">{c.n}</p><p className="text-sm text-muted-foreground">{c.s}</p></div>
              <p className="font-bold">${c.v} <span className="font-normal text-muted-foreground">/ ${c.g}</span></p>
            </div>
            <div className="mt-3"><Progress value={(c.v / c.g) * 100} tone={c.tone} /></div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
