/** Pure helpers for the For You "picked for" line and top-pick reason. */
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatClock(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function pickedForLabel(dayOfWeek: number, hour: number, place?: string): string {
  return `Picked for ${days[dayOfWeek]} ${formatClock(hour)}${place ? ` · ${place}` : ""}`;
}

export function timeOfDayPhrase(hour: number): string {
  if (hour >= 5 && hour < 11) return "Morning coffee time";
  if (hour >= 11 && hour < 15) return "Lunchtime";
  if (hour >= 15 && hour < 21) return "Dinnertime";
  return "Late night";
}

const shortHour = (hour: number) => `${Math.floor(hour) % 12 || 12}${hour % 1 ? ":30" : ""} ${hour >= 12 ? "PM" : "AM"}`;

export type ReasonInput = {
  hour: number;
  category: string;
  atUsualTime: boolean;
  usualHour?: number | undefined;
  online?: boolean | undefined;
  distanceMiles?: number | undefined;
  expiresInDays?: number | undefined;
  renews?: boolean | undefined;
  hideDistance?: boolean | undefined;
  merchant?: string | undefined;
};

/** Reason uses visit rate (usual time) and location only; points only via a near expiry. */
export function pickReason(r: ReasonInput): string {
  const miles = Number((r.distanceMiles ?? 0).toFixed(1));
  const near = (r.distanceMiles ?? 0) < 0.05; // "0 mi away" reads oddly, so say "right here"
  let text: string;
  if (r.category === "ride") {
    const when = r.atUsualTime && r.usualHour !== undefined ? `You usually head home around ${shortHour(r.usualHour)}` : "Heading out";
    text = r.hideDistance ? `${when}.` : `${when}, and a ${r.merchant ?? "ride"} is ${near ? "right here" : `${miles} mi away`}.`;
  } else if (r.online) {
    text = r.atUsualTime && r.usualHour !== undefined ? `You often shop online around ${shortHour(r.usualHour)}.` : "You can use this one online, from anywhere.";
  } else {
    const when = r.category === "food" ? timeOfDayPhrase(r.hour) : r.atUsualTime && r.usualHour !== undefined ? `It’s around your usual ${shortHour(r.usualHour)} ${r.category}` : timeOfDayPhrase(r.hour);
    const where = r.category === "food" && r.merchant
      ? (near ? `and ${r.merchant} is right here` : `and ${r.merchant} is ${miles} mi away`)
      : (near ? "and you’re right here" : `and you’re ${miles} mi away`);
    text = r.hideDistance ? `${when}.` : `${when}, ${where}.`;
  }
  const d = r.expiresInDays;
  if (d !== undefined && Number.isFinite(d) && d >= 0 && d <= 7) {
    const action = r.renews ? "Renews" : "Expires";
    text += d === 0 ? ` ${action} today.` : d === 1 ? ` ${action} tomorrow.` : ` ${action} in ${d} days.`;
  }
  return text;
}
