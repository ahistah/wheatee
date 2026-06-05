#!/usr/bin/env bash
set -euo pipefail

required_files=(
  app.config.js
  app.json
  eas.json
  .env.example
  docs/play-store-release.md
  docs/privacy-policy.md
  assets/icon.png
  assets/images/icon.png
  assets/android-icon-foreground.png
  assets/android-icon-background.png
  assets/android-icon-monochrome.png
  assets/favicon.png
)

for file in "${required_files[@]}"; do
  test -f "$file"
done

required_env_names=(
  EXPO_PUBLIC_APP_ENV
  EXPO_PUBLIC_API_URL
  EXPO_PUBLIC_FIREBASE_API_KEY
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  RNMAPBOX_MAPS_DOWNLOAD_TOKEN
)

for name in "${required_env_names[@]}"; do
  grep -q "^${name}=" .env.example
done

grep -q '"description": "AI-powered wheat farming assistant' app.json
grep -q 'Privacy policy URL' docs/play-store-release.md
grep -q 'docs/privacy-policy.md' docs/play-store-release.md
grep -q 'Data Safety' docs/play-store-release.md
grep -q 'Firebase Authentication' docs/privacy-policy.md
grep -q 'Delete farm profile' docs/privacy-policy.md
grep -q 'Supabase Postgres' docs/privacy-policy.md
grep -q 'Vertex AI/Gemini' docs/privacy-policy.md
grep -q 'Google Cloud Speech-to-Text' docs/privacy-policy.md
grep -q 'Mapbox' docs/privacy-policy.md

EAS_BUILD_PROFILE=production \
EXPO_PUBLIC_APP_ENV=production \
EXPO_PUBLIC_API_URL=https://example.com \
EXPO_PUBLIC_FIREBASE_API_KEY=test-firebase-key \
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.test \
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.test \
bunx expo config --type public >/tmp/wheaty-expo-production-config.txt

if EAS_BUILD_PROFILE=production \
  EXPO_PUBLIC_APP_ENV=production \
  EXPO_PUBLIC_API_URL=https://example.com \
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.test \
  RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.test \
  bunx expo config --type public >/tmp/wheaty-expo-missing-firebase-config.txt 2>&1; then
  echo "Expected production Expo config to fail without EXPO_PUBLIC_FIREBASE_API_KEY."
  exit 1
fi
