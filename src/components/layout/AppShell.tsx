import { PropsWithChildren } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: PropsWithChildren): JSX.Element {
  return (
    <div className="app-shell">
      <TopBar />
      <PageContainer>{children}</PageContainer>
      <BottomNav />
    </div>
  );
}
