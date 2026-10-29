import { Progress } from "@/components/AppShell";

export function ScoreBreakdown({ scores }: { scores: { habit: number; location: number; points: number; trained: boolean } }) {
  return <div className="mt-3 space-y-2 border-t pt-3">
    {([['Likely now', scores.habit, 'bg-primary'], ['Location', scores.location, 'bg-primary'], ['Points', scores.points, 'bg-primary']] as const).map(([label, value, tone]) => <div key={label}>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{label}</span><span>{Math.round(value * 100)}%</span></div>
      <Progress value={value * 100} tone={tone} />
    </div>)}
  </div>;
}