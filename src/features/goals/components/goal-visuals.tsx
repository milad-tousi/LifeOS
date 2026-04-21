import {
  BookOpen,
  BriefcaseBusiness,
  HeartPulse,
  Sparkles,
  Wallet,
} from "lucide-react";
import { GoalCategory } from "@/domains/goals/types";

export function renderGoalCategoryIcon(category: GoalCategory): JSX.Element {
  switch (category) {
    case "health":
      return <HeartPulse size={18} strokeWidth={1.9} />;
    case "finance":
      return <Wallet size={18} strokeWidth={1.9} />;
    case "career":
      return <BriefcaseBusiness size={18} strokeWidth={1.9} />;
    case "learning":
      return <BookOpen size={18} strokeWidth={1.9} />;
    case "lifestyle":
      return <Sparkles size={18} strokeWidth={1.9} />;
  }
}
