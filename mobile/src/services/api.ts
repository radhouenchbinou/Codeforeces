import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Redirect to login handled by app router
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; gdprConsent: boolean; marketingConsent: boolean; gdprConsentVersion: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};

// Users
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: object) => api.put('/users/me', data),
  getPublicProfile: (id: string) => api.get(`/users/${id}/public`),
};

// Photos
export const photosApi = {
  upload: (formData: FormData) =>
    api.post('/photos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyPhotos: () => api.get('/photos/me'),
  deletePhoto: (id: string) => api.delete(`/photos/${id}`),
  uploadVoiceIntro: (formData: FormData) =>
    api.post('/photos/voice-intro', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Discovery
export const discoveryApi = {
  getDailyDeck: () => api.get('/discovery/daily'),
  act: (targetId: string, action: 'interested' | 'pass') =>
    api.post('/discovery/act', { targetId, action }),
};

// Matches
export const matchesApi = {
  getMatches: () => api.get('/matches'),
  getMatch: (id: string) => api.get(`/matches/${id}`),
  endMatch: (id: string) => api.delete(`/matches/${id}`),
  setRevealConsent: (id: string, consent: boolean) =>
    api.post(`/matches/${id}/reveal-consent`, { consent }),
};

// Chat
export const chatApi = {
  getToken: () => api.get('/chat/token'),
};

// Voice
export const voiceApi = {
  getToken: (matchId: string) => api.get(`/voice/token/${matchId}`),
};

// Moderation
export const moderationApi = {
  report: (targetId: string, reason: string, details?: string) =>
    api.post('/moderation/report', { targetId, reason, details }),
  block: (targetId: string) =>
    api.post('/moderation/block', { targetId }),
  unblock: (userId: string) =>
    api.delete(`/moderation/block/${userId}`),
};

// GDPR
export const gdprApi = {
  requestDeletion: () => api.post('/gdpr/delete-account'),
  exportData: () => api.get('/gdpr/export'),
  updateConsent: (marketingConsent: boolean) =>
    api.patch('/gdpr/consent', { marketingConsent }),
};

// Notifications
export const notificationsApi = {
  register: (token: string, deviceId?: string) =>
    api.post('/notifications/register', { token, deviceId }),
};

export const verificationApi = {
  getStatus: () => api.get('/verification/status'),
  initiate: () => api.post('/verification/initiate'),
};
