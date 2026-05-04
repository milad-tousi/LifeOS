import { useEffect, useMemo, useState } from "react";
import { getGreetingPeriod, GreetingPeriod } from "@/lib/date";
import { useI18n } from "@/i18n";
import { TranslationKey } from "@/i18n/i18n.types";

interface UseGreetingResult {
  greetingText: string;
  greetingPeriod: GreetingPeriod;
}

function buildGreeting(period: GreetingPeriod, t: (key: TranslationKey) => string, displayName?: string): string {
  const baseGreeting = t(getGreetingKey(period));

  return displayName?.trim() ? `${baseGreeting}, ${displayName.trim()}` : baseGreeting;
}

export function useGreeting(displayName?: string): UseGreetingResult {
  const { t } = useI18n();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    const greetingPeriod = getGreetingPeriod(now);

    return {
      greetingPeriod,
      greetingText: buildGreeting(greetingPeriod, t, displayName),
    };
  }, [displayName, now, t]);
}

function getGreetingKey(period: GreetingPeriod): TranslationKey {
  switch (period) {
    case "morning":
      return "greeting.morning";
    case "afternoon":
      return "greeting.afternoon";
    case "evening":
      return "greeting.evening";
    default:
      return "greeting.night";
  }
}
