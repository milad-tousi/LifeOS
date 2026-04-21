import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CreateGoalFlow } from "@/features/goals/components/CreateGoalFlow";

export function CreateGoalPage(): JSX.Element {
  return (
    <>
      <ScreenHeader
        description="Create one meaningful goal, then anchor progress in real tasks."
        title="Create goal"
      />
      <CreateGoalFlow />
    </>
  );
}
