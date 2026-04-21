import { useAuthStore } from "@/state/auth.store";
import { useGreeting } from "@/hooks/useGreeting";

export function PageGreeting(): JSX.Element {
  const displayName = useAuthStore((state) => state.session?.displayName);
  const { greetingText } = useGreeting(displayName);

  return <h1 className="page-greeting">{greetingText}</h1>;
}
