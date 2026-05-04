import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/common/Button";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { getFinanceCategoryDisplayName, getFinanceTypeDisplayName } from "@/features/finance/utils/finance.i18n";
import {
  FinanceTransactionFilters,
  FinanceTransactionSortOption,
} from "@/features/finance/utils/finance.filters";
import { useI18n } from "@/i18n";

interface TransactionFiltersProps {
  categories: FinanceCategory[];
  filters: FinanceTransactionFilters;
  onChangeFilters: (filters: FinanceTransactionFilters) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
  sortOption: FinanceTransactionSortOption;
  onSortChange: (sortOption: FinanceTransactionSortOption) => void;
}

export function TransactionFilters({
  categories,
  filters,
  onChangeFilters,
  onClearFilters,
  onSearchChange,
  searchQuery,
  sortOption,
  onSortChange,
}: TransactionFiltersProps): JSX.Element {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    searchQuery.trim() !== "",
    filters.type !== "all",
    filters.categoryId !== "",
    filters.fromDate !== "",
    filters.toDate !== "",
    filters.minAmount.trim() !== "",
    filters.maxAmount.trim() !== "",
    filters.quickDate !== "all",
  ].filter(Boolean).length;

  return (
    <div className="finance-filter-panel">
      <div className="finance-filter-panel__header">
        <div className="finance-filter-panel__title-wrap">
          <div className="finance-filter-panel__title-row">
            <SlidersHorizontal size={16} />
            <span className="finance-filter-panel__title">{t("finance.filters")}</span>
          </div>
          {activeFilterCount > 0 ? (
            <span className="finance-filter-panel__badge">
              {t("finance.activeFilters").replace("{count}", String(activeFilterCount))}
            </span>
          ) : null}
        </div>

        <Button
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
          variant="ghost"
        >
          {isExpanded ? t("finance.hideFilters") : t("finance.showFilters")}
        </Button>
      </div>

      <div className="finance-filter-panel__top">
        <label className="auth-form__field finance-filter-panel__search">
          <span className="auth-form__label">{t("common.search")}</span>
          <input
            className="auth-form__input"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("finance.searchTransactions")}
            value={searchQuery}
          />
        </label>

        <label className="auth-form__field finance-filter-panel__sort">
          <span className="auth-form__label">{t("finance.sort")}</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              onSortChange(event.target.value as FinanceTransactionSortOption)
            }
            value={sortOption}
          >
            <option value="newest">{t("finance.sortNewest")}</option>
            <option value="oldest">{t("finance.sortOldest")}</option>
            <option value="amount-desc">{t("finance.sortAmountDesc")}</option>
            <option value="amount-asc">{t("finance.sortAmountAsc")}</option>
            <option value="merchant-asc">{t("finance.sortMerchantAsc")}</option>
            <option value="merchant-desc">{t("finance.sortMerchantDesc")}</option>
          </select>
        </label>
      </div>

      <div
        className={`finance-filter-panel__advanced${
          isExpanded ? " finance-filter-panel__advanced--open" : ""
        }`}
      >
        <div className="finance-filter-panel__advanced-inner">
          <div className="finance-filter-grid">
            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.type")}</span>
              <select
                className="auth-form__input"
                onChange={(event) =>
                  onChangeFilters({
                    ...filters,
                    type: event.target.value as FinanceTransactionFilters["type"],
                  })
                }
                value={filters.type}
              >
                <option value="all">{getFinanceTypeDisplayName("all", t)}</option>
                <option value="income">{getFinanceTypeDisplayName("income", t)}</option>
                <option value="expense">{getFinanceTypeDisplayName("expense", t)}</option>
              </select>
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.category")}</span>
              <select
                className="auth-form__input"
                onChange={(event) =>
                  onChangeFilters({ ...filters, categoryId: event.target.value })
                }
                value={filters.categoryId}
              >
                <option value="">{t("finance.allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getFinanceCategoryDisplayName(category, t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.fromDate")}</span>
              <LocalizedDateInput
                className="auth-form__input"
                max={filters.toDate || undefined}
                onChange={(nextValue) =>
                  onChangeFilters({ ...filters, fromDate: nextValue, quickDate: "all" })
                }
                value={filters.fromDate}
              />
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.toDate")}</span>
              <LocalizedDateInput
                className="auth-form__input"
                min={filters.fromDate || undefined}
                onChange={(nextValue) =>
                  onChangeFilters({ ...filters, toDate: nextValue, quickDate: "all" })
                }
                value={filters.toDate}
              />
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.minAmount")}</span>
              <input
                className="auth-form__input"
                inputMode="decimal"
                min="0"
                onChange={(event) =>
                  onChangeFilters({ ...filters, minAmount: event.target.value })
                }
                placeholder="0.00"
                step="0.01"
                value={filters.minAmount}
              />
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("finance.maxAmount")}</span>
              <input
                className="auth-form__input"
                inputMode="decimal"
                min="0"
                onChange={(event) =>
                  onChangeFilters({ ...filters, maxAmount: event.target.value })
                }
                placeholder="0.00"
                step="0.01"
                value={filters.maxAmount}
              />
            </label>
          </div>

          <div className="finance-filter-panel__actions">
            <div className="finance-filter-panel__quick-actions">
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "this-month" })}
                type="button"
                variant={filters.quickDate === "this-month" ? "primary" : "secondary"}
              >
                {t("finance.thisMonth")}
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "last-month" })}
                type="button"
                variant={filters.quickDate === "last-month" ? "primary" : "secondary"}
              >
                {t("finance.lastMonth")}
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "last-30-days" })}
                type="button"
                variant={filters.quickDate === "last-30-days" ? "primary" : "secondary"}
              >
                {t("finance.last30Days")}
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "this-year" })}
                type="button"
                variant={filters.quickDate === "this-year" ? "primary" : "secondary"}
              >
                {t("finance.thisYear")}
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "all" })}
                type="button"
                variant={filters.quickDate === "all" ? "primary" : "secondary"}
              >
                {t("finance.allTime")}
              </Button>
            </div>

            <Button onClick={onClearFilters} type="button" variant="ghost">
              {t("finance.clearFilters")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
