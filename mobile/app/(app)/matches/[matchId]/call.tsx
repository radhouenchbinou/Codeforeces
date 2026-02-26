import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { voiceApi } from '../../../../src/services/api';
import { createAgoraEngine, joinVoiceCall, leaveVoiceCall } from '../../../../src/services/agora';

export default function VoiceCallScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [connecting, setConnecting] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const engineRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    if (!connecting) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connecting]);

  const startCall = async () => {
    try {
      const { data } = await voiceApi.getToken(matchId);
      const engine = await createAgoraEngine();
      if (!engine) {
        Alert.alert('Error', 'Voice calls not available on this device');
        router.back();
        return;
      }
      engineRef.current = engine;
      await joinVoiceCall(engine, {
        token: data.token,
        channelName: data.channelName,
        uid: data.uid,
      });
      setConnecting(false);
    } catch (err: any) {
      Alert.alert('Call failed', err.response?.data?.message || 'Could not start call');
      router.back();
    }
  };

  const endCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (engineRef.current) {
      await leaveVoiceCall(engineRef.current);
      engineRef.current = null;
    }
  };

  const handleEnd = async () => {
    await endCall();
    router.back();
  };

  const toggleMute = async () => {
    if (engineRef.current) {
      await engineRef.current.muteLocalAudioStream(!muted);
    }
    setMuted(!muted);
  };

  const toggleSpeaker = async () => {
    if (engineRef.current) {
      await engineRef.current.setEnableSpeakerphone(!speaker);
    }
    setSpeaker(!speaker);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Animated avatar */}
      <View style={[styles.avatarOuter, !muted && !connecting && styles.speaking]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>🎙</Text>
        </View>
      </View>

      {connecting ? (
        <>
          <ActivityIndicator color="#e94560" size="large" style={{ marginTop: 24 }} />
          <Text style={styles.status}>Connecting...</Text>
        </>
      ) : (
        <Text style={styles.status}>{formatTime(elapsed)}</Text>
      )}

      <Text style={styles.note}>Voice only — photos stay private</Text>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, muted && styles.controlActive]} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
          <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.endBtn]} onPress={handleEnd}>
          <Text style={styles.endIcon}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, speaker && styles.controlActive]} onPress={toggleSpeaker}>
          <Text style={styles.controlIcon}>{speaker ? '🔊' : '🔈'}</Text>
          <Text style={styles.controlLabel}>{speaker ? 'Speaker' : 'Earpiece'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speaking: {
    borderColor: '#e94560',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: { fontSize: 40 },
  status: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 16 },
  note: { color: '#888', marginTop: 8, fontSize: 13 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginTop: 60,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#16213e',
    minWidth: 70,
  },
  controlActive: { backgroundColor: '#0f3460' },
  controlIcon: { fontSize: 24 },
  controlLabel: { color: '#888', fontSize: 11 },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endIcon: { fontSize: 28 },
});
