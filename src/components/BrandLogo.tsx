import { partnerLogo } from "@/lib/rewards";
import { Coffee, Utensils, ShoppingBasket, Globe, Landmark } from "lucide-react";
import { BANK_NAME } from "@/lib/app-config";

export function BrandLogo({ name, className = "h-12 w-12" }: { name: string; className?: string }) {
  const logo = partnerLogo[name];
  const Icon = name === BANK_NAME ? Landmark : name === "Campus Brew" ? Coffee : name === "Campus Grill" ? Utensils : name === "Fresh Basket" ? ShoppingBasket : Globe;
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-card ring-1 ring-border ${className}`}>{logo ? <img src={logo} alt={`${name} logo`} className="h-3/4 w-3/4 object-contain" /> : <Icon aria-label={name} className="h-1/2 w-1/2 text-success" />}</span>;
}