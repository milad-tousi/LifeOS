import { PropsWithChildren } from "react";

export function PageContainer({ children }: PropsWithChildren): JSX.Element {
  return <main className="page-container">{children}</main>;
}
