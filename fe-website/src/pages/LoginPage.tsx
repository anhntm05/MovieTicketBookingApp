import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const redirectTo =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/dashboard';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-hero">
        <p className="hero-kicker">SEPARATE ADMIN WEBSITE</p>
        <h1>Run cinema operations from one controlled web portal.</h1>
        <p className="hero-copy">
          This website is restricted to administrator accounts. Successful login sends admins
          directly into the dashboard and rejects all customer or staff accounts.
        </p>

        <div className="hero-grid">
          <article className="hero-card">
            <span>Auth gate</span>
            <strong>Admin-only login</strong>
            <p>Role check happens before the browser session is stored.</p>
          </article>
          <article className="hero-card">
            <span>Navigation</span>
            <strong>Sidebar shell</strong>
            <p>Dashboard, revenue, movies, users, cinemas, and profile live in one layout.</p>
          </article>
          <article className="hero-card">
            <span>Backend</span>
            <strong>Existing APIs</strong>
            <p>Uses the current `/api/auth`, `/api/admin`, `/api/movies`, and `/api/cinemas` endpoints.</p>
          </article>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="panel-eyebrow">ADMIN LOGIN</p>
          <h2>Sign in to Mavis Control</h2>
          <p className="login-copy">Use an administrator account. Non-admin logins are blocked.</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password"
                autoComplete="current-password"
              />
            </label>

            {error ? <div className="error-banner">{error}</div> : null}

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Access Admin Website'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
