import { Card } from "@/components/common/Card";

export function TaskComposer(): JSX.Element {
  return (
    <Card title="Task composer" subtitle="Placeholder surface for future task creation UX">
      <p className="muted" style={{ margin: 0 }}>
        Keep this area lean: optimistic local writes should go straight to Dexie through the task
        repository.
      </p>
    </Card>
  );
}

