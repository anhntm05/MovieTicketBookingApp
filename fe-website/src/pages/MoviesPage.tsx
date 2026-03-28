import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Panel } from '../components/Panel';
import { api, getApiMessage, unwrap } from '../lib/api';
import { formatCurrency, formatDate, formatDuration } from '../lib/formatters';
import type { MovieCatalogItem } from '../types';

export const MoviesPage = () => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [sort, setSort] = useState<'recent' | 'revenue' | 'title'>('recent');
  const [movies, setMovies] = useState<MovieCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sortLabel = useMemo(() => {
    if (sort === 'revenue') return 'Revenue';
    if (sort === 'title') return 'A-Z';
    return 'Recent';
  }, [sort]);

  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/admin/movies', {
          params: {
            search: deferredSearch || undefined,
            sort,
            status: 'all',
          },
        });

        if (!isMounted) return;
        setMovies(unwrap<MovieCatalogItem[]>(response.data));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchMovies();

    return () => {
      isMounted = false;
    };
  }, [deferredSearch, sort]);

  const publishedCount = movies.filter((movie) => movie.status === 'PUBLISHED').length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">CATALOG CONTROL</p>
          <h2>Movies</h2>
          <p className="page-copy">Search the admin movie catalog and monitor inventory performance.</p>
        </div>

        <div className="header-actions">
          <label className="inline-field search-inline">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title"
            />
          </label>

          <label className="inline-field">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recent">Recent</option>
              <option value="revenue">Revenue</option>
              <option value="title">A-Z</option>
            </select>
          </label>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="screen-center">Loading movies...</div> : null}

      {!loading ? (
        <>
          <section className="stats-grid compact-grid">
            <article className="summary-card">
              <span>Total titles</span>
              <strong>{movies.length}</strong>
            </article>
            <article className="summary-card">
              <span>Published</span>
              <strong>{publishedCount}</strong>
            </article>
            <article className="summary-card">
              <span>Sort mode</span>
              <strong>{sortLabel}</strong>
            </article>
          </section>

          <Panel title="Movie catalog" eyebrow="ADMIN DATA">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Genre</th>
                    <th>Duration</th>
                    <th>Showtimes</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Release</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.length ? (
                    movies.map((movie) => (
                      <tr key={movie.movieId}>
                        <td>
                          <div className="table-title">
                            <strong>{movie.title}</strong>
                            <span>{movie.posterUrl ? 'Poster ready' : 'Poster missing'}</span>
                          </div>
                        </td>
                        <td>{movie.genre.slice(0, 2).join(' / ') || 'General release'}</td>
                        <td>{formatDuration(movie.duration)}</td>
                        <td>{movie.showtimes}</td>
                        <td>{movie.bookings}</td>
                        <td>{formatCurrency(movie.revenue)}</td>
                        <td>
                          <span className={`status-pill status-${movie.status.toLowerCase()}`}>{movie.status}</span>
                        </td>
                        <td>{formatDate(movie.releaseDate || movie.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-inline">No movies matched the current filters.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
};
