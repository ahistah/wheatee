module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission: 'Wheaty uses photo library access so farmers can select crop images for disease diagnosis.',
          cameraPermission: 'Wheaty uses the camera to capture crop images for disease diagnosis.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Wheaty uses the microphone to record farmer questions for agronomy advice.',
        },
      ],
    ],
  };
};