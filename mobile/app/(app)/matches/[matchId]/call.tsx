import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function VoiceCallScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎙</Text>
      <Text style={styles.title}>Voice Calls Coming Soon</Text>
      <Text style={styles.subtitle}>This feature is not yet available.</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backLabel}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  icon: { fontSize: 56 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#888', fontSize: 14 },
  backBtn: { marginTop: 16, backgroundColor: '#e94560', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  backLabel: { color: '#fff', fontWeight: '600' },
});
