import { X, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRewardEngine, presets } from '@/hooks/recommendation-demo';
import { mockPlaces } from '@/lib/model-fixtures';
import { formatHour } from '@/lib/notifications';
import type { ModelCategory } from '@/lib/model';
import { spendPaceLabel } from '@/lib/sarah-history';
export function RewardDemoPanel() {
  const { panelOpen, setPanelOpen, controls, setControls, locationStatus, resetDemo } = useRewardEngine();
  if (!panelOpen || !controls) return null;
  return <section role="dialog" aria-label="Reward demo controls" className="absolute inset-x-0 bottom-0 z-40 max-h-[65%] overflow-y-auto border-t bg-card p-5 shadow-soft">
    <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Demo controls</h2><Button variant="ghost" size="icon" aria-label="Close demo controls" onClick={() => setPanelOpen(false)}><X /></Button></div>
    <div className="mb-4 grid grid-cols-2 gap-2">{Object.entries(presets).map(([name, preset]) => <Button variant="outline" size="sm" key={name} onClick={() => setControls({ ...preset, hoursSinceLast: { ...preset.hoursSinceLast } })}>{name}</Button>)}</div>
    <Button variant="outline" size="sm" className="mb-4 w-full text-destructive" onClick={resetDemo}>Reset demo</Button>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <label className="space-y-1">Day of week<select aria-label="Day of week" className="h-10 w-full rounded-md border bg-background px-2" value={controls.dayOfWeek} onChange={e => setControls({ ...controls, dayOfWeek: Number(e.target.value) })}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
      <label className="space-y-1">Time<select aria-label="Time" className="h-10 w-full rounded-md border bg-background px-2" value={controls.hour} onChange={e => setControls({ ...controls, hour: Number(e.target.value) })}>{Array.from({ length: 33 }, (_, index) => 7 + index / 2).map(hour => <option key={hour} value={hour}>{formatHour(hour)}</option>)}</select></label>
      <label className="col-span-2 space-y-1">Location<select aria-label="Location" className="h-10 w-full rounded-md border bg-background px-2" value={controls.place} onChange={e => { const place = e.target.value; if (place in mockPlaces) setControls({ ...controls, place: place as keyof typeof mockPlaces }); }}>{Object.keys(mockPlaces).map(place => <option key={place}>{place}</option>)}</select></label>
      <label className="col-span-2 space-y-1"><span className="flex justify-between"><span>Spending pace</span><span className="font-semibold tabular-nums">{(controls.spendPace ?? 1).toFixed(2)}× · {spendPaceLabel(controls.spendPace ?? 1)}</span></span><input aria-label="Spending pace" type="range" min={0.6} max={1.4} step={0.05} className="w-full accent-primary" value={controls.spendPace ?? 1} onChange={e => setControls({ ...controls, spendPace: Number(e.target.value) })} /></label>
      {(['coffee','food','grocery','online','ride'] as ModelCategory[]).map(category => <label key={category} className="space-y-1 capitalize">{category} hours ago<Input aria-label={`Hours since last ${category}`} type="number" min={0} step={1} value={controls.hoursSinceLast[category]} onChange={e => setControls({ ...controls, hoursSinceLast: { ...controls.hoursSinceLast, [category]: Math.max(0, Number(e.target.value)) } })} /></label>)}
    </div>
    {locationStatus && <p className="mt-3 text-xs text-muted-foreground">{locationStatus}</p>}
    <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setControls(null); setPanelOpen(false); }}><RotateCcw />Use current time</Button>
  </section>;
}
