import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addPersianMonths,
  formatPersianDate,
  formatPersianMonth,
  formatPersianNumber,
  getPersianMonthLength,
  getPersianMonthStart,
  getPersianWeekdayIndex,
  PERSIAN_WEEKDAY_NAMES,
  toGregorianDate,
  toPersianDate,
} from "@/i18n/calendars/persianCalendar";
import { useI18n } from "@/i18n";

interface LocalizedDateInputProps {
  className?: string;
  disabled?: boolean;
  id?: string;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}

interface CalendarCell {
  date: Date;
  day: number;
  isoValue: string;
}

export function LocalizedDateInput({
  className = "",
  disabled = false,
  id,
  max,
  min,
  onChange,
  placeholder,
  required = false,
  value,
}: LocalizedDateInputProps): JSX.Element {
  const { language, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => parseIsoDate(value) ?? new Date());
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (language !== "fa") {
    return (
      <input
        className={className}
        disabled={disabled}
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type="date"
        value={value}
      />
    );
  }

  const monthStart = getPersianMonthStart(viewDate);
  const monthParts = toPersianDate(monthStart);
  const daysInMonth = getPersianMonthLength(monthParts.year, monthParts.month);
  const leadingBlanks = getPersianWeekdayIndex(monthStart);
  const cells: Array<CalendarCell | null> = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toGregorianDate({ year: monthParts.year, month: monthParts.month, day });
    const isoValue = formatIsoDate(date);
    cells.push({ date, day, isoValue });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const todayIso = formatIsoDate(new Date());
  const displayText = selectedDate
    ? formatPersianDate(selectedDate, false)
    : placeholder ?? t("common.selectDate");

  function selectIsoDate(nextIsoValue: string): void {
    if (!isDateWithinRange(nextIsoValue, min, max)) {
      return;
    }

    onChange(nextIsoValue);
    setViewDate(parseIsoDate(nextIsoValue) ?? new Date());
    setIsOpen(false);
  }

  return (
    <div className="localized-date-input" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`${className} localized-date-input__trigger${value ? "" : " localized-date-input__trigger--empty"}`}
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <CalendarDays aria-hidden="true" size={16} />
        <span>{displayText}</span>
      </button>

      {isOpen ? (
        <div className="localized-date-input__popover" dir="rtl" role="dialog">
          <div className="localized-date-input__header">
            <button
              aria-label={t("calendar.next")}
              className="localized-date-input__nav"
              onClick={() => setViewDate((current) => addPersianMonths(current, 1))}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
            <strong className="localized-date-input__month">{formatPersianMonth(viewDate)}</strong>
            <button
              aria-label={t("calendar.previous")}
              className="localized-date-input__nav"
              onClick={() => setViewDate((current) => addPersianMonths(current, -1))}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="localized-date-input__weekdays">
            {PERSIAN_WEEKDAY_NAMES.map((weekday) => (
              <span className="localized-date-input__weekday" key={weekday}>
                {weekday}
              </span>
            ))}
          </div>

          <div className="localized-date-input__grid">
            {cells.map((cell, index) =>
              cell ? (
                <button
                  className={`localized-date-input__day${
                    value === cell.isoValue ? " localized-date-input__day--selected" : ""
                  }${todayIso === cell.isoValue ? " localized-date-input__day--today" : ""}`}
                  disabled={!isDateWithinRange(cell.isoValue, min, max)}
                  key={cell.isoValue}
                  onClick={() => selectIsoDate(cell.isoValue)}
                  type="button"
                >
                  {formatPersianNumber(cell.day)}
                </button>
              ) : (
                <span aria-hidden="true" className="localized-date-input__blank" key={`blank-${index}`} />
              ),
            )}
          </div>

          <div className="localized-date-input__actions">
            <button
              className="localized-date-input__action"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              type="button"
            >
              {t("common.clear")}
            </button>
            <button
              className="localized-date-input__action"
              disabled={!isDateWithinRange(todayIso, min, max)}
              onClick={() => selectIsoDate(todayIso)}
              type="button"
            >
              {t("common.today")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseIsoDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 12);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateWithinRange(value: string, min?: string, max?: string): boolean {
  if (min && value < min) {
    return false;
  }

  if (max && value > max) {
    return false;
  }

  return true;
}
