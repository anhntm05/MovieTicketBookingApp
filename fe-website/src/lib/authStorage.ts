import type { AuthUser } from '../types';

const AUTH_STORAGE_KEY = 'mavis_admin_website_auth';

export interface StoredSession {
  token: string;
  user: AuthUser;
}

export const authStorage = {
  load(): StoredSession | null {
    if (typeof window === 'undefined') return null;

    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  },

  save(session: StoredSession) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },

  clear() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
