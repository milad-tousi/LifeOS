import { UserProfile } from "@/domains/onboarding/types";

interface StepProfileProps {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
}

const ageRangeOptions = [
  "under_18",
  "18_24",
  "25_34",
  "35_44",
  "45_54",
  "55_plus",
] as const;

const occupationOptions = [
  "student",
  "employee",
  "freelancer",
  "business_owner",
  "job_seeker",
  "other",
] as const;

const workStyleOptions = ["fixed", "flexible", "shift", "remote", "onsite", "hybrid"] as const;

export function StepProfile({ profile, onChange }: StepProfileProps): JSX.Element {
  return (
    <div className="onboarding-form-grid">
      <label className="onboarding-field">
        <span>Name</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ displayName: event.target.value })}
          placeholder="What should LifeOS call you?"
          value={profile.displayName}
        />
      </label>

      <label className="onboarding-field">
        <span>Country</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ country: event.target.value })}
          placeholder="Country"
          value={profile.country ?? ""}
        />
      </label>

      <label className="onboarding-field">
        <span>Timezone</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ timezone: event.target.value })}
          value={profile.timezone}
        />
      </label>

      <label className="onboarding-field">
        <span>Language</span>
        <input
          className="auth-form__input"
          onChange={(event) => onChange({ language: event.target.value })}
          value={profile.language}
        />
      </label>

      <fieldset className="onboarding-choice-group">
        <legend>Age range</legend>
        <div className="onboarding-choice-grid">
          {ageRangeOptions.map((option) => (
            <button
              key={option}
              className={
                profile.ageRange === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ ageRange: option })}
              type="button"
            >
              {option.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding-choice-group">
        <legend>Occupation</legend>
        <div className="onboarding-choice-grid">
          {occupationOptions.map((option) => (
            <button
              key={option}
              className={
                profile.occupationType === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ occupationType: option })}
              type="button"
            >
              {option.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding-choice-group">
        <legend>Work style</legend>
        <div className="onboarding-choice-grid">
          {workStyleOptions.map((option) => (
            <button
              key={option}
              className={
                profile.workStyle === option
                  ? "onboarding-choice onboarding-choice--active"
                  : "onboarding-choice"
              }
              onClick={() => onChange({ workStyle: option })}
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
