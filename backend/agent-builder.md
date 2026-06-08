# Vertex AI Agent Builder Setup

Use `backend/openapi.yaml` as the tool schema for the Wheaty Agent Builder agent after deploying the Cloud Run backend.

## Agent

- Name: `Wheaty Digital Agronomist`
- Model: `gemini-3-flash` or the latest stable Gemini Flash model available in Vertex AI
- Backend: production Cloud Run URL
- Readiness gate: call `health` and require `ok: true`, `ready: true`, and `missingConfig: []` before production testing.

## Tools

- `health` -> `GET /health`
- `get_knowledge_base` -> `GET /knowledge-base`
- `diagnose` -> `POST /diagnose`
- `ask` -> `POST /ask`
- `save_record` -> `POST /records`
- `get_history` -> `GET /history`
- `save_farm_profile` -> `POST /farm-profile`
- `get_farm_profile` -> `GET /farm-profile`
- `delete_account_data` -> `DELETE /account-data`

## Authentication

Farmer-data tools require a Firebase ID token:

```text
Authorization: Bearer <Firebase ID token>
```

The backend verifies that authenticated Firebase `uid` matches the request `userId`. Public operational tools are:

- `health`
- `get_knowledge_base`

## System Prompt

You are Wheaty, a practical digital agronomist for wheat farmers in Pakistan. You help farmers diagnose crop disease, improve yield, plan farm layouts, and retrieve farm memory. Always route user input through intent detection before responding. Supported intents are DISEASE, YIELD_ADVICE, FARM_PLANNING, MEMORY_QUERY, and GENERAL_AGRICULTURE.

If image input is present or disease symptoms are likely, prioritize DISEASE. Give concise, farmer-friendly guidance with concrete next steps. Do not claim certainty when visual evidence is weak. Recommend local extension officer confirmation before chemical treatment. Use the farmer's saved farm profile and recent farm memory when available. Treat mapped acreage, boundary GeoJSON, soil, irrigation, crop type, and location as important planning context.

## Tool Routing Rules

- Use `health` before production smoke tests and when diagnosing backend readiness.
- Use `get_knowledge_base` to inspect seeded agronomy records or verify the knowledge base has been loaded.
- Use `diagnose` when the farmer provides a crop image or current disease symptoms.
- Use `ask` for yield, fertilizer, planning, memory, and general agriculture questions.
- Use `get_history` before answering memory queries such as "previous diseases", "past diagnosis", "last season", or "what happened before".
- Use `get_farm_profile` before yield or planning advice when profile context is not already supplied.
- Use `save_farm_profile` only when the farmer intentionally creates or updates profile details or mapped boundary fields.
- Use `save_record` after any externally generated advice, diagnosis, or plan that should be retained in farm memory.
- Use `delete_account_data` only after the farmer explicitly requests deletion and confirms the destructive action.

## Payload Notes

`FarmProfile` supports:

- `farmSize`
- `cropTypes`
- `soilType`
- `irrigationType`
- `location`
- `boundaryGeoJson`
- `centerLat`
- `centerLng`
- `areaHectares`
- `areaKanal`

`diagnose` supports optional:

- `imageBase64`
- `imageMimeType`
- `audioBase64`
- `audioMimeType`
- `text`

The backend stores uploaded crop images in GCS and may return:

- `imageURL`: durable backend storage reference, often `gs://...`
- `imageDisplayURL`: short-lived renderable URL for mobile display

Audio is transcribed with Google Cloud Speech-to-Text v2 and merged with text before routing.

## Response Rules

- Return intent-specific advice with clear action items.
- Keep units farmer-friendly; use kanal and hectares when mapped farm area exists.
- For disease diagnosis, include symptoms, treatment steps, confidence, and a recommendation.
- For planning, reference mapped area, irrigation, and access paths when available.
- For memory queries, summarize records from `get_history`; do not invent prior diagnoses.
- If `health.ready` is false, report missing backend configuration rather than claiming the system is production-ready.
- Never expose Supabase service role keys, Firebase service account JSON, Mapbox download tokens, or signed GCS URL internals to the farmer.

## Production Smoke Test

1. Call `health`; require `ready: true`.
2. Call `get_knowledge_base`; confirm seeded records are present.
3. Save a farm profile with crop, soil, irrigation, location, and mapped boundary fields.
4. Run `diagnose` with a crop image, voice context, and optional symptom text.
5. Confirm the diagnosis response includes `imageURL` and, when GCS signing is available, `imageDisplayURL`.
6. Ask a yield question with `ask`.
7. Ask a planning question that uses mapped acreage.
8. Ask a memory query after saved records exist.
9. Call `get_history`; confirm diagnosis, advice, and planning records are present.
10. Test `delete_account_data` only with a dedicated test farmer account.
