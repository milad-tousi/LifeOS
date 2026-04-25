import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import {
  BodyMetricLog,
  BodyMetricLogInput,
} from "@/features/health/types/health.types";

interface BodyMetricFormProps {
  onSave: (input: BodyMetricLogInput) => void;
  todayLog: BodyMetricLog | null;
}

interface BodyMetricFormState {
  weightKg: string;
  heightCm: string;
  bodyFatPercent: string;
  muscleMassKg: string;
  waistCm: string;
  chestCm: string;
  armCm: string;
  legCm: string;
  note: string;
}

type BodyMetricFormErrors = Partial<Record<keyof BodyMetricFormState, string>>;

const EMPTY_FORM_STATE: BodyMetricFormState = {
  weightKg: "",
  heightCm: "",
  bodyFatPercent: "",
  muscleMassKg: "",
  waistCm: "",
  chestCm: "",
  armCm: "",
  legCm: "",
  note: "",
};

export function BodyMetricForm({
  onSave,
  todayLog,
}: BodyMetricFormProps): JSX.Element {
  const [formState, setFormState] = useState<BodyMetricFormState>(() =>
    getFormStateFromLog(todayLog),
  );
  const [errors, setErrors] = useState<BodyMetricFormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState(getFormStateFromLog(todayLog));
    setErrors({});
    setSuccessMessage("");
  }, [todayLog]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const nextErrors = validateForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage("");
      return;
    }

    onSave({
      weightKg: parseOptionalNumber(formState.weightKg),
      heightCm: parseOptionalNumber(formState.heightCm),
      bodyFatPercent: parseOptionalNumber(formState.bodyFatPercent),
      muscleMassKg: parseOptionalNumber(formState.muscleMassKg),
      waistCm: parseOptionalNumber(formState.waistCm),
      chestCm: parseOptionalNumber(formState.chestCm),
      armCm: parseOptionalNumber(formState.armCm),
      legCm: parseOptionalNumber(formState.legCm),
      note: formState.note.trim(),
    });
    setSuccessMessage("Today's body metrics were saved.");
  }

  function resetForm(): void {
    setFormState(getFormStateFromLog(todayLog));
    setErrors({});
    setSuccessMessage("");
  }

  function updateField(field: keyof BodyMetricFormState, value: string): void {
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <Card
      title="Body Metric Log"
      subtitle="Save today's measurements locally for trend tracking."
    >
      <form className="health-form body-metric-form" onSubmit={handleSubmit}>
        <BodyMetricInput
          error={errors.weightKg}
          label="Weight kg"
          onChange={(value) => updateField("weightKg", value)}
          placeholder="78"
          value={formState.weightKg}
        />
        <BodyMetricInput
          error={errors.heightCm}
          label="Height cm"
          onChange={(value) => updateField("heightCm", value)}
          placeholder="178"
          value={formState.heightCm}
        />
        <BodyMetricInput
          error={errors.bodyFatPercent}
          label="Body fat %"
          onChange={(value) => updateField("bodyFatPercent", value)}
          placeholder="18"
          value={formState.bodyFatPercent}
        />
        <BodyMetricInput
          error={errors.muscleMassKg}
          label="Muscle mass kg"
          onChange={(value) => updateField("muscleMassKg", value)}
          placeholder="34"
          value={formState.muscleMassKg}
        />
        <BodyMetricInput
          error={errors.waistCm}
          label="Waist cm"
          onChange={(value) => updateField("waistCm", value)}
          placeholder="84"
          value={formState.waistCm}
        />
        <BodyMetricInput
          error={errors.chestCm}
          label="Chest cm"
          onChange={(value) => updateField("chestCm", value)}
          placeholder="98"
          value={formState.chestCm}
        />
        <BodyMetricInput
          error={errors.armCm}
          label="Arm cm"
          onChange={(value) => updateField("armCm", value)}
          placeholder="34"
          value={formState.armCm}
        />
        <BodyMetricInput
          error={errors.legCm}
          label="Leg cm"
          onChange={(value) => updateField("legCm", value)}
          placeholder="58"
          value={formState.legCm}
        />

        <label className="auth-form__field health-form__field health-form__field--wide">
          <span className="auth-form__label">Note</span>
          <textarea
            className="auth-form__input health-form__note"
            onChange={(event) => updateField("note", event.target.value)}
            placeholder="Measurement context, training phase, or anything worth remembering"
            value={formState.note}
          />
        </label>

        <div className="health-form__footer">
          <div className="health-form__feedback" aria-live="polite">
            {successMessage ? <p>{successMessage}</p> : null}
          </div>
          <div className="health-form__actions">
            <Button onClick={resetForm} type="button" variant="secondary">
              Reset form
            </Button>
            <Button type="submit">Save body metrics</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

interface BodyMetricInputProps {
  error: string | undefined;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

function BodyMetricInput({
  error,
  label,
  onChange,
  placeholder,
  value,
}: BodyMetricInputProps): JSX.Element {
  return (
    <label className="auth-form__field health-form__field">
      <span className="auth-form__label">{label}</span>
      <input
        className="auth-form__input"
        inputMode="decimal"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step="0.1"
        type="number"
        value={value}
      />
      {error ? <p className="auth-form__error">{error}</p> : null}
    </label>
  );
}

function validateForm(formState: BodyMetricFormState): BodyMetricFormErrors {
  const errors: BodyMetricFormErrors = {
    weightKg: validateRange(formState.weightKg, 20, 300, "Weight"),
    heightCm: validateRange(formState.heightCm, 80, 250, "Height"),
    bodyFatPercent: validateRange(formState.bodyFatPercent, 1, 80, "Body fat"),
    muscleMassKg: validateRange(formState.muscleMassKg, 5, 200, "Muscle mass"),
    waistCm: validateRange(formState.waistCm, 1, 300, "Waist"),
    chestCm: validateRange(formState.chestCm, 1, 300, "Chest"),
    armCm: validateRange(formState.armCm, 1, 300, "Arm"),
    legCm: validateRange(formState.legCm, 1, 300, "Leg"),
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value !== undefined),
  );
}

function validateRange(
  value: string,
  min: number,
  max: number,
  label: string,
): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return `${label} must be a valid number.`;
  }

  if (parsedValue < min || parsedValue > max) {
    return `${label} must be between ${min} and ${max}.`;
  }

  return undefined;
}

function getFormStateFromLog(log: BodyMetricLog | null): BodyMetricFormState {
  if (!log) {
    return EMPTY_FORM_STATE;
  }

  return {
    weightKg: numberToInputValue(log.weightKg),
    heightCm: numberToInputValue(log.heightCm),
    bodyFatPercent: numberToInputValue(log.bodyFatPercent),
    muscleMassKg: numberToInputValue(log.muscleMassKg),
    waistCm: numberToInputValue(log.waistCm),
    chestCm: numberToInputValue(log.chestCm),
    armCm: numberToInputValue(log.armCm),
    legCm: numberToInputValue(log.legCm),
    note: log.note,
  };
}

function parseOptionalNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function numberToInputValue(value: number): string {
  return value > 0 ? value.toString() : "";
}
