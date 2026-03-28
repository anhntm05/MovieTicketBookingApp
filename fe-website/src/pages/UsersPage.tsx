import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { api, getApiMessage, unwrap } from '../lib/api';
import { formatCompactNumber, formatCurrency, formatDateTime, formatPercent, formatTrend } from '../lib/formatters';
import type { UserDetail, UsersAnalytics } from '../types';

export const UsersPage = () => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [analytics, setAnalytics] = useState<UsersAnalytics | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/admin/users/analytics', {
          params: {
            page,
            limit: 12,
            search: deferredSearch || undefined,
          },
        });

        if (!isMounted) return;

        const nextAnalytics = unwrap<UsersAnalytics>(response.data);
        setAnalytics(nextAnalytics);
        setSelectedUserId((current) => current || nextAnalytics.directory[0]?.id || '');
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [deferredSearch, page]);

  useEffect(() => {
    if (!selectedUserId) {
      setDetail(null);
      return;
    }

    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const response = await api.get(`/admin/users/${selectedUserId}/detail`);

        if (!isMounted) return;
        setDetail(unwrap<UserDetail>(response.data));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setDetailLoading(false);
      }
    };

    void fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedUserId]);

  const pageNumbers = useMemo(() => {
    if (!analytics?.pagination.pages) return [];
    return Array.from({ length: analytics.pagination.pages }, (_, index) => index + 1).slice(0, 6);
  }, [analytics?.pagination.pages]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">COMMUNITY CONTROL</p>
          <h2>Users</h2>
          <p className="page-copy">Audit user growth, purchaser behavior, and customer-level activity.</p>
        </div>

        <label className="inline-field search-inline">
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
          />
        </label>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="screen-center">Loading users...</div> : null}

      {analytics && !loading ? (
        <>
          <section className="stats-grid">
            <StatCard
              label="Total users"
              value={formatCompactNumber(analytics.summary.totalUsers)}
              meta={formatTrend(analytics.summary.totalUsersChange)}
              tone="pink"
            />
            <StatCard
              label="Active users"
              value={formatCompactNumber(analytics.summary.activeUsers)}
              meta={formatPercent(analytics.summary.activeUserRate)}
              tone="cyan"
            />
            <StatCard
              label="Purchasers"
              value={formatCompactNumber(analytics.summary.totalPurchasers)}
              meta={formatPercent(analytics.summary.purchaserRate)}
              tone="gold"
            />
            <StatCard
              label="Growth rate"
              value={formatTrend(analytics.summary.userGrowthRate)}
              meta="Current month"
              tone="green"
            />
          </section>

          <section className="content-grid split-layout">
            <Panel title="User directory" eyebrow="ANALYTICS">
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.directory.map((user) => (
                      <tr
                        key={user.id}
                        className={selectedUserId === user.id ? 'row-active' : ''}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td>
                          <div className="table-title">
                            <strong>{user.fullName}</strong>
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-${user.role.toLowerCase()}`}>{user.role}</span>
                        </td>
                        <td>
                          <span className={`status-pill status-${user.status.toLowerCase()}`}>{user.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-row">
                <span>
                  Page {analytics.pagination.page} of {analytics.pagination.pages}
                </span>
                <div className="page-buttons">
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={pageNumber === analytics.pagination.page ? 'page-button-active' : ''}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Selected user" eyebrow="DETAIL">
              {detailLoading ? <p className="muted">Loading user detail...</p> : null}

              {detail ? (
                <div className="detail-stack">
                  <div className="hero-detail">
                    <div>
                      <p className="panel-eyebrow">{detail.user.tierLabel}</p>
                      <h3>{detail.user.fullName}</h3>
                      <p className="muted">{detail.user.email}</p>
                    </div>
                    <div className="badge-column">
                      <span className={`status-pill status-${detail.user.role.toLowerCase()}`}>{detail.user.role}</span>
                      <span className={`status-pill status-${detail.user.status.toLowerCase()}`}>{detail.user.status}</span>
                    </div>
                  </div>

                  <div className="metric-list compact">
                    <div>
                      <span>Total spent</span>
                      <strong>{formatCurrency(detail.stats.totalSpent)}</strong>
                    </div>
                    <div>
                      <span>Bookings</span>
                      <strong>{detail.stats.totalBookings}</strong>
                    </div>
                    <div>
                      <span>Cancellation rate</span>
                      <strong>{formatPercent(detail.stats.cancellationRate)}</strong>
                    </div>
                    <div>
                      <span>Comments</span>
                      <strong>{detail.stats.commentCount}</strong>
                    </div>
                  </div>

                  <div className="progress-block">
                    <div className="progress-meta">
                      <span>{detail.loyalty.tierLabel}</span>
                      <strong>{detail.loyalty.progressPercent}%</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${detail.loyalty.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mini-grid">
                    <article className="mini-card">
                      <span>Avg ticket value</span>
                      <strong>{formatCurrency(detail.loyalty.averageTicketValue)}</strong>
                    </article>
                    <article className="mini-card">
                      <span>Monthly frequency</span>
                      <strong>{detail.loyalty.frequencyPerMonth}</strong>
                    </article>
                    <article className="mini-card">
                      <span>Member since</span>
                      <strong>{formatDateTime(detail.user.memberSince)}</strong>
                    </article>
                  </div>

                  <div>
                    <h4 className="section-title">Recent bookings</h4>
                    <div className="list-stack">
                      {detail.recentBookings.length ? (
                        detail.recentBookings.map((booking) => (
                          <article key={booking.id} className="list-row">
                            <div>
                              <strong>{booking.title}</strong>
                              <p>
                                {booking.hall} | {formatDateTime(booking.date)}
                              </p>
                            </div>
                            <span className={`status-pill status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                          </article>
                        ))
                      ) : (
                        <p className="muted">No recent bookings.</p>
                      )}
                    </div>
                  </div>

                  {detail.latestFeedback ? (
                    <article className="alert-card">
                      <strong>Latest feedback</strong>
                      <p>
                        {detail.latestFeedback.movieTitle} | {detail.latestFeedback.rating}/5
                      </p>
                      <p className="muted">{detail.latestFeedback.content}</p>
                    </article>
                  ) : null}
                </div>
              ) : (
                !detailLoading && <p className="muted">Select a user from the directory to inspect activity.</p>
              )}
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  );
};
