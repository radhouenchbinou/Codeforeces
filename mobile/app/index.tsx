import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { accessToken, isOnboarded, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  if (!accessToken) return <Redirect href="/(auth)/login" />;
  if (!isOnboarded) return <Redirect href="/(onboarding)/create-profile" />;
  return <Redirect href="/(app)/discovery" />;
}
