import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  isEmailVerified: boolean;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isOnboarded: boolean;
  isLoading: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  setOnboarded: (val: boolean) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isOnboarded: false,
  isLoading: true,

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    SecureStore.setItemAsync('accessToken', accessToken);
    SecureStore.setItemAsync('refreshToken', refreshToken);
  },

  setUser: (user) => set({ user }),

  setOnboarded: (isOnboarded) => {
    set({ isOnboarded });
    SecureStore.setItemAsync('isOnboarded', JSON.stringify(isOnboarded));
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
    ]);
    set({ accessToken: null, refreshToken: null, user: null });
  },

  loadFromStorage: async () => {
    const [accessToken, refreshToken, onboarded] = await Promise.all([
      SecureStore.getItemAsync('accessToken'),
      SecureStore.getItemAsync('refreshToken'),
      SecureStore.getItemAsync('isOnboarded'),
    ]);
    set({
      accessToken,
      refreshToken,
      isOnboarded: onboarded === 'true',
      isLoading: false,
    });
  },
}));
