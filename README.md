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
```

## Backend

The app calls the five MVP endpoints when `EXPO_PUBLIC_API_URL` is set:

- `POST /diagnose`
- `POST /ask`
- `POST /records`
- `GET /history`
- `POST /farm-profile`

Without `EXPO_PUBLIC_API_URL`, the service layer returns local demo responses and persists farm profile/history with AsyncStorage so the hackathon flow remains demoable.

To point the app at a deployed backend:

```bash
EXPO_PUBLIC_API_URL=https://your-cloud-run-url bun start
```
