import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/common/Button";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import {
  FinanceTransactionFilters,
  FinanceTransactionSortOption,
} from "@/features/finance/utils/finance.filters";

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
            <span className="finance-filter-panel__title">Filters</span>
          </div>
          {activeFilterCount > 0 ? (
            <span className="finance-filter-panel__badge">{activeFilterCount} active</span>
          ) : null}
        </div>

        <Button
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
          variant="ghost"
        >
          {isExpanded ? "Hide filters" : "Show filters"}
        </Button>
      </div>

      <div className="finance-filter-panel__top">
        <label className="auth-form__field finance-filter-panel__search">
          <span className="auth-form__label">Search</span>
          <input
            className="auth-form__input"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search transactions..."
            value={searchQuery}
          />
        </label>

        <label className="auth-form__field finance-filter-panel__sort">
          <span className="auth-form__label">Sort</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              onSortChange(event.target.value as FinanceTransactionSortOption)
            }
            value={sortOption}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-desc">Amount high to low</option>
            <option value="amount-asc">Amount low to high</option>
            <option value="merchant-asc">Merchant A-Z</option>
            <option value="merchant-desc">Merchant Z-A</option>
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
              <span className="auth-form__label">Type</span>
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
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">Category</span>
              <select
                className="auth-form__input"
                onChange={(event) =>
                  onChangeFilters({ ...filters, categoryId: event.target.value })
                }
                value={filters.categoryId}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">From date</span>
              <input
                className="auth-form__input"
                onChange={(event) =>
                  onChangeFilters({ ...filters, fromDate: event.target.value, quickDate: "all" })
                }
                type="date"
                value={filters.fromDate}
              />
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">To date</span>
              <input
                className="auth-form__input"
                onChange={(event) =>
                  onChangeFilters({ ...filters, toDate: event.target.value, quickDate: "all" })
                }
                type="date"
                value={filters.toDate}
              />
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">Min amount</span>
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
              <span className="auth-form__label">Max amount</span>
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
                This month
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "last-month" })}
                type="button"
                variant={filters.quickDate === "last-month" ? "primary" : "secondary"}
              >
                Last month
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "last-30-days" })}
                type="button"
                variant={filters.quickDate === "last-30-days" ? "primary" : "secondary"}
              >
                Last 30 days
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "this-year" })}
                type="button"
                variant={filters.quickDate === "this-year" ? "primary" : "secondary"}
              >
                This year
              </Button>
              <Button
                onClick={() => onChangeFilters({ ...filters, quickDate: "all" })}
                type="button"
                variant={filters.quickDate === "all" ? "primary" : "secondary"}
              >
                All time
              </Button>
            </div>

            <Button onClick={onClearFilters} type="button" variant="ghost">
              Clear filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
