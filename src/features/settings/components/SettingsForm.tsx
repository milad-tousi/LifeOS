import { Card } from "@/components/common/Card";
import { AppSetting } from "@/domains/settings/types";

interface SettingsFormProps {
  settings: AppSetting[];
}

export function SettingsForm({ settings }: SettingsFormProps): JSX.Element {
  return (
    <Card title="Settings" subtitle="Local preferences and future device-specific options">
      <p className="text-muted">Store only what the app truly needs. Compact values are preferred.</p>
      <div className="page-list">
        {settings.length === 0 ? (
          <span className="text-muted">No persisted settings yet.</span>
        ) : (
          settings.map((setting) => (
            <div key={setting.key} className="page-list__item">
              <strong>{setting.key}</strong>
              <span className="text-muted">{formatSettingValue(setting.value)}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function formatSettingValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value == null) {
    return "";
  }

  return JSON.stringify(value);
}
