import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { CreateAccountInput } from "@/domains/auth/types";

interface StepAccountProps {
  error?: string;
  isLoading?: boolean;
  onSubmit: (input: CreateAccountInput) => Promise<void>;
}

export function StepAccount({
  error,
  isLoading = false,
  onSubmit,
}: StepAccountProps): JSX.Element {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setValidationError("Display name, email, and password are required.");
      return;
    }

    if (!email.includes("@")) {
      setValidationError("Enter a valid email address.");
      return;
    }

    if (password.trim().length < 6) {
      setValidationError("Use at least 6 characters for the password.");
      return;
    }

    setValidationError("");
    await onSubmit({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    });
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-display-name">
          Display name
        </label>
        <input
          autoComplete="name"
          className="auth-form__input"
          id="signup-display-name"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="What should LifeOS call you?"
          value={displayName}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="auth-form__input"
          id="signup-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="signup-password">
          Password
        </label>
        <input
          autoComplete="new-password"
          className="auth-form__input"
          id="signup-password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </div>

      {validationError || error ? (
        <p className="auth-form__error">{validationError || error}</p>
      ) : null}

      <Button fullWidth disabled={isLoading} type="submit">
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
