#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  EXPO_PUBLIC_API_URL
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  RNMAPBOX_MAPS_DOWNLOAD_TOKEN
)

for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing production EAS env: $name"
    exit 1
  fi
done

if [[ "${EXPO_PUBLIC_APP_ENV:-production}" != "production" ]]; then
  echo "EXPO_PUBLIC_APP_ENV must be production for release builds."
  exit 1
fi

values_to_check=(
  "$EXPO_PUBLIC_API_URL"
  "$EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN"
  "$RNMAPBOX_MAPS_DOWNLOAD_TOKEN"
)

for value in "${values_to_check[@]}"; do
  if [[ "$value" == *localhost* || "$value" == *127.0.0.1* || "$value" == *example* || "$value" == your-* || "$value" == *YOUR_* ]]; then
    echo "Production EAS env still contains a local or placeholder value: $value"
    exit 1
  fi
done

if [[ "$EXPO_PUBLIC_API_URL" != https://* ]]; then
  echo "EXPO_PUBLIC_API_URL must be an HTTPS Cloud Run URL for production."
  exit 1
fi

if [[ "$EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN" != pk.* ]]; then
  echo "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN must be a public Mapbox token starting with pk."
  exit 1
fi

if [[ "$RNMAPBOX_MAPS_DOWNLOAD_TOKEN" != sk.* ]]; then
  echo "RNMAPBOX_MAPS_DOWNLOAD_TOKEN must be a secret Mapbox downloads token starting with sk."
  exit 1
fi

EAS_BUILD_PROFILE=production \
EXPO_PUBLIC_APP_ENV=production \
bunx expo config --type public >/tmp/wheatee-eas-production-env-config.txt

echo "Production EAS env check passed."
