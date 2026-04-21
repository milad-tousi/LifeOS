import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLocalSettings } from "@/hooks/useLocalSettings";

export type SidebarMode = "expanded" | "collapsed" | "hidden";

const DESKTOP_BREAKPOINT = 1024;

function getIsDesktop(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth >= DESKTOP_BREAKPOINT;
}

export function useSidebar() {
  const location = useLocation();
  const [desktopMode, setDesktopMode] = useLocalSettings<SidebarMode>(
    "lifeos.navigation.desktopMode",
    "expanded",
  );
  const [isDesktop, setIsDesktop] = useState<boolean>(getIsDesktop);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleResize(): void {
      setIsDesktop(getIsDesktop());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const state = useMemo(
    () => ({
      isDesktop,
      desktopMode,
      isMobileMenuOpen,
      setDesktopMode,
      openMobileMenu: () => setIsMobileMenuOpen(true),
      closeMobileMenu: () => setIsMobileMenuOpen(false),
      toggleMobileMenu: () => setIsMobileMenuOpen((current) => !current),
    }),
    [desktopMode, isDesktop, isMobileMenuOpen, setDesktopMode],
  );

  return state;
}
