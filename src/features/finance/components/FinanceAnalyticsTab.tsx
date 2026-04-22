import { Card } from "@/components/common/Card";

export function FinanceAnalyticsTab(): JSX.Element {
  return (
    <div className="finance-tab-panel">
      <Card
        subtitle="Analytics will become more meaningful as transaction history grows. This space is ready for trends, category insights, and forecasting later."
        title="Analytics"
      >
        <div className="finance-analytics-placeholder">
          <div className="finance-analytics-placeholder__hero">
            <div>
              <h3 className="finance-analytics-placeholder__title">
                Analytics will become available as more transaction history is added.
              </h3>
              <p className="finance-analytics-placeholder__description">
                Expect trend breakdowns, category movement, and spending rhythm insights here in a later phase.
              </p>
            </div>
          </div>

          <div className="finance-analytics-placeholder__grid">
            <div className="finance-analytics-placeholder__card">
              <span className="finance-analytics-placeholder__label">Monthly trend</span>
              <div className="finance-analytics-placeholder__bar" />
            </div>
            <div className="finance-analytics-placeholder__card">
              <span className="finance-analytics-placeholder__label">Category mix</span>
              <div className="finance-analytics-placeholder__ring" />
            </div>
            <div className="finance-analytics-placeholder__card finance-analytics-placeholder__card--wide">
              <span className="finance-analytics-placeholder__label">Forecasting preview</span>
              <div className="finance-analytics-placeholder__metric-row">
                <div className="finance-analytics-placeholder__metric" />
                <div className="finance-analytics-placeholder__metric" />
                <div className="finance-analytics-placeholder__metric" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
