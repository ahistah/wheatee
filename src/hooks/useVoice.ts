import { Audio } from 'expo-av';

export async function createVoiceRecording() {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) return null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  return recording;
}
