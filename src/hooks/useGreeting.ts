import { useEffect, useMemo, useState } from "react";
import { getGreetingPeriod, GreetingPeriod } from "@/lib/date";

interface UseGreetingResult {
  greetingText: string;
  greetingPeriod: GreetingPeriod;
}

function buildGreeting(period: GreetingPeriod, displayName?: string): string {
  const baseGreeting = `Good ${period}`;

  return displayName?.trim() ? `${baseGreeting}, ${displayName.trim()}` : baseGreeting;
}

export function useGreeting(displayName?: string): UseGreetingResult {
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
      greetingText: buildGreeting(greetingPeriod, displayName),
    };
  }, [displayName, now]);
}
