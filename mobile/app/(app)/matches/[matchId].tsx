import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  OverlayProvider,
} from 'stream-chat-expo';
import { useQuery } from '@tanstack/react-query';
import { matchesApi, chatApi } from '../../../src/services/api';
import { connectStreamUser, getMatchChannel } from '../../../src/services/stream';
import { useAuthStore } from '../../../src/stores/authStore';
import { getStreamClient } from '../../../src/services/stream';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [channel, setChannel] = useState<any>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);

  const { data: match, refetch: refetchMatch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data } = await matchesApi.getMatch(matchId);
      return data;
    },
  });

  useEffect(() => {
    setupStream();
  }, [match]);

  const setupStream = async () => {
    if (!match?.streamChannelId || !authUser) return;
    try {
      const { data: tokenData } = await chatApi.getToken();
      await connectStreamUser(authUser.id, tokenData.token);
      const ch = await getMatchChannel(match.streamChannelId);
      setChannel(ch);
      setStreamReady(true);
    } catch (err) {
      console.error('Stream setup error', err);
    }
  };

  const handleRevealConsent = async (consent: boolean) => {
    setRevealLoading(true);
    try {
      const { data } = await matchesApi.setRevealConsent(matchId, consent);
      if (data.matchEnded) {
        Alert.alert('Match Ended', 'The match has ended.');
        router.back();
      } else {
        refetchMatch();
        if (data.photosRevealed) {
          Alert.alert('Photos Revealed! 📸', 'Both of you agreed to reveal. You can now see each other\'s photos!');
        } else if (consent) {
          Alert.alert('Consent Sent', 'Waiting for your match to agree as well...');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleEndMatch = () => {
    Alert.alert('End Match?', 'Are you sure you want to unmatch? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Match',
        style: 'destructive',
        onPress: async () => {
          setEndLoading(true);
          try {
            await matchesApi.endMatch(matchId);
            router.back();
          } finally {
            setEndLoading(false);
          }
        },
      },
    ]);
  };

  const goToVoiceCall = () => {
    if (!match?.voiceCallsUnlocked) {
      const needed = 10 - (match?.messageCount || 0);
      Alert.alert(
        'Not yet 🔒',
        `Voice calls unlock after 10 messages. ${needed} more to go!`,
      );
      return;
    }
    router.push(`/(app)/matches/${matchId}/call`);
  };

  if (!match) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{match.partner?.displayName}, {match.partner?.age}</Text>
          <Text style={styles.headerSub}>
            {match.messageCount} messages · {match.voiceCallsUnlocked ? '🎙 calls on' : `🔒 ${10 - match.messageCount} msgs to calls`}
          </Text>
        </View>
        <TouchableOpacity onPress={goToVoiceCall} style={styles.callBtn}>
          <Text style={styles.callIcon}>{match.voiceCallsUnlocked ? '🎙' : '🔒'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEndMatch} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Photo reveal banner */}
      {!match.photosRevealed && (
        <View style={styles.revealBanner}>
          {match.partnerRevealConsent && !match.myRevealConsent ? (
            <>
              <Text style={styles.revealText}>
                {match.partner.displayName} wants to reveal their photo 👀
              </Text>
              <View style={styles.revealActions}>
                <TouchableOpacity
                  style={styles.revealAccept}
                  onPress={() => handleRevealConsent(true)}
                  disabled={revealLoading}
                >
                  <Text style={styles.revealAcceptText}>Reveal too</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}} style={styles.revealDecline}>
                  <Text style={styles.revealDeclineText}>Not yet</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : match.myRevealConsent && !match.partnerRevealConsent ? (
            <Text style={styles.revealText}>
              Waiting for {match.partner.displayName} to agree to reveal...
            </Text>
          ) : (
            <TouchableOpacity onPress={() => handleRevealConsent(true)} disabled={revealLoading}>
              <Text style={styles.revealTextCta}>
                📸 Both reveal photos? Tap to start
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Chat */}
      {streamReady && channel ? (
        <OverlayProvider>
          <Chat client={getStreamClient()}>
            <Channel channel={channel} keyboardVerticalOffset={10}>
              <View style={{ flex: 1 }}>
                <MessageList />
                <MessageInput />
              </View>
            </Channel>
          </Chat>
        </OverlayProvider>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color="#e94560" />
          <Text style={styles.loadingText}>Setting up chat...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    gap: 8,
  },
  backBtn: { padding: 8 },
  backIcon: { color: '#fff', fontSize: 28 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerSub: { color: '#888', fontSize: 11, marginTop: 2 },
  callBtn: { padding: 8 },
  callIcon: { fontSize: 22 },
  menuBtn: { padding: 8 },
  menuIcon: { color: '#fff', fontSize: 20 },
  revealBanner: {
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    padding: 14,
    alignItems: 'center',
  },
  revealText: { color: '#ccc', fontSize: 13, textAlign: 'center' },
  revealTextCta: { color: '#e94560', fontSize: 13, fontWeight: '600' },
  revealActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  revealAccept: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  revealAcceptText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  revealDecline: { padding: 8 },
  revealDeclineText: { color: '#888', fontSize: 13 },
});
