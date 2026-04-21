import { UserProfile } from "@/domains/onboarding/types";

interface StepPrioritiesProps {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
}

const paceOptions = ["gentle", "balanced", "ambitious"] as const;

export function StepPriorities({ profile, onChange }: StepPrioritiesProps): JSX.Element {
  return (
    <div className="onboarding-form-grid">
      <label className="onboarding-field">
        <span>Current focus</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ currentFocus: event.target.value })}
          placeholder="What matters most right now?"
          value={profile.currentFocus ?? ""}
        />
      </label>

      <label className="onboarding-field">
        <span>Biggest challenge</span>
        <textarea
          className="auth-form__input onboarding-textarea"
          onChange={(event) => onChange({ biggestChallenge: event.target.value })}
          placeholder="What tends to get in the way?"
          value={profile.biggestChallenge ?? ""}
        />
      </label>

      <fieldset className="onboarding-choice-group">
        <legend>Preferred pace</legend>
        <div className="onboarding-choice-grid onboarding-choice-grid--triple">
          {paceOptions.map((option) => (
            <button
              key={option}
              className={
                profile.preferredPace === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ preferredPace: option })}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
