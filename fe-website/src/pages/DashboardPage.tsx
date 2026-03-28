import { useEffect, useMemo, useState } from 'react';
import { api, getApiMessage, unwrap } from '../lib/api';
import { formatCompactNumber, formatCurrency, formatPercent, formatTrend } from '../lib/formatters';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import type { DashboardSummary, FinancePoint } from '../types';

const emptySummary: DashboardSummary = {
  users: { total: 0, customers: 0, staff: 0, admins: 0 },
  movies: 0,
  cinemas: 0,
  showtimes: 0,
  comments: 0,
  bookings: { total: 0, pendingPayment: 0, confirmed: 0, cancelled: 0, expired: 0 },
  payments: { totalRevenue: 0, completed: 0, refunded: 0, failed: 0 },
  occupancyRate: 0,
  topMovies: [],
};

export const DashboardPage = () => {
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [dashboard, setDashboard] = useState(emptySummary);
  const [previous, setPrevious] = useState(emptySummary);
  const [finance, setFinance] = useState<FinancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const now = new Date();
        const currentStart = new Date(now);
        currentStart.setDate(now.getDate() - (range === 'week' ? 6 : 29));
        currentStart.setHours(0, 0, 0, 0);

        const previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousEnd.setHours(23, 59, 59, 999);

        const previousStart = new Date(previousEnd);
        previousStart.setDate(previousEnd.getDate() - (range === 'week' ? 6 : 29));
        previousStart.setHours(0, 0, 0, 0);

        const [currentResponse, previousResponse, financeResponse] = await Promise.all([
          api.get('/admin/dashboard', {
            params: { startDate: currentStart.toISOString(), endDate: now.toISOString() },
          }),
          api.get('/admin/dashboard', {
            params: { startDate: previousStart.toISOString(), endDate: previousEnd.toISOString() },
          }),
          api.get('/admin/finance', {
            params: { startDate: currentStart.toISOString(), endDate: now.toISOString(), groupBy: 'day' },
          }),
        ]);

        if (!isMounted) return;

        setDashboard(unwrap<DashboardSummary>(currentResponse.data));
        setPrevious(unwrap<DashboardSummary>(previousResponse.data));
        setFinance(unwrap<FinancePoint[]>(financeResponse.data));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const revenueChange = previous.payments.totalRevenue
    ? ((dashboard.payments.totalRevenue - previous.payments.totalRevenue) / previous.payments.totalRevenue) * 100
    : dashboard.payments.totalRevenue > 0
      ? 100
      : 0;

  const bookingChange = previous.bookings.confirmed
    ? ((dashboard.bookings.confirmed - previous.bookings.confirmed) / previous.bookings.confirmed) * 100
    : dashboard.bookings.confirmed > 0
      ? 100
      : 0;

  const alerts = useMemo(() => {
    const items: string[] = [];

    if (dashboard.occupancyRate < 45) {
      items.push(`Occupancy is ${formatPercent(dashboard.occupancyRate)} and below the 45% target.`);
    }

    if (dashboard.bookings.total > 0) {
      const cancellationRate = (dashboard.bookings.cancelled / dashboard.bookings.total) * 100;
      if (cancellationRate >= 8) {
        items.push(`Cancellations account for ${formatPercent(cancellationRate)} of bookings.`);
      }
    }

    if (dashboard.bookings.pendingPayment > 0) {
      items.push(`${dashboard.bookings.pendingPayment} bookings are still pending payment.`);
    }

    if (!items.length) {
      items.push('Operations look stable across occupancy, cancellations, and payment completion.');
    }

    return items.slice(0, 3);
  }, [dashboard]);

  const financeMax = Math.max(...finance.map((point) => point.revenue), 1);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">OPERATIONS OVERVIEW</p>
          <h2>Admin Dashboard</h2>
          <p className="page-copy">Monitor demand, occupancy, user volume, and top-performing titles.</p>
        </div>

        <div className="segmented-control">
          <button
            type="button"
            className={range === 'week' ? 'segment-active' : ''}
            onClick={() => setRange('week')}
          >
            7 days
          </button>
          <button
            type="button"
            className={range === 'month' ? 'segment-active' : ''}
            onClick={() => setRange('month')}
          >
            30 days
          </button>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="screen-center">Loading dashboard...</div> : null}

      {!loading ? (
        <>
          <section className="stats-grid">
            <StatCard
              label="Revenue"
              value={formatCurrency(dashboard.payments.totalRevenue)}
              meta={`${formatTrend(revenueChange)} vs previous window`}
              tone="pink"
            />
            <StatCard
              label="Confirmed bookings"
              value={formatCompactNumber(dashboard.bookings.confirmed)}
              meta={`${formatTrend(bookingChange)} completed orders`}
              tone="cyan"
            />
            <StatCard
              label="Occupancy"
              value={formatPercent(dashboard.occupancyRate)}
              meta={`${formatCompactNumber(dashboard.showtimes)} showtimes in scope`}
              tone="gold"
            />
            <StatCard
              label="Users"
              value={formatCompactNumber(dashboard.users.total)}
              meta={`${dashboard.users.admins} admins, ${dashboard.users.staff} staff`}
              tone="green"
            />
          </section>

          <section className="content-grid two-column">
            <Panel
              title="Revenue trend"
              eyebrow="FINANCE"
              action={<span className="panel-chip">{range === 'week' ? 'Daily view' : '30-day view'}</span>}
            >
              <div className="bar-chart">
                {finance.map((point) => (
                  <div key={point.label} className="bar-column">
                    <div
                      className="bar-fill"
                      style={{ height: `${Math.max(12, (point.revenue / financeMax) * 100)}%` }}
                    />
                    <span>{point.label.slice(-2)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Operational alerts" eyebrow="WATCHLIST">
              <div className="alert-stack">
                {alerts.map((alert) => (
                  <article key={alert} className="alert-card">
                    <strong>Signal</strong>
                    <p>{alert}</p>
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section className="content-grid two-column">
            <Panel title="Top performing movies" eyebrow="CATALOG">
              <div className="list-stack">
                {dashboard.topMovies.length ? (
                  dashboard.topMovies.map((movie) => (
                    <article key={movie.movieId} className="list-row">
                      <div>
                        <strong>{movie.title}</strong>
                        <p>{(movie.genre || []).slice(0, 2).join(' / ') || 'General release'}</p>
                      </div>
                      <div className="list-metric">
                        <strong>{formatCurrency(movie.revenue)}</strong>
                        <span>{movie.bookings} bookings</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="muted">No movie performance data for the selected period yet.</p>
                )}
              </div>
            </Panel>

            <Panel title="Quick health check" eyebrow="SNAPSHOT">
              <div className="metric-list">
                <div>
                  <span>Pending payments</span>
                  <strong>{dashboard.bookings.pendingPayment}</strong>
                </div>
                <div>
                  <span>Cancelled bookings</span>
                  <strong>{dashboard.bookings.cancelled}</strong>
                </div>
                <div>
                  <span>Comments processed</span>
                  <strong>{dashboard.comments}</strong>
                </div>
                <div>
                  <span>Published inventory</span>
                  <strong>{dashboard.movies}</strong>
                </div>
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  );
};
