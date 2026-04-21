import { Outlet } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useSidebar } from "@/hooks/useSidebar";

export function AppShell(): JSX.Element {
  const sidebar = useSidebar();
  const desktopLayoutClass =
    sidebar.isDesktop && sidebar.desktopMode !== "hidden"
      ? `app-shell app-shell--desktop app-shell--${sidebar.desktopMode}`
      : sidebar.isDesktop
        ? "app-shell app-shell--desktop app-shell--hidden"
        : "app-shell app-shell--mobile";

  return (
    <div className={desktopLayoutClass}>
      <Sidebar
        isDesktop={sidebar.isDesktop}
        isOpen={sidebar.isDesktop ? sidebar.desktopMode !== "hidden" : sidebar.isMobileMenuOpen}
        mode={sidebar.desktopMode}
        onCloseMobileMenu={sidebar.closeMobileMenu}
        onExpandSidebar={() => sidebar.setDesktopMode("expanded")}
        onShrinkSidebar={() =>
          sidebar.setDesktopMode(
            sidebar.desktopMode === "expanded" ? "collapsed" : "expanded",
          )
        }
        onHideSidebar={() => sidebar.setDesktopMode("hidden")}
      />

      <div className="app-shell__main">
        <TopBar
          isDesktop={sidebar.isDesktop}
          isSidebarHidden={sidebar.desktopMode === "hidden"}
          isMobileMenuOpen={sidebar.isMobileMenuOpen}
          onMenuClick={() => {
            if (sidebar.isDesktop) {
              sidebar.setDesktopMode("expanded");
              return;
            }

            sidebar.toggleMobileMenu();
          }}
        />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>

      {!sidebar.isDesktop ? <BottomNav /> : null}
    </div>
  );
}
