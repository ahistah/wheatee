# Wheaty Play Store Release Checklist

Use this checklist before submitting the production Android App Bundle.

## Required Services

- Firebase Authentication is configured for email/password sign-in.
- Cloud Run backend is deployed with `NODE_ENV=production`.
- `/health` returns `ok: true`, `ready: true`, and an empty `missingConfig` list.
- Supabase schema in `backend/supabase/schema.sql` has been applied.
- Knowledge base has been seeded with `bun run api:seed-knowledge` against production Supabase.
- Vertex AI/Gemini access is enabled for the configured project and region.
- Google Cloud Storage bucket exists for crop image uploads; production image diagnosis must fail if uploads are unavailable.
- Google Cloud Speech-to-Text v2 recognizer exists for Urdu/English voice input.
- Mapbox public token and downloads token are configured for the production EAS build.

## Build Verification

Run from the repo root:

```bash
bun install
bun run verify
WHEATY_API_URL=https://YOUR_CLOUD_RUN_URL bun run api:check-health
EXPO_PUBLIC_API_URL=https://YOUR_CLOUD_RUN_URL EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_KEY EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.YOUR_MAPBOX_PUBLIC_TOKEN RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.YOUR_MAPBOX_DOWNLOADS_TOKEN bun run check:eas-env
EAS_BUILD_PROFILE=production EXPO_PUBLIC_APP_ENV=production EXPO_PUBLIC_API_URL=https://YOUR_CLOUD_RUN_URL EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_KEY EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.YOUR_MAPBOX_PUBLIC_TOKEN RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.YOUR_MAPBOX_DOWNLOADS_TOKEN bunx expo config --type public
eas build --platform android --profile production
```

The release preflight intentionally fails if production Firebase, API, or Mapbox configuration is missing.

## Play Store Listing

- App name: `Wheaty`
- Short description: `AI crop diagnosis, planning, farm maps, and memory for wheat farmers.`
- Full description:

```text
Wheaty is a mobile digital agronomist for wheat farmers. Farmers can map farm boundaries, save farm profiles, diagnose crop symptoms from images, ask voice or text questions, and review saved farm memory. Wheaty uses Firebase Authentication, a production Cloud Run API, Supabase persistence, Vertex AI/Gemini reasoning, Google Speech-to-Text, Google Cloud Storage, and Mapbox maps.
```

- Category: Productivity or Tools, depending on store positioning.
- Contact email: use the production support email for the operator.
- Privacy policy URL: review and publish `docs/privacy-policy.md`, then add the public URL in Play Console.

## Permissions And Data Safety

Declare these permissions in Play Console:

- Camera: used only when the farmer captures crop images for diagnosis.
- Photos/media: used only when the farmer selects crop images from the gallery.
- Microphone: used only when the farmer records voice questions.
- Approximate/precise location: do not declare unless future builds add device location. Current farm mapping is manual tap-based Mapbox editing.

Declare these collected data types:

- Account identifiers from Firebase Authentication.
- Farm profile data, including farm size, crops, soil, irrigation, location text, and mapped boundary GeoJSON.
- Crop images and image metadata sent for disease diagnosis.
- Voice recordings/transcripts sent for voice question workflows.
- User-generated agronomy questions, AI responses, diagnosis records, confidence scores, and action items.

Data handling commitments:

- Data is transmitted over HTTPS.
- Farmer records are isolated by Firebase-authenticated `userId`.
- Supabase is accessed from the backend service role, not directly from the mobile app.
- Production startup refuses missing Supabase, Firebase, Vertex AI, Speech-to-Text, or GCS configuration.
- Local demo fallbacks are disabled in production app builds.

## Manual Smoke Test

Install the production build on a physical Android device and verify:

1. Login with a real Firebase account.
2. Home shows a reachable, production-ready backend.
3. Profile saves to Supabase and reloads after app restart.
4. Map saves a farm boundary and computed hectares/kanal.
5. Camera diagnosis accepts a crop image plus voice context and returns a remote AI-backed record.
6. Voice question sends audio/transcript context successfully.
7. Chat returns intent-specific advice.
8. History shows saved diagnosis, plan, conversation, and memory records.
9. Sign out clears the local session.
10. Profile deletion removes farm profile, diagnosis history, uploaded crop images, and returns to signed-out state.

Do not submit until the smoke test passes against the production Cloud Run URL.
