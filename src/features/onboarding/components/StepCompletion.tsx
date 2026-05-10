import { UserProfile } from "@/domains/onboarding/types";
import { useI18n } from "@/i18n";

interface StepCompletionProps {
  profile: UserProfile;
}

export function StepCompletion({ profile }: StepCompletionProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="onboarding-copy">
      <p>
        {t("onboarding.completion.ready", {
          name: profile.displayName ? `${profile.displayName}، ` : "",
        })}
      </p>
      <p>
        {t("onboarding.completion.updateLater")}
      </p>
    </div>
  );
}
