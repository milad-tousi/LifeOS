import {
  Banknote,
  BriefcaseBusiness,
  Bus,
  Clapperboard,
  Gift,
  HandCoins,
  HeartPulse,
  Landmark,
  LucideIcon,
  Receipt,
  Salad,
  ShoppingBag,
  Sparkles,
  Train,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

const FINANCE_ICON_MAP: Record<string, LucideIcon> = {
  bills: Receipt,
  entertainment: Clapperboard,
  food: UtensilsCrossed,
  freelance: BriefcaseBusiness,
  gift: Gift,
  grocery: Salad,
  health: HeartPulse,
  investment: TrendingUp,
  other: Sparkles,
  salary: Banknote,
  shopping: ShoppingBag,
  transport: Train,
  travel: Bus,
  wallet: Landmark,
  income: HandCoins,
};

export function getFinanceIcon(icon: string): LucideIcon {
  return FINANCE_ICON_MAP[icon] ?? Sparkles;
}
