import { GoalPace, GoalPriority } from "@/domains/goals/types";

interface CreateGoalStepMetaProps {
  deadline?: string;
  pace: GoalPace;
  priority: GoalPriority;
  onChange: (patch: { pace?: GoalPace; priority?: GoalPriority; deadline?: string }) => void;
}

export function CreateGoalStepMeta({
  deadline,
  onChange,
  pace,
  priority,
}: CreateGoalStepMetaProps): JSX.Element {
  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">Set the pace and timing</h3>

      <div className="auth-form__field">
        <span className="auth-form__label">Pace</span>
        <div className="onboarding-choice-grid onboarding-choice-grid--triple">
          {(["gentle", "balanced", "ambitious"] as GoalPace[]).map((value) => (
            <button
              className={pace === value ? "onboarding-choice onboarding-choice--active" : "onboarding-choice"}
              key={value}
              onClick={() => onChange({ pace: value })}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="auth-form__field">
        <span className="auth-form__label">Priority</span>
        <div className="onboarding-choice-grid onboarding-choice-grid--triple">
          {(["low", "medium", "high"] as GoalPriority[]).map((value) => (
            <button
              className={
                priority === value ? "onboarding-choice onboarding-choice--active" : "onboarding-choice"
              }
              key={value}
              onClick={() => onChange({ priority: value })}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="goal-deadline">
          Deadline
        </label>
        <input
          className="auth-form__input onboarding-input--compact"
          id="goal-deadline"
          onChange={(event) => onChange({ deadline: event.target.value || undefined })}
          type="date"
          value={deadline ?? ""}
        />
      </div>
    </section>
  );
}
