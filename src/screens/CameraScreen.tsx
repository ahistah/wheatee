import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { buildDiagnosisRecord, diagnoseCrop, saveRecord } from '../services/api';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const isProductionApp = process.env.EXPO_PUBLIC_APP_ENV === 'production';

export function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string>();
  const [imageBase64, setImageBase64] = useState<string>();
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [notes, setNotes] = useState(isProductionApp ? '' : 'Leaves are turning yellow in patches.');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function pickImage(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice(useCamera ? 'Camera permission is required for crop capture.' : 'Gallery permission is required to select crop images.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: true });

    if (!result.canceled) {
      const asset = result.assets[0];
      setNotice(null);
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? undefined);
      setImageMimeType(asset.mimeType ?? 'image/jpeg');
    }
  }

  async function runDiagnosis() {
    if (!user || !imageUri) return;
    setLoading(true);
    setNotice(null);
    try {
      const result = await diagnoseCrop({ imageUri, imageBase64, imageMimeType, text: notes, userId: user.userId });
      const record = buildDiagnosisRecord(user.userId, notes, imageUri, result);
      await saveRecord(record);
      navigation.navigate('Results', { title: 'Disease Diagnosis', record });
    } catch {
      setNotice('Diagnosis failed. Check the backend connection or try another image.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>Crop image diagnosis</Text>
      <Text style={styles.subtitle}>Capture wheat leaves clearly. Add field context so the disease workflow can prioritize visible symptoms and treatment steps.</Text>
      {notice ? <StatusBanner tone="warning" icon="alert-circle" text={notice} /> : null}
      <View style={styles.actions}>
        <Button label="Camera" icon="camera" onPress={() => pickImage(true)} style={styles.action} />
        <Button label="Gallery" icon="images" variant="secondary" onPress={() => pickImage(false)} style={styles.action} />
      </View>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <View style={styles.empty}><Text style={styles.emptyText}>No crop image selected</Text></View>}
      <TextInput value={notes} onChangeText={setNotes} placeholder="Optional voice/text context" multiline style={styles.input} />
      {loading ? <ActivityIndicator color={colors.leafDark} /> : <Button label="Diagnose" icon="leaf" onPress={runDiagnosis} disabled={!imageUri} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: colors.field,
  },
  empty: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '700',
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
