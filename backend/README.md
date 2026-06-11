# Wheatee API

Cloud Run-ready backend for the Wheatee Expo app.

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

`ok: true` means the HTTP server is alive. `ready: true` means MongoDB, Vertex AI, GCS, and Speech-to-Text configuration are all present for production operation. In non-production runs, `missingConfig` is hidden so local development can use fallbacks without noisy status output.

Seed the `knowledge_base` collection when MongoDB is configured:

```bash
bun run seed:knowledge
```

With `MONGO_URI`, the command seeds MongoDB. Without database env vars, it verifies the in-memory seed set used only for local development.

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

After deployment, verify the deployed API is production-ready:

```bash
WHEATY_API_URL=https://your-cloud-run-url bun run check:health
```

MongoDB is the production database for this build. Supabase support remains in the codebase as an optional adapter, but production readiness checks require MongoDB.

`cloudrun.env` should contain the production `MONGO_URI` value and the target `MONGO_DB_NAME`.

The deploy script runs `scripts/check-cloud-run-config.sh` and sets `NODE_ENV=production` with the configured `MONGO_URI`.

Production startup requires MongoDB, Vertex AI, Speech-to-Text, and GCS configuration. Fallback responses are disabled when `NODE_ENV=production`, and crop image diagnosis fails closed if image upload to GCS is unavailable.

User authentication is disabled for this build. Farmer-data endpoints accept the `userId` supplied by the mobile app's local farmer session.

Public operational endpoints remain unauthenticated for monitoring/tool inspection:

- `GET /health`
- `GET /knowledge-base`
