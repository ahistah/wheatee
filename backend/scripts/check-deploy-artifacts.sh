#!/usr/bin/env bash
set -euo pipefail

test -f Dockerfile
test -f .dockerignore
test -f package.json
test -f bun.lock
test -f openapi.yaml
test -f agent-builder.md
test -f cloudrun.env.example
test -x scripts/deploy-cloud-run.sh
test -x scripts/check-cloud-run-config.sh
test -x scripts/check-production-health.sh

grep -q "COPY package.json bun.lock" Dockerfile
grep -q "EXPOSE 8080" Dockerfile
grep -q "gcloud run deploy" scripts/deploy-cloud-run.sh
grep -q "NODE_ENV=production" scripts/deploy-cloud-run.sh
grep -q -- "--set-secrets" scripts/deploy-cloud-run.sh
grep -q "SUPABASE_SERVICE_ROLE_KEY_SECRET" cloudrun.env.example
grep -q "FIREBASE_SERVICE_ACCOUNT_JSON_SECRET" cloudrun.env.example
grep -q "WHEATY_API_URL" scripts/check-production-health.sh
grep -q "ready !== true" scripts/check-production-health.sh
grep -q "firebaseBearer" openapi.yaml
grep -q "bearerFormat: Firebase ID token" openapi.yaml
grep -q "cropImagesDeleted" openapi.yaml
grep -q "delete_account_data" agent-builder.md
grep -q "imageDisplayURL" agent-builder.md
grep -q "ready: true" agent-builder.md
