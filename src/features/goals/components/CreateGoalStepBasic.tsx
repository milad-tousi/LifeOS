import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">{t("goals.createFlow.basic.title")}</h3>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="goal-title">
          {t("goals.createFlow.basic.goalTitle")}
        </label>
        <input
          className="auth-form__input"
          id="goal-title"
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={t("goals.createFlow.basic.goalTitlePlaceholder")}
          value={title}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="goal-description">
          {t("goals.createFlow.basic.description")}
        </label>
        <textarea
          className="auth-form__input onboarding-textarea"
          id="goal-description"
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder={t("goals.createFlow.basic.descriptionPlaceholder")}
          value={description}
        />
      </div>
    </section>
  );
}
