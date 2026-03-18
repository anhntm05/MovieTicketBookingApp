import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
}

type AuthUserInput = Partial<User> & {
  _id?: string;
  name?: string;
  role?: string;
  status?: string;
};

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Initial auth loading from SecureStore
  setAuth: (token: string, user: AuthUserInput) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

const normalizeRole = (role?: string): UserRole => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'ADMIN';
    case 'staff':
      return 'STAFF';
    default:
      return 'CUSTOMER';
  }
};

const normalizeAuthUser = (user: AuthUserInput): User => ({
  id: user.id || user._id || '',
  email: user.email || '',
  fullName: user.fullName || user.name || '',
  role: normalizeRole(user.role),
  status: user.status?.toUpperCase() || '',
});

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token: string, user: AuthUserInput) => {
    try {
      const normalizedUser = normalizeAuthUser(user);
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(normalizedUser));
      set({ token, user: normalizedUser, isAuthenticated: true });
    } catch (e) {
      console.error('Error saving auth to SecureStore', e);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    } catch (e) {
      console.error('Error removing auth from SecureStore', e);
    }
  },

  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userStr) {
        const user = normalizeAuthUser(JSON.parse(userStr));
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      console.error('Error initializing auth', e);
      set({ isLoading: false });
    }
  },
}));
