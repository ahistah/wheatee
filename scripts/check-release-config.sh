#!/usr/bin/env bash
set -euo pipefail

required_files=(
  app.config.js
  app.json
  eas.json
  .env.example
  docs/play-store-release.md
  docs/privacy-policy.md
  scripts/check-eas-production-env.sh
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
grep -q 'local farmer session' docs/privacy-policy.md
grep -q 'Delete farm profile' docs/privacy-policy.md
grep -q 'uploaded crop images' docs/privacy-policy.md
grep -q 'MongoDB Atlas' docs/privacy-policy.md
grep -q 'Vertex AI/Gemini' docs/privacy-policy.md
grep -q 'Google Cloud Speech-to-Text' docs/privacy-policy.md
grep -q 'Mapbox' docs/privacy-policy.md
grep -q 'EXPO_PUBLIC_API_URL must be an HTTPS Cloud Run URL' scripts/check-eas-production-env.sh
grep -q 'RNMAPBOX_MAPS_DOWNLOAD_TOKEN must be a secret Mapbox downloads token' scripts/check-eas-production-env.sh

EAS_BUILD_PROFILE=production \
EXPO_PUBLIC_APP_ENV=production \
EXPO_PUBLIC_API_URL=https://example.com \
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.test \
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.test \
bunx expo config --type public >/tmp/wheatee-expo-production-config.txt
