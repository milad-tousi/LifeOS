import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { LoginInput } from "@/domains/auth/types";

interface LoginFormProps {
  error?: string;
  isLoading?: boolean;
  onSubmit: (input: LoginInput) => Promise<void>;
}

export function LoginForm({
  error,
  isLoading = false,
  onSubmit,
}: LoginFormProps): JSX.Element {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setValidationError("Email or username and password are required.");
      return;
    }

    setValidationError("");
    await onSubmit({
      identifier: identifier.trim(),
      password,
    });
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="identifier">
          Email or username
        </label>
        <input
          autoComplete="username"
          className="auth-form__input"
          id="identifier"
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="you@example.com"
          value={identifier}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="auth-form__input"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </div>

      {validationError || error ? (
        <p className="auth-form__error">{validationError || error}</p>
      ) : null}

      <Button fullWidth disabled={isLoading} type="submit">
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
