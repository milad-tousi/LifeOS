import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GoalCard } from "@/features/goals/components/GoalCard";
import { useGoalTransitions } from "@/features/goals/hooks/useGoalTransitions";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import { useI18n } from "@/i18n";

interface GoalCarouselProps {
  goals: GoalCardData[];
  onDeleteGoal: (goalId: string) => void;
  onOpenGoal: (goalId: string) => void;
}

export function GoalCarousel({ goals, onDeleteGoal, onOpenGoal }: GoalCarouselProps): JSX.Element {
  const transitions = useGoalTransitions(goals.length);
  const { direction } = useI18n();
  const isRtl = direction === "rtl";

  // ── Touch swipe ──────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent): void {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent): void {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Ignore vertical scrolls
    if (Math.abs(dy) > Math.abs(dx)) return;
    // Minimum swipe distance
    if (Math.abs(dx) < 40) return;

    // In RTL: swipe right → next, swipe left → prev (visual direction)
    if (isRtl) {
      if (dx > 0) transitions.setActiveIndex(transitions.activeIndex - 1);
      else transitions.setActiveIndex(transitions.activeIndex + 1);
    } else {
      if (dx < 0) transitions.setActiveIndex(transitions.activeIndex + 1);
      else transitions.setActiveIndex(transitions.activeIndex - 1);
    }
  }

  return (
    <section className="goal-carousel">
      <div
        className="goal-carousel__viewport"
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`goal-carousel__track goal-carousel__track--${transitions.direction}`}
          dir="ltr"
          style={transitions.panelStyle}
        >
          {goals.map((goalData, index) => (
            <div className="goal-carousel__slide" key={goalData.goal.id}>
              <GoalCard
                data={goalData}
                isActive={index === transitions.activeIndex}
                onClick={() => onOpenGoal(goalData.goal.id)}
                onDelete={() => onDeleteGoal(goalData.goal.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {goals.length > 1 ? (
        <div className="goal-carousel__controls">
          <button
            aria-label="Previous goal"
            className="icon-button"
            onClick={() => transitions.setActiveIndex(transitions.activeIndex - 1)}
            type="button"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <div className="goal-carousel__dots">
            {goals.map((goalData, index) => (
              <button
                aria-label={`View ${goalData.goal.title}`}
                className={
                  index === transitions.activeIndex
                    ? "goal-carousel__dot goal-carousel__dot--active"
                    : "goal-carousel__dot"
                }
                key={goalData.goal.id}
                onClick={() => transitions.setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>

          <button
            aria-label="Next goal"
            className="icon-button"
            onClick={() => transitions.setActiveIndex(transitions.activeIndex + 1)}
            type="button"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      ) : null}
    </section>
  );
}
