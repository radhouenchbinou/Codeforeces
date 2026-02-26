import { useState } from 'react';
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
import { usersApi } from '../../src/services/api';

const GENDERS = ['man', 'woman', 'non_binary', 'other'];
const INTENTS = ['serious', 'casual', 'both'];
const SEEKING = ['man', 'woman', 'non_binary', 'other'];

export default function CreateProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [seekingGenders, setSeekingGenders] = useState<string[]>([]);
  const [datingIntent, setDatingIntent] = useState('');
  const [bio, setBio] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleSeeking = (g: string) => {
    setSeekingGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const handleSave = async () => {
    if (!displayName || !birthDate || !gender || !datingIntent) {
      Alert.alert('Required', 'Please fill in name, birth date, gender, and dating intent');
      return;
    }
    setLoading(true);
    try {
      await usersApi.updateProfile({
        displayName,
        birthDate,
        gender,
        seekingGenders,
        datingIntent,
        bio,
        locationCity,
      });
      router.replace('/(onboarding)/add-photo');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself</Text>

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        placeholder="How should we call you?"
        placeholderTextColor="#888"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={60}
      />

      <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="1995-06-15"
        placeholderTextColor="#888"
        value={birthDate}
        onChangeText={setBirthDate}
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

      <Text style={styles.label}>I'm looking for</Text>
      <View style={styles.pills}>
        {SEEKING.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, seekingGenders.includes(g) && styles.pillActive]}
            onPress={() => toggleSeeking(g)}
          >
            <Text style={[styles.pillText, seekingGenders.includes(g) && styles.pillTextActive]}>
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

      <Text style={styles.label}>Bio (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="A few words about you..."
        placeholderTextColor="#888"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <Text style={styles.label}>City (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Paris, Lyon..."
        placeholderTextColor="#888"
        value={locationCity}
        onChangeText={setLocationCity}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Next: Add Photo →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subtitle: { color: '#888', marginBottom: 28 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0f3460',
    fontSize: 15,
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
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
