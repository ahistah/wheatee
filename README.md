# 🌾 Wheatee Backend

AI agronomist backend for Pakistani wheat farmers.

## Tech Stack
- Node.js + Express
- Google Cloud Vertex AI (Gemini 2.0 Flash)
- Google Cloud Speech-to-Text v2 (Chirp — Urdu/English)
- MongoDB Atlas + MCP Server
- Google Cloud Run

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your values in .env
```

### 3. Run locally
```bash
npm run dev
```

### 4. Deploy to Cloud Run
```bash
gcloud run deploy wheatee-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /diagnose | Crop disease diagnosis (image + text) |
| POST | /ask | Yield advice, farm planning, general |
| POST | /farm-profile | Save/update farm profile |
| GET | /history | Get past diagnoses and conversations |
| POST | /records | Save any record manually |

## Request Examples

### Diagnose crop disease
```json
POST /diagnose
{
  "image": "base64encodedimage...",
  "text": "leaves are turning yellow",
  "userId": "user123"
}
```

### Ask yield question
```json
POST /ask
{
  "text": "How much urea for 5 kanal wheat?",
  "userId": "user123"
}
```

### Save farm profile
```json
POST /farm-profile
{
  "userId": "user123",
  "farmSize": "10 kanal",
  "cropTypes": ["wheat"],
  "soilType": "clay loam",
  "irrigationType": "canal"
}
```

## License
MIT
