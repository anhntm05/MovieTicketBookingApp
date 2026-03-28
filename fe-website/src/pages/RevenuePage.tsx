import { useEffect, useState } from 'react';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { api, getApiMessage, unwrap } from '../lib/api';
import { formatCompactNumber, formatCurrency, formatPercent, formatTrend } from '../lib/formatters';
import type { RevenueStreamData } from '../types';

export const RevenuePage = () => {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const [data, setData] = useState<RevenueStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchRevenue = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/admin/revenue-stream', { params: { range } });

        if (!isMounted) return;
        setData(unwrap<RevenueStreamData>(response.data));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchRevenue();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const trendMax = Math.max(...(data?.trend.map((item) => item.revenue) || [1]), 1);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">PAYMENTS CONTROL</p>
          <h2>Revenue Stream</h2>
          <p className="page-copy">Track completed payment volume, anomalies, and live transactions.</p>
        </div>

        <div className="segmented-control">
          {(['today', '7d', '30d'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={range === option ? 'segment-active' : ''}
              onClick={() => setRange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="screen-center">Loading revenue data...</div> : null}

      {data && !loading ? (
        <>
          <section className="stats-grid">
            <StatCard
              label="Total revenue"
              value={formatCurrency(data.summary.totalRevenue)}
              meta={`${formatTrend(data.summary.revenueChange)} vs previous period`}
              tone="pink"
            />
            <StatCard
              label="Today revenue"
              value={formatCurrency(data.summary.todayRevenue)}
              meta={`${formatTrend(data.summary.todayChange)} day-over-day`}
              tone="cyan"
            />
            <StatCard
              label="Average order"
              value={formatCurrency(data.summary.averageOrderValue)}
              meta={`${formatCompactNumber(data.summary.completedPayments)} completed payments`}
              tone="gold"
            />
            <StatCard
              label="Payment health"
              value={formatPercent(data.health.failureRate)}
              meta={`${formatPercent(data.health.refundRate)} refund rate`}
              tone="green"
            />
          </section>

          <section className="content-grid two-column">
            <Panel
              title="Revenue trend"
              eyebrow="TREND"
              action={<span className="panel-chip">{formatCompactNumber(data.summary.completedPayments)} transactions</span>}
            >
              <div className="bar-chart">
                {data.trend.map((point) => (
                  <div key={point.label} className="bar-column">
                    <div
                      className="bar-fill accent-cyan"
                      style={{ height: `${Math.max(12, (point.revenue / trendMax) * 100)}%` }}
                    />
                    <span>{point.label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title={data.health.alertTitle} eyebrow="RISK">
              <article className={`alert-card ${data.health.alertSeverity === 'critical' ? 'alert-critical' : ''}`}>
                <strong>{data.health.alertSeverity === 'critical' ? 'Critical' : 'Warning'}</strong>
                <p>{data.health.alertMessage}</p>
              </article>

              <div className="metric-list compact">
                <div>
                  <span>Refund rate</span>
                  <strong>{formatPercent(data.health.refundRate)}</strong>
                </div>
                <div>
                  <span>Failure rate</span>
                  <strong>{formatPercent(data.health.failureRate)}</strong>
                </div>
                <div>
                  <span>Completed change</span>
                  <strong>{formatTrend(data.summary.completedChange)}</strong>
                </div>
              </div>
            </Panel>
          </section>

          <section className="content-grid two-column">
            <Panel title="Top performers" eyebrow="MOVIES">
              <div className="list-stack">
                {data.topPerformers.map((item, index) => (
                  <article key={item.id} className="list-row">
                    <div>
                      <strong>
                        {String(index + 1).padStart(2, '0')} {item.name}
                      </strong>
                      <p>Revenue leader</p>
                    </div>
                    <div className="list-metric">
                      <strong>{formatCurrency(item.revenue)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Live transactions" eyebrow="FEED">
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Customer</th>
                      <th>Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.liveTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.movie}</td>
                        <td>{transaction.customer}</td>
                        <td>{transaction.time}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`status-pill status-${transaction.status.toLowerCase()}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  );
};
