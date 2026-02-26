import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/services/api';

type Step = 'credentials' | 'gdpr';

export default function RegisterScreen() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setStep('gdpr');
  };

  const handleRegister = async () => {
    if (!gdprConsent) {
      Alert.alert('Consent Required', 'You must accept the Terms and Privacy Policy to create an account.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email,
        password,
        gdprConsent: true,
        marketingConsent,
        gdprConsentVersion: '1.0',
      });
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'gdpr') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Privacy & Consent</Text>
        <Text style={styles.subtitle}>Before we continue, please review our terms.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Privacy</Text>
          <Text style={styles.cardText}>
            - Your data is stored securely in EU servers only.{'\n'}
            - Your photos are hidden until you both consent to reveal them.{'\n'}
            - We never store biometric data.{'\n'}
            - You can delete your account and all data at any time.{'\n'}
            - We comply fully with GDPR (EU 2016/679).
          </Text>
        </View>

        <TouchableOpacity style={styles.checkRow} onPress={() => setGdprConsent(!gdprConsent)}>
          <View style={[styles.checkbox, gdprConsent && styles.checkboxChecked]}>
            {gdprConsent && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I accept the <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkRow} onPress={() => setMarketingConsent(!marketingConsent)}>
          <View style={[styles.checkbox, marketingConsent && styles.checkboxChecked]}>
            {marketingConsent && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>I accept marketing communications (optional)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!gdprConsent || loading) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!gdprConsent || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep('credentials')} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start connecting through voice</Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { padding: 28, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 32 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  cardTitle: { color: '#fff', fontWeight: '600', marginBottom: 8 },
  cardText: { color: '#aaa', lineHeight: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#e94560' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkLabel: { flex: 1, color: '#ccc', lineHeight: 20 },
  link: { color: '#e94560' },
  back: { alignItems: 'center', marginTop: 20 },
  backText: { color: '#888', fontSize: 14 },
});
