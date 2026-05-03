import { Card } from "@/components/common/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { SettingsAccount } from "@/features/settings/components/SettingsAccount";
import { SettingsAppearance } from "@/features/settings/components/SettingsAppearance";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";
import { SettingsLanguage } from "@/features/settings/components/SettingsLanguage";
import { useI18n } from "@/i18n";

export function SettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const { isLoading, logout, terminateAccount } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { t } = useI18n();

  async function handleLogout(): Promise<void> {
    await logout();
    resetOnboarding();
    navigate("/login", { replace: true });
  }

  async function handleTerminateAccount(): Promise<void> {
    await terminateAccount();
    resetOnboarding();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <ScreenHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />
      <Card title={t("settings.appearance")}>
        <SettingsAppearance />
        <SettingsLanguage />
      </Card>
      <Card title={t("settings.account")}>
        <SettingsAccount isLoading={isLoading} onLogout={handleLogout} />
      </Card>
      <Card title={t("settings.dangerZone")}>
        <SettingsDangerZone isLoading={isLoading} onTerminate={handleTerminateAccount} />
      </Card>
    </>
  );
}
