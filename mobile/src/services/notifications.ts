import messaging from '@react-native-firebase/messaging';
import { notificationsApi } from './api';

/**
 * Request notification permission (iOS prompt / Android 13+ prompt).
 * Returns true when the user granted permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Get the FCM token and register it with the backend.
 * Call this once after the user is authenticated.
 */
export async function registerFcmToken(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const token = await messaging().getToken();
  if (!token) return;

  await notificationsApi.register(token);
}

/**
 * Subscribe to foreground messages so the app can show in-app banners.
 * Returns the unsubscribe function — call it on component unmount.
 */
export function onForegroundMessage(
  handler: (title: string, body: string) => void,
): () => void {
  return messaging().onMessage((message) => {
    const title = message.notification?.title ?? '';
    const body = message.notification?.body ?? '';
    if (title || body) handler(title, body);
  });
}

/**
 * Register a background / quit-state message handler.
 * Must be called outside of any React component (top-level of the entry file).
 */
export function setBackgroundMessageHandler(): void {
  messaging().setBackgroundMessageHandler(async (_message) => {
    // FCM displays the notification automatically when the app is in background.
    // Add any data-only handling here if needed.
  });
}
