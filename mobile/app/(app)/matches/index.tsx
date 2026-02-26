import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { matchesApi } from '../../../src/services/api';
import { useMatchStore } from '../../../src/stores/matchStore';

export default function MatchesScreen() {
  const router = useRouter();
  const { setMatches, matches } = useMatchStore();

  const { isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data } = await matchesApi.getMatches();
      setMatches(data);
      return data;
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        {matches.length > 0 && (
          <Text style={styles.count}>{matches.length} active</Text>
        )}
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎧</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            Explore profiles in Discover and express interest.{'\n'}Matches appear when it's mutual.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#e94560" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.matchCard}
              onPress={() => router.push(`/(app)/matches/${item.id}`)}
            >
              {/* Avatar placeholder */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.partner.displayName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>

              <View style={styles.matchInfo}>
                <View style={styles.matchRow}>
                  <Text style={styles.matchName}>
                    {item.partner.displayName}, {item.partner.age}
                  </Text>
                  <Text style={styles.matchDate}>{formatDate(item.createdAt)}</Text>
                </View>

                <View style={styles.badges}>
                  {item.voiceCallsUnlocked && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>🎙 Calls unlocked</Text>
                    </View>
                  )}
                  {item.photosRevealed && (
                    <View style={[styles.badge, styles.badgeRevealed]}>
                      <Text style={styles.badgeText}>📸 Photos revealed</Text>
                    </View>
                  )}
                  {item.partnerRevealConsent && !item.photosRevealed && (
                    <View style={[styles.badge, styles.badgeWaiting]}>
                      <Text style={styles.badgeText}>👀 Wants to reveal</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  count: { color: '#888', fontSize: 13 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { color: '#888', textAlign: 'center', lineHeight: 22 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  matchInfo: { flex: 1 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  matchDate: { color: '#555', fontSize: 12 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRevealed: { backgroundColor: '#1a472a' },
  badgeWaiting: { backgroundColor: '#3d2b1f' },
  badgeText: { color: '#aaa', fontSize: 11 },
  chevron: { color: '#555', fontSize: 22 },
});
