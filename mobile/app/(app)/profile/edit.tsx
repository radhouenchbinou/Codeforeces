import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usersApi } from '../../../src/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const GENDERS = ['man', 'woman', 'non_binary', 'other'];
const INTENTS = ['serious', 'casual', 'both'];

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await usersApi.getMe();
      return data;
    },
  });

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [datingIntent, setDatingIntent] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setLocationCity(profile.locationCity || '');
      setDatingIntent(profile.datingIntent || '');
      setGender(profile.gender || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersApi.updateProfile({ displayName, bio, locationCity, datingIntent, gender });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#e94560" size="small" /> : <Text style={styles.save}>Save</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={60}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        maxLength={500}
        placeholder="Tell us about yourself..."
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={locationCity}
        onChangeText={setLocationCity}
        placeholder="Paris, Lyon..."
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>I am</Text>
      <View style={styles.pills}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, gender === g && styles.pillActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>
              {g.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Dating Intent</Text>
      <View style={styles.pills}>
        {INTENTS.map((i) => (
          <TouchableOpacity
            key={i}
            style={[styles.pill, datingIntent === i && styles.pillActive]}
            onPress={() => setDatingIntent(i)}
          >
            <Text style={[styles.pillText, datingIntent === i && styles.pillTextActive]}>
              {i.charAt(0).toUpperCase() + i.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  back: { color: '#e94560', fontSize: 16 },
  title: { color: '#fff', fontWeight: '700', fontSize: 18 },
  save: { color: '#e94560', fontWeight: '600', fontSize: 16 },
  label: { color: '#888', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
    backgroundColor: '#16213e',
  },
  pillActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  pillText: { color: '#aaa', fontSize: 13 },
  pillTextActive: { color: '#fff' },
});
