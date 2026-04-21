import { PropsWithChildren } from "react";
import { initializeSeedData } from "@/db/seed";

initializeSeedData().catch(() => {
  // Seed remains optional in the starter.
});

export function AppProviders({ children }: PropsWithChildren): JSX.Element {
  return <>{children}</>;
}

