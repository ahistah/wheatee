import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { diagnoseCrop, saveRecord } from '../services/api';
import { HistoryRecord, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string>();
  const [notes, setNotes] = useState('Leaves are turning yellow in patches.');
  const [loading, setLoading] = useState(false);

  async function pickImage(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function runDiagnosis() {
    if (!user || !imageUri) return;
    setLoading(true);
    try {
      const result = await diagnoseCrop({ imageUri, text: notes, userId: user.userId });
      const response = [
        `${result.disease} (${Math.round(result.confidence * 100)}% confidence)`,
        `Symptoms: ${result.symptoms.join(', ')}`,
        `Treatment: ${result.treatmentSteps.join(' ')}`,
        result.recommendation,
      ].join('\n\n');

      const record: HistoryRecord = {
        id: `diagnosis-${Date.now()}`,
        userId: user.userId,
        type: 'diagnosis',
        input: notes || 'Crop image diagnosis',
        response,
        intent: result.intent,
        timestamp: new Date().toISOString(),
        imageUri,
        confidence: result.confidence,
      };
      await saveRecord(record);
      navigation.navigate('Results', { title: 'Disease Diagnosis', record });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>Crop image diagnosis</Text>
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
