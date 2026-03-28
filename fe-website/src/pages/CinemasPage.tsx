import { useEffect, useState } from 'react';
import { Panel } from '../components/Panel';
import { api, getApiMessage, unwrap } from '../lib/api';
import { formatCompactNumber, formatCurrency, formatPercent } from '../lib/formatters';
import type { CinemaListItem, CinemaOpsDetail } from '../types';

const getCinemaId = (cinema: CinemaListItem) => cinema.id || cinema._id || '';

export const CinemasPage = () => {
  const [cinemas, setCinemas] = useState<CinemaListItem[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [detail, setDetail] = useState<CinemaOpsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCinemas = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/cinemas', { params: { page: 1, limit: 40, status: 'all' } });
        const nextCinemas = unwrap<CinemaListItem[]>(response.data);

        if (!isMounted) return;
        setCinemas(nextCinemas);
        setSelectedCinemaId((current) => current || getCinemaId(nextCinemas[0]));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchCinemas();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCinemaId) {
      setDetail(null);
      return;
    }

    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const response = await api.get(`/admin/cinemas/${selectedCinemaId}/detail`);

        if (!isMounted) return;
        setDetail(unwrap<CinemaOpsDetail>(response.data));
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
  }, [selectedCinemaId]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">VENUE OPERATIONS</p>
          <h2>Cinemas</h2>
          <p className="page-copy">Browse venues, inspect screen capacity, and review local demand patterns.</p>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="screen-center">Loading cinemas...</div> : null}

      {!loading ? (
        <section className="content-grid split-layout">
          <Panel title="Cinema list" eyebrow="VENUES">
            <div className="list-stack">
              {cinemas.map((cinema) => {
                const cinemaId = getCinemaId(cinema);
                return (
                  <button
                    key={cinemaId}
                    type="button"
                    className={`select-row${selectedCinemaId === cinemaId ? ' select-row-active' : ''}`}
                    onClick={() => setSelectedCinemaId(cinemaId)}
                  >
                    <div>
                      <strong>{cinema.name}</strong>
                      <p>{cinema.location}</p>
                      <p className="muted">{cinema.address}</p>
                    </div>
                    <span className={`status-pill status-${String(cinema.status || '').toLowerCase()}`}>{cinema.status}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Cinema detail" eyebrow="OPERATIONS">
            {detailLoading ? <p className="muted">Loading cinema detail...</p> : null}

            {detail ? (
              <div className="detail-stack">
                <div className="hero-detail">
                  <div>
                    <p className="panel-eyebrow">{detail.cinema.location}</p>
                    <h3>{detail.cinema.name}</h3>
                    <p className="muted">{detail.cinema.address}</p>
                  </div>
                  <span className={`status-pill status-${detail.cinema.status.toLowerCase()}`}>{detail.cinema.status}</span>
                </div>

                <div className="mini-grid">
                  <article className="mini-card">
                    <span>Total revenue</span>
                    <strong>{formatCurrency(detail.summary.totalRevenue)}</strong>
                  </article>
                  <article className="mini-card">
                    <span>Total bookings</span>
                    <strong>{formatCompactNumber(detail.summary.totalBookings)}</strong>
                  </article>
                  <article className="mini-card">
                    <span>Occupancy</span>
                    <strong>{formatPercent(detail.summary.occupancyRate)}</strong>
                  </article>
                  <article className="mini-card">
                    <span>Screens</span>
                    <strong>{detail.cinema.screenCount}</strong>
                  </article>
                </div>

                <div>
                  <h4 className="section-title">Screen roster</h4>
                  <div className="list-stack">
                    {detail.cinema.screens.map((screen) => (
                      <article key={screen.id} className="list-row">
                        <div>
                          <strong>{screen.name}</strong>
                          <p>
                            {screen.hallType} | {screen.projectionType || 'Projection TBD'} |{' '}
                            {screen.audioSystem || 'Audio TBD'}
                          </p>
                        </div>
                        <div className="list-metric">
                          <strong>{screen.totalSeats} seats</strong>
                          <span>{screen.status}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="section-title">Showing today</h4>
                  <div className="list-stack">
                    {detail.showingMovies.length ? (
                      detail.showingMovies.map((movie) => (
                        <article key={movie.movieId} className="list-row">
                          <div>
                            <strong>{movie.title}</strong>
                            <p>{movie.slots} showtime slots today</p>
                          </div>
                          <div className="list-metric">
                            <span className={`status-pill ${movie.isTrending ? 'status-success' : 'status-muted'}`}>
                              {movie.isTrending ? 'Trending' : 'Scheduled'}
                            </span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="muted">No live showings today.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="section-title">Booking distribution</h4>
                  <div className="list-stack">
                    {detail.bookingDistribution.map((slot) => (
                      <article key={slot.label} className="distribution-row">
                        <div>
                          <strong>{slot.label}</strong>
                          <p>{slot.count} bookings</p>
                        </div>
                        <div className="distribution-meter">
                          <div className="distribution-track">
                            <div className="distribution-fill" style={{ width: `${slot.percentage}%` }} />
                          </div>
                          <span>{slot.percentage}%</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              !detailLoading && <p className="muted">Select a cinema to review operations.</p>
            )}
          </Panel>
        </section>
      ) : null}
    </div>
  );
};
