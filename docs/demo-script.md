# Wheatee Demo Script

## Setup

1. Start the backend:

   ```bash
   cd backend
   bun run dev
   ```

2. Start Expo:

   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:8080 bun start -- --clear
   ```

## Flow

1. Login as a farmer and choose language.
2. Open Profile and save:
   - Farm size: `10 kanal`
   - Crop: `wheat`
   - Soil: `loam`
   - Irrigation: `canal + tube well`
   - Location: `Punjab, Pakistan`
3. Open Map, tap field corners, confirm area in kanal/hectares, and save the farm boundary.
4. Open Camera, select or capture wheat leaves, record a short Urdu or English voice note, add optional typed symptom notes, and run diagnosis.
5. Open Chat and ask: `How much fertilizer for wheat on my 10 kanal farm?`
6. Ask: `Organize my 10 kanal farm for irrigation.`
7. Ask: `Show previous diseases.`
8. Open History and inspect saved diagnosis, advice, planning, and mapped farm profile context.

## Expected Proof

- Home shows connected backend status.
- Map saves farm boundary GeoJSON and computed area to the profile.
- Diagnosis response includes disease, confidence, symptoms, treatment steps, and uses the image + voice context.
- Advice response includes intent-specific action plan.
- History shows saved records with detail pages.
