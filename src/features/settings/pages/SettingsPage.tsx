import { Card } from "@/components/common/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { SettingsAccount } from "@/features/settings/components/SettingsAccount";
import { SettingsAppearance } from "@/features/settings/components/SettingsAppearance";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";

export function SettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const { isLoading, logout, terminateAccount } = useAuth();
  const { resetOnboarding } = useOnboarding();

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
        title="Settings"
        description="Manage appearance, local account access, and device-only actions."
      />
      <Card title="Appearance">
        <SettingsAppearance />
      </Card>
      <Card title="Account">
        <SettingsAccount isLoading={isLoading} onLogout={handleLogout} />
      </Card>
      <Card title="Danger Zone">
        <SettingsDangerZone isLoading={isLoading} onTerminate={handleTerminateAccount} />
      </Card>
    </>
  );
}
