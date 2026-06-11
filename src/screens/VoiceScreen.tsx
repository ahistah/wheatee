import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { askWheatee, buildAdviceRecord, saveRecord } from '../services/api';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const isProductionApp = process.env.EXPO_PUBLIC_APP_ENV === 'production';

export function VoiceScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { farmProfile } = useFarm();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string>();
  const [audioBase64, setAudioBase64] = useState<string>();
  const [transcript, setTranscript] = useState(isProductionApp ? '' : 'My wheat crop needs fertilizer advice.');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function startRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      setNotice('Microphone permission is required for voice questions.');
      return;
    }

    try {
      setNotice(null);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const next = new Audio.Recording();
      await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await next.startAsync();
      setRecording(next);
    } catch {
      setNotice('Recording could not start on this device.');
    }
  }

  async function stopRecording() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI() ?? undefined;
    setAudioUri(uri);
    if (uri) {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      setAudioBase64(base64);
    }
    setRecording(null);
  }

  async function submitVoice() {
    if (!user || !transcript.trim()) return;
    setLoading(true);
    setNotice(null);
    try {
      const result = await askWheatee({
        text: transcript.trim(),
        audioUri,
        audioBase64,
        audioMimeType: 'audio/m4a',
        userId: user.userId,
        farmProfile,
      });
      const record = buildAdviceRecord(user.userId, transcript.trim(), result);
      await saveRecord(record);
      navigation.navigate('Results', { title: 'Voice Advice', record });
    } catch {
      setNotice('Voice advice failed. Check the backend connection or edit the transcript and retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>Voice question</Text>
      <Text style={styles.subtitle}>Record Urdu or English, then confirm the transcript before sending it through intent routing.</Text>
      {notice ? <StatusBanner tone="warning" icon="alert-circle" text={notice} /> : null}
      <View style={styles.recorder}>
        <Text style={styles.status}>{recording ? 'Recording...' : audioUri ? 'Recording ready' : 'Tap mic to record'}</Text>
        <Button
          label={recording ? 'Stop' : 'Record'}
          icon={recording ? 'stop' : 'mic'}
          variant={recording ? 'danger' : 'primary'}
          onPress={recording ? stopRecording : startRecording}
        />
      </View>
      <TextInput
        value={transcript}
        onChangeText={setTranscript}
        placeholder="Transcript preview from Google STT v2"
        multiline
        style={styles.input}
      />
      {loading ? <ActivityIndicator color={colors.leafDark} /> : <Button label="Ask Wheatee" icon="send" onPress={submitVoice} disabled={!transcript.trim()} />}
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
  recorder: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 12,
  },
  status: {
    color: colors.muted,
    fontWeight: '700',
  },
  input: {
    minHeight: 120,
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
