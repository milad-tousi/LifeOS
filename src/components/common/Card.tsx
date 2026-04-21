import { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
}

export function Card({ children, subtitle, title }: CardProps): JSX.Element {
  return (
    <section className="card">
      {(title || subtitle) && (
        <header className="card__header">
          {title && <h2 className="card__title">{title}</h2>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
