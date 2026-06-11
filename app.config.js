module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const missing = [
      'EXPO_PUBLIC_API_URL',
      'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN',
      'RNMAPBOX_MAPS_DOWNLOAD_TOKEN',
    ].filter((key) => !process.env[key]);
    if (missing.length) {
      throw new Error(`Missing production Expo env: ${missing.join(', ')}`);
    }
  }

  return {
    ...config,
    plugins: [
      'expo-font',
      '@rnmapbox/maps',
      [
        'expo-image-picker',
        {
          photosPermission: 'Wheatee uses photo library access so farmers can select crop images for disease diagnosis.',
          cameraPermission: 'Wheatee uses the camera to capture crop images for disease diagnosis.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Wheatee uses the microphone to record farmer questions for agronomy advice.',
        },
      ],
    ],
    extra: {
      ...(config.extra ?? {}),
      mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
    },
  };
};
