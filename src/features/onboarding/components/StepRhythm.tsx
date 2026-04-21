import { UserProfile } from "@/domains/onboarding/types";

interface StepRhythmProps {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
}

const energyOptions = ["early_bird", "balanced", "night_owl"] as const;

export function StepRhythm({ profile, onChange }: StepRhythmProps): JSX.Element {
  return (
    <div className="onboarding-form-grid">
      <label className="onboarding-field">
        <span>Wake time</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ wakeTime: event.target.value })}
          type="time"
          value={profile.wakeTime ?? ""}
        />
      </label>

      <label className="onboarding-field">
        <span>Sleep time</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ sleepTime: event.target.value })}
          type="time"
          value={profile.sleepTime ?? ""}
        />
      </label>

      <fieldset className="onboarding-choice-group">
        <legend>Energy type</legend>
        <div className="onboarding-choice-grid onboarding-choice-grid--triple">
          {energyOptions.map((option) => (
            <button
              key={option}
              className={
                profile.energyType === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ energyType: option })}
              type="button"
            >
              {option.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
