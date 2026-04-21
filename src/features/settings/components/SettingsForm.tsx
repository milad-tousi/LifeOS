import { Card } from "@/components/common/Card";
import { AppSetting } from "@/domains/settings/types";

interface SettingsFormProps {
  settings: AppSetting[];
}

export function SettingsForm({ settings }: SettingsFormProps): JSX.Element {
  return (
    <Card title="Settings" subtitle="Local preferences and future device-specific options">
      <p className="muted" style={{ marginTop: 0 }}>
        Store only what the app truly needs. Compact keys and plain values are preferred.
      </p>
      <div className="stack">
        {settings.length === 0 ? (
          <span className="muted">No persisted settings yet.</span>
        ) : (
          settings.map((setting) => (
            <div key={setting.id} className="row">
              <strong>{setting.key}</strong>
              <span className="muted">{setting.value}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

