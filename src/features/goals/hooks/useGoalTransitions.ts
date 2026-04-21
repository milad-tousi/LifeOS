import { useMemo, useState } from "react";

export interface GoalTransitionState {
  activeIndex: number;
  direction: "forward" | "backward";
  setActiveIndex: (nextIndex: number) => void;
  panelStyle: {
    transform: string;
  };
}

export function useGoalTransitions(totalItems: number): GoalTransitionState {
  const [activeIndex, setActiveIndexState] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  function setActiveIndex(nextIndex: number): void {
    if (totalItems === 0) {
      setActiveIndexState(0);
      return;
    }

    const boundedIndex = Math.max(0, Math.min(nextIndex, totalItems - 1));
    setDirection(boundedIndex >= activeIndex ? "forward" : "backward");
    setActiveIndexState(boundedIndex);
  }

  const panelStyle = useMemo(
    () => ({
      transform: `translateX(calc(${activeIndex * -100}% - ${activeIndex}rem))`,
    }),
    [activeIndex],
  );

  return {
    activeIndex,
    direction,
    setActiveIndex,
    panelStyle,
  };
}
