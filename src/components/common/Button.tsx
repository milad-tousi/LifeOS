import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  fullWidth = false,
  variant = "primary",
  ...props
}: ButtonProps): JSX.Element {
  const variantClass = `button button--${variant}`;
  const classes = [variantClass, className].filter(Boolean).join(" ");

  return (
    <button className={classes} style={{ width: fullWidth ? "100%" : undefined }} {...props}>
      {children}
    </button>
  );
}
