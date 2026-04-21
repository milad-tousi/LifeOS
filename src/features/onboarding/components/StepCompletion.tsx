import { UserProfile } from "@/domains/onboarding/types";

interface StepCompletionProps {
  profile: UserProfile;
}

export function StepCompletion({ profile }: StepCompletionProps): JSX.Element {
  return (
    <div className="onboarding-copy">
      <p>
        {profile.displayName ? `${profile.displayName}, your` : "Your"} setup is ready. LifeOS can
        now shape reminders, pacing, and future planning around the rhythms you shared.
      </p>
      <p>
        You can update any of these preferences later, but this is enough to start with a more
        personal experience.
      </p>
    </div>
  );
}
