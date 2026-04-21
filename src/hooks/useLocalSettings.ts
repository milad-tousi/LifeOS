import { useEffect, useState } from "react";

export function useLocalSettings<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return initialValue;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

