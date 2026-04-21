import { ChevronLeft, ChevronRight } from "lucide-react";
import { GoalCard } from "@/features/goals/components/GoalCard";
import { useGoalTransitions } from "@/features/goals/hooks/useGoalTransitions";
import { GoalCardData } from "@/features/goals/hooks/useGoals";

interface GoalCarouselProps {
  goals: GoalCardData[];
  onOpenGoal: (goalId: string) => void;
}

export function GoalCarousel({ goals, onOpenGoal }: GoalCarouselProps): JSX.Element {
  const transitions = useGoalTransitions(goals.length);

  return (
    <section className="goal-carousel">
      <div className="goal-carousel__viewport">
        <div
          className={`goal-carousel__track goal-carousel__track--${transitions.direction}`}
          style={transitions.panelStyle}
        >
          {goals.map((goalData, index) => (
            <div className="goal-carousel__slide" key={goalData.goal.id}>
              <GoalCard
                data={goalData}
                isActive={index === transitions.activeIndex}
                onClick={() => onOpenGoal(goalData.goal.id)}
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
            <ChevronLeft size={18} />
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
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
