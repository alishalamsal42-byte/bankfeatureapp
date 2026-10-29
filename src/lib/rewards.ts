import starbucksLogo from "@/assets/brands/starbucks.svg";
import chickfilaLogo from "@/assets/brands/chickfila.svg";
import tacobellLogo from "@/assets/brands/tacobell.svg";
import tjmaxxAsset from "@/assets/brands/tjmaxx.svg.asset.json";
import uberAsset from "@/assets/brands/uber.svg.asset.json";
import chaseAsset from "@/assets/brands/chase.svg.asset.json";
import lyftAsset from "@/assets/brands/lyft.svg.asset.json";
import amcAsset from "@/assets/brands/amc.svg.asset.json";
import type { OpenHours, ScorableReward } from "./model";
import { mockRewards } from "./model-fixtures";
import { mockPlaces } from "./model-fixtures";
import mcdonaldsLogo from "@/assets/brands/mcdonalds.svg";
import burgerkingLogo from "@/assets/brands/burgerking.svg";
import chipotleLogo from "@/assets/brands/chipotle.svg";
import amazonLogo from "@/assets/brands/amazon.svg";
import bestbuyLogo from "@/assets/brands/bestbuy.svg";
import nikeLogo from "@/assets/brands/nike.svg";
import { appCatalog } from './connection-catalog';
import paneraAsset from '@/assets/brands/panera.svg.asset.json';
import targetAsset from '@/assets/brands/target.svg.asset.json';
import dunkinAsset from '@/assets/brands/dunkin.svg.asset.json';
import wingstopAsset from '@/assets/brands/wingstop.svg.asset.json';
import ultaAsset from '@/assets/brands/ulta.svg.asset.json';
import sephoraAsset from '@/assets/brands/sephora.svg.asset.json';
import publixAsset from '@/assets/brands/publix.svg.asset.json';
import walmartAsset from '@/assets/brands/walmart.svg.asset.json';
import netflixAsset from '@/assets/brands/netflix.svg.asset.json';
import spotifyAsset from '@/assets/brands/spotify.svg.asset.json';

export type Offer = ScorableReward & {
  id: string;
  merchant: string;
  emoji: string;
  category: "Food" | "Coffee" | "Shopping" | "Travel" | "Fun" | "Grocery" | "Online";
  title: string;
  points: number;
  value: number; // dollar value of benefit
  minSpend: number;
  expires: string;
  reason: string;
  distance?: string;
  expiresInDays?: number;
  /** Present when the balance is still saving toward a reward (not yet redeemable). */
  unlock?: { reward: string; goal: number };
  /** Valid hours [start, end) in local 24h time; absent = all day. */
  validHours?: [number, number];
  /** Merchant opening hours; absent = always open (online or not tracked). */
  openHours?: OpenHours;
  /** Subscription credit: show "Renews" instead of "Expires". */
  renews?: boolean;
  /** Bank credit card offer: no merchant balance, the bill is paid with Bank points. */
  bankFunded?: boolean;
};

/** "Renews in 3 days" for subscriptions, "Expires in 3 days" otherwise. */
export function expiryLabel(o: Pick<Offer, "renews" | "expiresInDays">) {
  const d = o.expiresInDays;
  const verb = o.renews ? "Renews" : "Expires";
  return d === 0 ? `${verb} today` : d === 1 ? `${verb} tomorrow` : `${verb} in ${d} days`;
}

/** Cost label: "Use 700 Bank points · $7.00", "750 pts · $5.25", or "$1.80 off" for no-points deals. */
export function offerCostLabel(o: Pick<Offer, "points" | "value" | "minSpend" | "bankFunded">) {
  const v = `$${o.value.toFixed(2)}`;
  if (o.bankFunded) return `Use ${Math.round(Math.max(o.value, o.minSpend) * 100).toLocaleString()} Bank points · ${v}`;
  return o.points ? `${o.points.toLocaleString()} pts · ${v}` : `${v} off`;
}

export const user = { name: "Sarah", school: "UNF", points: 8430, pointValue: 0.01 };

/** Brands the app connects to. */
export const partners = [
  "Starbucks",
  "Chick-fil-A",
  "Taco Bell",
  "TJ Maxx",
  "McDonald's",
  "Burger King",
  "Chipotle",
  "Best Buy",
  "Nike",
] as const;

/** App-icon look for each partner brand: brand color background, contrast text and initials. */
export const partnerStyle: Record<string, { bg: string; fg: string; initials: string }> = {
  Starbucks: { bg: "#006241", fg: "#ffffff", initials: "S" },
  "Chick-fil-A": { bg: "#e51636", fg: "#ffffff", initials: "C" },
  "Taco Bell": { bg: "#702082", fg: "#ffffff", initials: "T" },
  "TJ Maxx": { bg: "#c8102e", fg: "#ffffff", initials: "TJ" },
  "McDonald's": { bg: "#da291c", fg: "#ffc72c", initials: "M" },
  "Burger King": { bg: "#d62300", fg: "#ffffff", initials: "BK" },
  Chipotle: { bg: "#451400", fg: "#ffffff", initials: "C" },
  Amazon: { bg: "#ffffff", fg: "#131921", initials: "a" },
  "Best Buy": { bg: "#0046be", fg: "#ffe000", initials: "BB" },
  Nike: { bg: "#111111", fg: "#ffffff", initials: "N" },
};

/** Official logo for each partner brand. */
export const partnerLogo: Record<string, string> = {
  Panera: paneraAsset.url,
  Target: targetAsset.url,
  'Dunkin’': dunkinAsset.url,
  Wingstop: wingstopAsset.url,
  Ulta: ultaAsset.url,
  Sephora: sephoraAsset.url,
  Publix: publixAsset.url,
  Walmart: walmartAsset.url,
  Netflix: netflixAsset.url,
  Spotify: spotifyAsset.url,
  Starbucks: starbucksLogo,
  "Chick-fil-A": chickfilaLogo,
  "Taco Bell": tacobellLogo,
  "TJ Maxx": tjmaxxAsset.url,
  Uber: uberAsset.url,
  Chase: chaseAsset.url,
  Lyft: lyftAsset.url,
  "AMC Cinema": amcAsset.url,
  "McDonald's": mcdonaldsLogo,
  "Burger King": burgerkingLogo,
  Chipotle: chipotleLogo,
  Amazon: amazonLogo,
  "Best Buy": bestbuyLogo,
  Nike: nikeLogo,
};

const baseOffers = [
  { id: "coffee", merchant: "Starbucks", emoji: "☕", category: "Coffee", title: "Free drink", points: 750, value: 5.25, minSpend: 0, expires: "Tomorrow", reason: "Coffee at the Library", distance: "Library" },
  { id: "cfa", merchant: "Chick-fil-A", emoji: "🐔", category: "Food", title: "Free sandwich", points: 1200, value: 6.5, minSpend: 0, expires: "3 days", reason: "You usually go on Tuesdays" },
  { id: "lunch", merchant: "Chipotle", emoji: "🥗", category: "Food", title: "15% off lunch", points: 0, value: 1.8, minSpend: 0, expires: "2 days", validHours: [11, 15], reason: "Lunch near campus, avg. spend $12", distance: "350 m" },
  { id: "mcd", merchant: "McDonald's", emoji: "🍟", category: "Food", title: "Free McFlurry", points: 380, value: 3.8, minSpend: 0, expires: "30 days", reason: "Your usual Friday order", unlock: { reward: "McFlurry", goal: 500 } },
  { id: "bk", merchant: "Burger King", emoji: "👑", category: "Food", title: "$5 off $15+", points: 0, value: 5, minSpend: 15, expires: "4 days", reason: "Requires spending $3 more than you usually do" },
  { id: "taco", merchant: "Taco Bell", emoji: "🌮", category: "Food", title: "$8 off $25+", points: 0, value: 8, minSpend: 25, expires: "5 days", reason: "Requires spending $13 more than you usually do", distance: "900 m" },
  { id: "amazon", merchant: "Amazon", emoji: "📦", category: "Shopping", title: "$10 off your order", points: 0, bankFunded: true, value: 10, minSpend: 0, expires: "2 days", reason: "Expiring soon — don't lose $10 of value" },
  { id: "nike", merchant: "Nike", emoji: "👟", category: "Shopping", title: "20% off shoes", points: 2500, value: 18, minSpend: 0, expires: "14 days", reason: "You browsed running shoes last week" },
  { id: "tjx", merchant: "TJ Maxx", emoji: "🛍️", category: "Shopping", title: "$15 voucher", points: 1500, value: 15, minSpend: 0, expires: "10 days", reason: "New store 5 min from campus" },
  { id: "bb", merchant: "Best Buy", emoji: "🎧", category: "Shopping", title: "$20 off $100+", points: 2000, value: 20, minSpend: 100, expires: "6 days", reason: "Requires spending $88 more than you usually do" },
  { id: "ride", merchant: "Uber", emoji: "🚗", category: "Travel", title: "$3 off a ride", points: 300, value: 3, minSpend: 0, expires: "7 days", reason: "A ride home after class" },
  { id: "lyft", merchant: "Lyft", emoji: "🚗", category: "Travel", title: "$4 off a ride", points: 400, value: 4, minSpend: 0, expires: "7 days", reason: "A ride near campus" },
  { id: "publix", merchant: "Publix", emoji: "", category: "Grocery", title: "$5 off $40+", points: 0, value: 5, minSpend: 40, expires: "6 days", reason: "Your usual grocery run" },
  { id: "walmart", merchant: "Walmart", emoji: "", category: "Grocery", title: "$3 Walmart Cash", points: 300, value: 3, minSpend: 0, expires: "14 days", reason: "Groceries near Town Center" },
  { id: "netflix", merchant: "Netflix", emoji: "", category: "Online", title: "$7 off your next bill", points: 0, bankFunded: true, value: 7, minSpend: 0, expires: "3 days", renews: true, reason: "Your plan renews soon" },
  { id: "spotify", merchant: "Spotify", emoji: "", category: "Online", title: "$6 off Premium Student", points: 0, bankFunded: true, value: 6, minSpend: 0, expires: "5 days", renews: true, reason: "Your plan renews soon" },
  { id: "movie", merchant: "AMC Cinema", emoji: "🎬", category: "Fun", title: "1 ticket", points: 1800, value: 14, minSpend: 0, expires: "30 days", reason: "You spent 15% less on dining this week" },
] satisfies Omit<Offer, "modelCategory" | "historyCategory" | "distanceMiles" | "online">[];

/** Opening hours (close past 24 = after midnight). Opening times are sample values. */
export const openingHours: Record<string, OpenHours> = {
  Starbucks: { open: 5, close: 21 },
  "Chick-fil-A": { open: 6.5, close: 22, closedDays: [0] },
  Chipotle: { open: 10.75, close: 22 },
  "Taco Bell": { open: 7, close: 25 },
  "Burger King": { open: 6, close: 25 },
  Publix: { open: 7, close: 22 },
  Target: { open: 8, close: 22 },
  Walmart: { open: 6, close: 23 },
};

/** Example grocery and online partners, connected by default alongside the main brands. */
export const examplePartnerIds = ["publix", "target", "walmart"] as const;

export const offers: Offer[] = baseOffers.map(o => {
  const modelCategory = o.category === "Coffee" ? "coffee" : o.category === "Food" ? "food" : o.category === "Grocery" ? "grocery" : o.category === "Online" || o.merchant === "Amazon" ? "online" : o.merchant === "Uber" || o.merchant === "Lyft" ? "ride" : undefined;
  const historyCategory = modelCategory ?? (o.category === "Travel" ? "travel" : o.category === "Fun" ? "fun" : "shopping");
  const distances: Record<string, number> = { coffee: 0.075, cfa: 0.4, lunch: 0.2, mcd: 0.7, bk: 1.2, taco: 0.56, ride: 0.05, lyft: 0.08, nike: 1.1, tjx: 0.8, bb: 2, movie: 1.5, publix: 0.8, walmart: 2.4 };
  const expiresInDays = o.expires === "Today" ? 0 : o.expires === "Tomorrow" ? 1 : Number.parseInt(o.expires, 10);
  return { ...o, ...(openingHours[o.merchant] ? { openHours: openingHours[o.merchant] } : {}), ...(o.id === "coffee" ? { mapPoint: mockPlaces.Library } : {}), expiresInDays, modelCategory, historyCategory, distanceMiles: distances[o.id] ?? 0, online: o.merchant === "Amazon" || o.category === "Online" };
});

const fixtureOffers: Offer[] = mockRewards.map(reward => ({
  ...reward,
  category: reward.historyCategory === "coffee" ? "Coffee" : reward.historyCategory === "food" ? "Food" : reward.historyCategory === "grocery" ? "Grocery" : "Online",
  emoji: "", minSpend: 0, expires: "Not specified", reason: "",
  // Demo lunch offer is only valid at lunch, like Chipotle's.
  ...(reward.id === "campus-grill" ? { validHours: [11, 15] as const } : {}),
}));

export const demoOffers: Offer[] = [
  ...offers.filter(reward => reward.id === "coffee" || reward.modelCategory === "ride" || reward.modelCategory === "online" || !reward.modelCategory),
  // Grocery stores sit near the Town Center demo location (Target's demo point is set in the Connect catalog).
  ...offers.filter(reward => reward.id === "publix").map(reward => ({ ...reward, mapPoint: [2.00, 0.50] as const })),
  ...offers.filter(reward => reward.id === "walmart").map(reward => ({ ...reward, mapPoint: [2.30, 0.60] as const })),
  // Taco Bell sits next to the Residence halls on the demo map (as in the Python scenarios), for late-night food.
  ...offers.filter(reward => reward.id === "taco").map(reward => ({ ...reward, mapPoint: [0.48, 0.70] as const })),
  // Amazon (above) is the demo's online reward, so the generic "Online store" fixture is left out.
  ...fixtureOffers.filter(reward => reward.id !== "campus-brew" && reward.id !== "online-store" && reward.id !== "fresh-basket"),
];

export const getOffer = (id: string) => [...offers, ...fixtureOffers, ...appCatalog].find((o) => o.id === id) ?? offers[0] ?? (() => { throw new Error("No rewards available"); })();

/** Net savings = benefit minus extra spend beyond what the user planned. */
export function netSavings(o: Pick<Offer, "value" | "minSpend">, plannedSpend: number) {
  const extra = Math.max(0, o.minSpend - plannedSpend);
  return Math.round((o.value - extra) * 100) / 100;
}

/** A reward is locked while the balance is below its unlock goal. */
export const isLocked = (o: Pick<Offer, "points" | "unlock">) => !!o.unlock && o.points < o.unlock.goal;

/** Progress card: the locked merchant closest to unlocking (fewest points to go). Never a redeemable one. */
export function closestProgress<T extends Pick<Offer, "merchant" | "points" | "unlock">>(apps: T[]) {
  return apps.filter(isLocked).map(o => ({ merchant: o.merchant, reward: o.unlock!.reward, balance: o.points, goal: o.unlock!.goal, toGo: o.unlock!.goal - o.points }))
    .sort((a, b) => a.toGo - b.toGo)[0];
}

/** Official merchant websites for the order handoff. */
export const merchantWebsite: Record<string, string> = {
  Starbucks: "https://www.starbucks.com", "Chick-fil-A": "https://www.chick-fil-a.com", "Taco Bell": "https://www.tacobell.com", "TJ Maxx": "https://tjmaxx.tjx.com",
  "McDonald's": "https://www.mcdonalds.com", "Burger King": "https://www.bk.com", Chipotle: "https://www.chipotle.com", Amazon: "https://www.amazon.com",
  "Best Buy": "https://www.bestbuy.com", Nike: "https://www.nike.com", Uber: "https://www.uber.com", Chase: "https://www.chase.com", Lyft: "https://www.lyft.com",
  Panera: "https://www.panerabread.com", Target: "https://www.target.com", "Dunkin'": "https://www.dunkindonuts.com", Wingstop: "https://www.wingstop.com",
  Ulta: "https://www.ulta.com", Sephora: "https://www.sephora.com", "AMC Cinema": "https://www.amctheatres.com",
};
