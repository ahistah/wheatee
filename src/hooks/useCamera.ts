import * as ImagePicker from 'expo-image-picker';

export async function useCameraImage(fromCamera: boolean) {
  const permission = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) return null;

  const result = fromCamera
    ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

  return result.canceled ? null : result.assets[0].uri;
}
