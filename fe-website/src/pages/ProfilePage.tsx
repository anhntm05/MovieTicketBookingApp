import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '../components/Panel';
import { api, getApiMessage, normalizeUser, unwrap } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import { useAuth } from '../providers/AuthProvider';
import type { ProfileData } from '../types';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/users/profile');
        const nextProfile = unwrap<ProfileData>(response.data);

        if (!isMounted) return;
        setProfile(nextProfile);
        setFullName(nextProfile.fullName);
        setAvatarUrl(nextProfile.avatarUrl || '');
      } catch (requestError) {
        if (!isMounted) return;
        setError(getApiMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      setSaving(true);
      const response = await api.put('/users/profile', {
        name: fullName.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      const nextProfile = unwrap<ProfileData>(response.data);
      setProfile(nextProfile);
      updateUser(normalizeUser(nextProfile as unknown as Record<string, unknown>));
      setMessage('Profile updated successfully.');
    } catch (submitError) {
      setError(getApiMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">ACCOUNT SETTINGS</p>
          <h2>Profile</h2>
          <p className="page-copy">Manage the admin identity stored in the web session.</p>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="success-banner">{message}</div> : null}
      {loading ? <div className="screen-center">Loading profile...</div> : null}

      {profile && !loading ? (
        <section className="content-grid two-column">
          <Panel title="Profile details" eyebrow="IDENTITY">
            <form className="form-stack" onSubmit={handleSubmit}>
              <label className="field">
                <span>Full name</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>

              <label className="field">
                <span>Avatar URL</span>
                <input
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input value={profile.email} disabled />
              </label>

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </Panel>

          <Panel title="Session summary" eyebrow="ACCESS">
            <div className="detail-stack">
              <div className="hero-detail">
                <div>
                  <p className="panel-eyebrow">{profile.role}</p>
                  <h3>{profile.fullName}</h3>
                  <p className="muted">{profile.email}</p>
                </div>
                <span className={`status-pill status-${profile.status.toLowerCase()}`}>{profile.status}</span>
              </div>

              <div className="mini-grid">
                <article className="mini-card">
                  <span>Role</span>
                  <strong>{profile.role}</strong>
                </article>
                <article className="mini-card">
                  <span>Status</span>
                  <strong>{profile.status}</strong>
                </article>
                <article className="mini-card">
                  <span>Last refreshed</span>
                  <strong>{formatDateTime(new Date().toISOString())}</strong>
                </article>
              </div>

              <article className="alert-card">
                <strong>Admin website policy</strong>
                <p>Only ADMIN accounts can hold a valid session inside this separate website.</p>
              </article>

              <button
                type="button"
                className="ghost-button danger-button"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                Sign out
              </button>
            </div>
          </Panel>
        </section>
      ) : null}
    </div>
  );
};
