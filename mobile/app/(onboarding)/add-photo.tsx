import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { photosApi } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';

export default function AddPhotoScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setOnboarded } = useAuthStore();

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!photoUri) {
      Alert.alert('Required', 'Please select a photo first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      await photosApi.upload(formData);

      // Mark onboarding as complete
      setOnboarded(true);
      router.replace('/(app)/discovery');
    } catch (err: any) {
      Alert.alert('Upload failed', err.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const skipToApp = () => {
    // In MVP, photo is required. But allow skip with warning.
    Alert.alert(
      'Photo Required',
      'At least one photo is required to appear in discovery. You can add it from your profile later.',
      [
        { text: 'Add Photo', style: 'cancel' },
        {
          text: 'Skip for Now',
          onPress: () => {
            setOnboarded(true);
            router.replace('/(app)/discovery');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your Photo</Text>
      <Text style={styles.subtitle}>
        Your photo is hidden from everyone.{'\n'}It will only be shown if you both mutually agree to reveal.
      </Text>

      <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>📷</Text>
            <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.lockNote}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockText}>Stored securely. Never shared without your consent.</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!photoUri || loading) && styles.buttonDisabled]}
        onPress={handleUpload}
        disabled={!photoUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Upload & Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={skipToApp} style={styles.skip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 28,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  photoBox: {
    width: 220,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  photoPlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  photoPlaceholderText: { color: '#888' },
  lockNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  lockIcon: { fontSize: 16 },
  lockText: { color: '#666', fontSize: 13 },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { marginTop: 16 },
  skipText: { color: '#555', fontSize: 14 },
});
