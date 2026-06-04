import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { askWheaty, saveRecord } from '../services/api';
import { HistoryRecord, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function VoiceScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { farmProfile } = useFarm();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string>();
  const [transcript, setTranscript] = useState('My wheat crop needs fertilizer advice.');
  const [loading, setLoading] = useState(false);

  async function startRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const next = new Audio.Recording();
    await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await next.startAsync();
    setRecording(next);
  }

  async function stopRecording() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    setAudioUri(recording.getURI() ?? undefined);
    setRecording(null);
  }

  async function submitVoice() {
    if (!user || !transcript.trim()) return;
    setLoading(true);
    try {
      const result = await askWheaty({ text: transcript.trim(), audioUri, userId: user.userId, farmProfile });
      const response = `${result.response}\n\n${result.actionItems.map((item) => `- ${item}`).join('\n')}`;
      const record: HistoryRecord = {
        id: `voice-${Date.now()}`,
        userId: user.userId,
        type: result.intent === 'FARM_PLANNING' ? 'plan' : 'conversation',
        input: transcript.trim(),
        response,
        intent: result.intent,
        timestamp: new Date().toISOString(),
      };
      await saveRecord(record);
      navigation.navigate('Results', { title: 'Voice Advice', record });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>Voice question</Text>
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
      {loading ? <ActivityIndicator color={colors.leafDark} /> : <Button label="Ask Wheaty" icon="send" onPress={submitVoice} disabled={!transcript.trim()} />}
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
