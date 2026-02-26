import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { discoveryApi } from '../../../src/services/api';
import { useDiscoveryStore } from '../../../src/stores/discoveryStore';
import VoicePlayer from '../../../src/components/VoicePlayer';

const INTENT_LABELS: Record<string, string> = {
  serious: 'Serious',
  casual: 'Casual',
  both: 'Open',
};

const INTENT_COLORS: Record<string, string> = {
  serious: '#4a90d9',
  casual: '#f5a623',
  both: '#7ed321',
};

export default function DiscoveryScreen() {
  const { deck, currentIndex, setDeck, advance, setLoading, isLoading } = useDiscoveryStore();
  const [acting, setActing] = useState(false);

  useEffect(() => {
    loadDeck();
  }, []);

  const loadDeck = async () => {
    setLoading(true);
    try {
      const { data } = await discoveryApi.getDailyDeck();
      setDeck(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'interested' | 'pass') => {
    const card = deck[currentIndex];
    if (!card) return;

    setActing(true);
    try {
      const { data } = await discoveryApi.act(card.userId, action);
      if (data.matched) {
        Alert.alert(
          'It\'s a Match! 🎉',
          `You and ${card.displayName} are both interested. Start a voice conversation!`,
        );
      }
      advance();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setActing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  const remaining = deck.length - currentIndex;
  const card = deck[currentIndex];

  if (!card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🌙</Text>
        <Text style={styles.emptyTitle}>All done for today</Text>
        <Text style={styles.emptySubtitle}>
          New profiles will be ready tomorrow.{'\n'}Good things take time.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.remaining}>{remaining} left today</Text>
      </View>

      <ScrollView contentContainerStyle={styles.cardContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Intent badge */}
          <View style={[styles.intentBadge, { backgroundColor: INTENT_COLORS[card.datingIntent] + '20', borderColor: INTENT_COLORS[card.datingIntent] }]}>
            <Text style={[styles.intentText, { color: INTENT_COLORS[card.datingIntent] }]}>
              {INTENT_LABELS[card.datingIntent] || card.datingIntent}
            </Text>
          </View>

          {/* Name & age */}
          <Text style={styles.name}>{card.displayName}, {card.age}</Text>
          {card.locationCity && (
            <Text style={styles.location}>📍 {card.locationCity}</Text>
          )}

          {/* Voice intro */}
          {card.voiceIntroUrl && (
            <View style={styles.voiceSection}>
              <Text style={styles.voiceLabel}>Voice Intro</Text>
              <VoicePlayer url={card.voiceIntroUrl} duration={card.voiceIntroDuration} />
            </View>
          )}

          {/* Bio */}
          {card.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>About</Text>
              <Text style={styles.bioText}>{card.bio}</Text>
            </View>
          )}

          {/* Photo lock reminder */}
          <View style={styles.photoNote}>
            <Text style={styles.photoNoteText}>🔒 Photos hidden — revealed only by mutual consent</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.passBtn]}
          onPress={() => handleAction('pass')}
          disabled={acting}
        >
          <Text style={styles.actionBtnText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.interestedBtn]}
          onPress={() => handleAction('interested')}
          disabled={acting}
        >
          {acting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionBtnText}>Interested</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  remaining: { color: '#888', fontSize: 13 },
  cardContainer: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  intentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  intentText: { fontSize: 12, fontWeight: '600' },
  name: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  location: { color: '#888', marginBottom: 20, fontSize: 14 },
  voiceSection: { marginBottom: 20 },
  voiceLabel: { color: '#666', fontSize: 12, marginBottom: 8 },
  bioSection: { marginBottom: 20 },
  bioLabel: { color: '#666', fontSize: 12, marginBottom: 8 },
  bioText: { color: '#ccc', lineHeight: 22, fontSize: 15 },
  photoNote: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  photoNoteText: { color: '#888', fontSize: 12 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  passBtn: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#0f3460' },
  interestedBtn: { backgroundColor: '#e94560' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySubtitle: { color: '#888', textAlign: 'center', lineHeight: 22 },
});
