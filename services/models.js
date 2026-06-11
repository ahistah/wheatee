const mongoose = require('mongoose');

// ── Users ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  language: { type: String, enum: ['ur', 'en'], default: 'ur' },
  createdAt: { type: Date, default: Date.now }
});

// ── Farm Profiles ──────────────────────────────────────────────────────────────
const farmProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  farmSize: { type: String },           // e.g. "10 kanal"
  cropTypes: { type: [String] },        // e.g. ["wheat", "maize"]
  soilType: { type: String },           // e.g. "clay loam"
  irrigationType: { type: String },     // e.g. "canal"
  updatedAt: { type: Date, default: Date.now }
});

// ── Diagnoses ──────────────────────────────────────────────────────────────────
const diagnosisSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageURL: { type: String },
  disease: { type: String },
  confidence: { type: Number },         // 0 to 1
  symptoms: { type: [String] },
  treatment: { type: [String] },
  urgency: { type: String, default: 'medium' },
  followUp: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// ── Conversations ──────────────────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  input: { type: String },
  response: { type: String },
  intent: {
    type: String,
    enum: ['DISEASE', 'YIELD_ADVICE', 'FARM_PLANNING', 'MEMORY_QUERY', 'GENERAL_AGRICULTURE']
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  FarmProfile: mongoose.model('FarmProfile', farmProfileSchema),
  Diagnosis: mongoose.model('Diagnosis', diagnosisSchema),
  Conversation: mongoose.model('Conversation', conversationSchema)
};
