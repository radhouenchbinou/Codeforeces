import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../../src/services/api';
import { useAuthStore } from '../../../src/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await usersApi.getMe();
      return data;
    },
  });

  const computeAge = (birthDate: string) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: logout },
    ]);
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  const completeness = Math.round(profile.profileCompleteness || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/profile/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.displayName?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.lockBadge}>
          <Text style={styles.lockBadgeText}>🔒 Hidden</Text>
        </View>
        <Text style={styles.name}>
          {profile.displayName || 'Set your name'}, {computeAge(profile.birthDate) || '—'}
        </Text>
        {profile.locationCity && (
          <Text style={styles.location}>📍 {profile.locationCity}</Text>
        )}
      </View>

      {/* Completeness */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Strength</Text>
          <Text style={styles.completenessValue}>{completeness}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${completeness}%` }]} />
        </View>
        {!profile.voiceIntroUrl && (
          <TouchableOpacity onPress={() => router.push('/(app)/profile/edit')}>
            <Text style={styles.completenessHint}>
              💡 Add a voice intro to boost your visibility (+25%)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Intent & Preferences</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Looking for</Text>
          <Text style={styles.infoValue}>
            {profile.datingIntent
              ? profile.datingIntent.charAt(0).toUpperCase() + profile.datingIntent.slice(1)
              : '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gender</Text>
          <Text style={styles.infoValue}>
            {profile.gender ? profile.gender.replace('_', ' ') : '—'}
          </Text>
        </View>
        {profile.voiceIntroUrl ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Voice intro</Text>
            <Text style={[styles.infoValue, styles.green]}>✓ Added</Text>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Voice intro</Text>
            <Text style={styles.infoValue}>Not yet</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/profile/edit')}>
          <Text style={styles.actionText}>Edit Profile</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/profile/settings')}>
          <Text style={styles.actionText}>Settings & Privacy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Text style={[styles.actionText, styles.danger]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  settingsIcon: { fontSize: 22 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  lockBadge: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  lockBadgeText: { color: '#888', fontSize: 11 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  location: { color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: '600', marginBottom: 8 },
  completenessValue: { color: '#e94560', fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: '#0f3460', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: '#e94560', borderRadius: 3 },
  completenessHint: { color: '#f5a623', fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { color: '#888' },
  infoValue: { color: '#fff' },
  green: { color: '#7ed321' },
  actionsCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionText: { color: '#fff', fontSize: 15 },
  danger: { color: '#e94560' },
  chevron: { color: '#555', fontSize: 20 },
  divider: { height: 1, backgroundColor: '#0f3460' },
});
