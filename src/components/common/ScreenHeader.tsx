interface ScreenHeaderProps {
  title: string;
  description?: string;
}

export function ScreenHeader({ description, title }: ScreenHeaderProps): JSX.Element {
  return (
    <header className="screen-header">
      <h2 className="screen-header__title">{title}</h2>
      {description ? <p className="screen-header__description">{description}</p> : null}
    </header>
  );
}
