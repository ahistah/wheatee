# Wheaty API

Cloud Run-ready backend for the Wheaty Expo app.

## Run

```bash
bun install
cp .env.example .env
bun run dev
```

Health check:

```bash
curl http://localhost:8080/health
```

`ok: true` means the HTTP server is alive. `ready: true` means Supabase, Firebase, Vertex AI, GCS, and Speech-to-Text configuration are all present for production operation. In non-production runs, `missingConfig` is hidden so local development can use fallbacks without noisy status output.

Seed the `knowledge_base` collection when Supabase is configured:

```bash
bun run seed:knowledge
```

With `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, the command seeds Supabase. Without database env vars, it verifies the in-memory seed set used only for local development.

## Endpoints

- `POST /diagnose`
- `POST /ask`
- `POST /records`
- `GET /history?userId=&limit=20`
- `POST /farm-profile`
- `GET /farm-profile?userId=`
- `DELETE /account-data?userId=`
- `GET /health`
- `GET /knowledge-base`

Voice input is transcribed with Google Cloud Speech-to-Text v2 when these env vars are set:

- `SPEECH_PROJECT_ID` or `VERTEX_PROJECT_ID`
- `SPEECH_LOCATION`
- `SPEECH_RECOGNIZER`
- `SPEECH_MODEL`
- `SPEECH_LANGUAGE_CODES`

## Cloud Run

```bash
cp cloudrun.env.example cloudrun.env
set -a
source cloudrun.env
set +a
./scripts/deploy-cloud-run.sh
```

Run `supabase/schema.sql` in the Supabase SQL editor before deploying.

Set `SUPABASE_SERVICE_ROLE_KEY` and `FIREBASE_SERVICE_ACCOUNT_JSON` as Cloud Run secrets in production. Supabase is the production database; MongoDB support is retained only as a migration/development adapter.

Production startup requires Supabase, Firebase, Vertex AI, Speech-to-Text, and GCS configuration. Fallback responses are disabled when `NODE_ENV=production`, and crop image diagnosis fails closed if image upload to GCS is unavailable.

When `FIREBASE_SERVICE_ACCOUNT_JSON` is set, farmer-data endpoints must include:

```text
Authorization: Bearer <Firebase ID token>
```

Public operational endpoints remain unauthenticated for monitoring/tool inspection:

- `GET /health`
- `GET /knowledge-base`
