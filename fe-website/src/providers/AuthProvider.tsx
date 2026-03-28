import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { api, getApiMessage, normalizeUser, unwrap } from '../lib/api';
import { authStorage } from '../lib/authStorage';
import type { AuthPayload, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = authStorage.load();

    if (session?.token && session.user?.role === 'ADMIN') {
      setToken(session.token);
      setUser(session.user);
    } else {
      authStorage.clear();
    }

    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user?.role === 'ADMIN'),
      async login(email: string, password: string) {
        try {
          const response = await api.post('/auth/login', { email, password });
          const payload = unwrap<AuthPayload>(response.data);
          const normalizedUser = normalizeUser(payload.user);

          if (normalizedUser.role !== 'ADMIN') {
            throw new Error('Only ADMIN accounts can access this website.');
          }

          authStorage.save({ token: payload.token, user: normalizedUser });
          setToken(payload.token);
          setUser(normalizedUser);
        } catch (error) {
          authStorage.clear();
          setToken(null);
          setUser(null);
          throw new Error(getApiMessage(error));
        }
      },
      logout() {
        authStorage.clear();
        setToken(null);
        setUser(null);
      },
      updateUser(nextUser: AuthUser) {
        const currentToken = token;
        setUser(nextUser);

        if (currentToken) {
          authStorage.save({ token: currentToken, user: nextUser });
        }
      },
    }),
    [isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
};
