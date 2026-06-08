#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  GOOGLE_CLOUD_PROJECT
  GCS_BUCKET
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY_SECRET
  FIREBASE_SERVICE_ACCOUNT_JSON_SECRET
)

for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing Cloud Run deploy env: $name"
    exit 1
  fi
done

values_to_check=(
  "$GOOGLE_CLOUD_PROJECT"
  "$GCS_BUCKET"
  "$SUPABASE_URL"
  "$SUPABASE_SERVICE_ROLE_KEY_SECRET"
  "$FIREBASE_SERVICE_ACCOUNT_JSON_SECRET"
)

for value in "${values_to_check[@]}"; do
  if [[ "$value" == your-* || "$value" == *YOUR_* || "$value" == *example* ]]; then
    echo "Cloud Run deploy env still contains a placeholder value: $value"
    exit 1
  fi
done
