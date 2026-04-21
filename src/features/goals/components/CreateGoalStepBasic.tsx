interface CreateGoalStepBasicProps {
  description: string;
  title: string;
  onChange: (patch: { title?: string; description?: string }) => void;
}

export function CreateGoalStepBasic({
  description,
  onChange,
  title,
}: CreateGoalStepBasicProps): JSX.Element {
  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">What do you want to achieve?</h3>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="goal-title">
          Goal title
        </label>
        <input
          className="auth-form__input"
          id="goal-title"
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Build a calm evening routine"
          value={title}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="goal-description">
          Description
        </label>
        <textarea
          className="auth-form__input onboarding-textarea"
          id="goal-description"
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Add a short note to keep the goal grounded."
          value={description}
        />
      </div>
    </section>
  );
}
