// ─────────────────────────────────────────────────────────────────────────────
// STUB SERVER — Use this on Day 1 before Gemini is connected
// So P1 and P2 can test the mobile app immediately
// Replace with real server.js once GCP billing is verified
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'running', app: 'Wheatee Stub Backend' });
});

app.post('/diagnose', (req, res) => {
  res.json({
    success: true,
    disease: 'Yellow Rust',
    confidence: 0.89,
    symptoms: [
      'Yellow stripes on leaves',
      'Powdery pustules along leaf veins',
      'Yellowing spreads from older to newer leaves'
    ],
    treatment: [
      'Apply Propiconazole 25% EC — 1ml per litre of water',
      'Spray in early morning or evening',
      'Remove and burn severely infected leaves',
      'Improve field drainage to reduce humidity'
    ],
    urgency: 'high',
    followUp: 'Monitor crop after 3 days. Re-apply fungicide if symptoms persist.'
  });
});

app.post('/ask', (req, res) => {
  const { intent } = req.body;
  const responses = {
    YIELD_ADVICE: 'For 5 kanal wheat: Apply 1 bag (50kg) urea at sowing, then 1 bag at tillering stage (30 days after sowing). Add 1 bag DAP at sowing for phosphorus.',
    FARM_PLANNING: 'For 10 kanal farm: Divide into 3 zones — 6 kanal wheat (main crop), 2 kanal vegetables (seasonal income), 2 kanal for fodder. Install drip irrigation on vegetable zone.',
    GENERAL_AGRICULTURE: 'Wheat harvesting in Punjab is best done in April-May when grain moisture is below 20%. Use combine harvester for efficiency.'
  };
  res.json({
    success: true,
    response: responses[intent] || responses.GENERAL_AGRICULTURE,
    intent: intent || 'GENERAL_AGRICULTURE'
  });
});

app.post('/farm-profile', (req, res) => {
  res.json({ success: true, message: 'Farm profile saved', data: req.body });
});

app.get('/history', (req, res) => {
  res.json({
    success: true,
    diagnoses: [
      { disease: 'Yellow Rust', confidence: 0.89, urgency: 'high', timestamp: '2025-12-01T10:00:00Z' },
      { disease: 'Powdery Mildew', confidence: 0.76, urgency: 'medium', timestamp: '2025-11-15T09:00:00Z' }
    ],
    conversations: [
      { intent: 'YIELD_ADVICE', input: 'How much urea?', timestamp: '2025-12-05T11:00:00Z' },
      { intent: 'FARM_PLANNING', input: 'How to divide 10 kanal', timestamp: '2025-11-20T14:00:00Z' }
    ]
  });
});

app.post('/records', (req, res) => {
  res.json({ success: true, message: 'Record saved (stub)', data: req.body });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🌾 Wheatee STUB backend running on port ${PORT}`);
  console.log('⚠️  This is stub mode — replace with server.js when GCP is ready');
});
