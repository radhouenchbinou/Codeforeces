import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/stores/authStore';
import { registerFcmToken, setBackgroundMessageHandler } from '../src/services/notifications';

// Register background/quit-state FCM handler at module level (required by Firebase)
setBackgroundMessageHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
});

function AuthGuard() {
  const { accessToken, isOnboarded, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (accessToken && !isOnboarded && !inOnboarding) {
      router.replace('/(onboarding)/create-profile');
    } else if (accessToken && isOnboarded && (inAuthGroup || inOnboarding)) {
      router.replace('/(app)/discovery');
    }
  }, [accessToken, isOnboarded, isLoading, segments]);

  // Register FCM token whenever the user logs in
  useEffect(() => {
    if (accessToken) {
      registerFcmToken().catch(() => {/* silently ignore — non-critical */});
    }
  }, [accessToken]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
