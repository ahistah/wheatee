#!/usr/bin/env bash
set -euo pipefail

test -f Dockerfile
test -f .dockerignore
test -f package.json
test -f bun.lock
test -f openapi.yaml
test -f cloudrun.env.example
test -x scripts/deploy-cloud-run.sh

grep -q "COPY package.json bun.lock" Dockerfile
grep -q "EXPOSE 8080" Dockerfile
grep -q "gcloud run deploy" scripts/deploy-cloud-run.sh
