import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CreateGoalFlow } from "@/features/goals/components/CreateGoalFlow";
import { useI18n } from "@/i18n";

export function CreateGoalPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <>
      <ScreenHeader
        description={t("goals.createFlow.pageSubtitle")}
        title={t("goals.createFlow.pageTitle")}
      />
      <CreateGoalFlow />
    </>
  );
}
