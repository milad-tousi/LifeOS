import { UserPreferences } from "@/domains/onboarding/types";

interface StepPreferencesProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const toneOptions = ["friendly", "coach", "calm", "direct"] as const;

export function StepPreferences({
  preferences,
  onChange,
}: StepPreferencesProps): JSX.Element {
  return (
    <div className="onboarding-form-grid">
      <fieldset className="onboarding-choice-group">
        <legend>Preferred tone</legend>
        <div className="onboarding-choice-grid">
          {toneOptions.map((option) => (
            <button
              key={option}
              className={
                preferences.tonePreference === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ tonePreference: option })}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="onboarding-field">
        <span>Morning review time</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ morningReviewTime: event.target.value })}
          type="time"
          value={preferences.morningReviewTime ?? ""}
        />
      </label>

      <label className="onboarding-field">
        <span>Evening review time</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ eveningReviewTime: event.target.value })}
          type="time"
          value={preferences.eveningReviewTime ?? ""}
        />
      </label>
    </div>
  );
}
