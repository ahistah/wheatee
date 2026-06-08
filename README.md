# Wheaty

Expo MVP for the Wheaty digital agronomist agent described in `Wheaty_MVP_Gemini3.docx`.

## Run

```bash
bun install
bun start
```

Open the app with Expo Go, Android emulator, or an Expo development build.

## Test

```bash
bun run typecheck
bunx expo-doctor
bun run api:typecheck
bun run api:test
bun run api:seed-knowledge
bun run api:check-deploy
WHEATY_API_URL=https://your-cloud-run-url bun run api:check-health
bun run check:release
EXPO_PUBLIC_API_URL=https://your-cloud-run-url EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-web-key EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.your-mapbox-download-token bun run check:eas-env
bun run verify
```

## Android Builds

Preview APK:

```bash
eas build --platform android --profile preview
```

Production AAB:

```bash
eas build --platform android --profile production
```

Run `eas init` once for the Expo account/project; it will add the real `extra.eas.projectId`.

Native production builds include camera, photo library, and microphone permission strings for crop diagnosis and voice questions.
Production EAS builds also require `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, and `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`; `app.config.js` fails production builds when they are missing. The production EAS profile sets `EXPO_PUBLIC_APP_ENV=production`, which disables demo auth and local AI response fallbacks.

## Backend

Run the Cloud Run-ready API locally:

```bash
cd backend
bun install
cp .env.example .env
bun run dev
```

In another terminal, point Expo at it:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080 bun start
```

For Firebase email/password auth in the Expo app, also set:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-web-api-key
```

The app stores Firebase ID/refresh tokens locally and refreshes the ID token before authenticated API calls.

For farm mapping in EAS/native builds, set:

```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your-public-mapbox-token
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=your-mapbox-downloads-token
```

Mapbox uses native code, so farm maps are for development builds and Play Store builds, not Expo Go.
The Farm Map tab lets farmers tap field corners, calculate area in hectares/kanal, and save the boundary GeoJSON to Supabase through the farm profile.

The app calls the five MVP endpoints when `EXPO_PUBLIC_API_URL` is set. Crop diagnosis supports image-only, image + typed notes, and image + voice context:

- `POST /diagnose`
- `POST /ask`
- `POST /records`
- `GET /history`
- `POST /farm-profile`
- `GET /health`

Agent Builder tool schema: `backend/openapi.yaml`
Demo walkthrough: `docs/demo-script.md`
Play Store release checklist: `docs/play-store-release.md`
Privacy policy draft: `docs/privacy-policy.md`

Without `EXPO_PUBLIC_API_URL`, the service layer runs only in local development mode. Production builds must point at the deployed Cloud Run backend and will not generate local demo AI responses.

To point the app at a deployed backend:

```bash
EXPO_PUBLIC_API_URL=https://your-cloud-run-url bun start
```

## Current Production Surface

- Expo SDK 54, compatible with the Play Store/App Store Expo Go release.
- Typed navigation for login, tabs, chat, camera, voice, results, history detail, and profile.
- Local development fallback when Cloud Run is not configured.
- Remote-ready service layer with request timeout, backend status, Supabase profile loading, and local persistence fallback outside production.
- Farm memory records include intent, response source, confidence, image URI, and action items.

External services still required for a fully deployed production system:

- Firebase Authentication JWT verification
- Google Cloud Run backend
- Vertex AI Agent Builder / Gemini workflow
- Google Cloud STT v2 for real transcript generation
- Google Cloud Storage for image uploads
- Supabase Postgres persistence
- Mapbox access token for farm mapping

The backend refuses production startup without Supabase, Firebase, Vertex AI, Speech-to-Text, and GCS configuration. The app refuses production sign-in without Firebase web auth and refuses production AI/profile/history operations without the deployed backend. Local fallback mode is only for non-production development and tests.
