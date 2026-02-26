import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ label, active }: { label: string; active: boolean }) {
  const icons: Record<string, string> = {
    discovery: '🔍',
    matches: '💬',
    profile: '👤',
  };
  return (
    <View style={styles.tab}>
      <Text style={styles.icon}>{icons[label] || '•'}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopColor: '#0f3460',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="discovery"
        options={{ tabBarLabel: 'Discover', tabBarIcon: ({ focused }) => <Text>{focused ? '🔍' : '🔎'}</Text> }}
      />
      <Tabs.Screen
        name="matches"
        options={{ tabBarLabel: 'Matches', tabBarIcon: ({ focused }) => <Text>{focused ? '💬' : '🗨️'}</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <Text>{focused ? '👤' : '👥'}</Text> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tab: { alignItems: 'center' },
  icon: { fontSize: 18 },
  label: { fontSize: 10, color: '#888' },
  labelActive: { color: '#e94560' },
});
