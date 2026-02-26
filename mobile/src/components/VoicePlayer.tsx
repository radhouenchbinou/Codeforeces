import { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';

interface Props {
  url: string;
  duration?: number | null;
}

export default function VoicePlayer({ url, duration }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const formatDuration = (secs?: number | null) => {
    if (!secs) return '0:30';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    if (loading) return;

    if (playing && soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlaying(false);
              soundRef.current?.unloadAsync();
              soundRef.current = null;
            }
          },
        );
        soundRef.current = sound;
      }
      setPlaying(true);
    } catch (err) {
      console.error('Audio error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playBtn} onPress={togglePlay} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
        )}
      </TouchableOpacity>

      {/* Waveform visualization (decorative) */}
      <View style={styles.waveform}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: 4 + Math.sin(i * 0.8) * 12 + Math.sin(i * 1.5) * 8 },
              playing && styles.barActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.duration}>{formatDuration(duration)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: '#fff', fontSize: 14 },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
  },
  bar: {
    width: 3,
    backgroundColor: '#4a6fa5',
    borderRadius: 2,
  },
  barActive: { backgroundColor: '#e94560' },
  duration: { color: '#888', fontSize: 12 },
});
