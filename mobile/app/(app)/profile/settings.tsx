import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { gdprApi } from '../../../src/services/api';
import { useAuthStore } from '../../../src/stores/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account and all personal data will be permanently deleted within 30 days. You can cancel by signing back in within that period.\n\nThis action cannot be easily undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            try {
              await gdprApi.requestDeletion();
              await logout();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to request deletion');
            }
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      const { data } = await gdprApi.exportData();
      Alert.alert(
        'Data Export',
        'Your data export is ready. In a production app, this would be emailed to you or available for download.',
      );
    } catch {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const Row = ({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) => (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress}>
        <Text style={[styles.rowText, danger && styles.danger]}>{label}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <Row label="Edit Profile" onPress={() => router.push('/(app)/profile/edit')} />
        <Row label="Blocked Users" onPress={() => Alert.alert('Blocked Users', 'Coming soon')} />
      </View>

      <Text style={styles.section}>Privacy & GDPR</Text>
      <View style={styles.card}>
        <Row label="Export My Data" onPress={handleExportData} />
        <Row label="Delete My Account" onPress={handleDeleteAccount} danger />
      </View>

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <Row label="Privacy Policy" onPress={() => Alert.alert('Privacy Policy', 'Opens web browser in production')} />
        <Row label="Terms of Service" onPress={() => Alert.alert('Terms', 'Opens web browser in production')} />
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Version</Text>
          <Text style={styles.rowValue}>1.0.0 MVP</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  back: { color: '#e94560', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  section: { color: '#666', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: { color: '#fff', fontSize: 15 },
  rowValue: { color: '#888', fontSize: 14 },
  danger: { color: '#e94560' },
  chevron: { color: '#555', fontSize: 20 },
  divider: { height: 1, backgroundColor: '#0f3460' },
});
