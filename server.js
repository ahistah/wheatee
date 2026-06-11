require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { diagnoseCrop, getAdvice, detectIntent } = require('./services/gemini');
const { transcribeAudio } = require('./services/speech');
const { User, FarmProfile, Diagnosis, Conversation } = require('./services/models');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── MongoDB Connection ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://younassadat05_db_user:GQDR8nnBs2NPK3EL@wheatee-cluster.ayneck3.mongodb.net/wheatee_db?appName=wheatee-cluster')
  .then(() => console.log('✅ MongoDB connected — wheatee_db'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    app: 'Wheatee Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Health Check (detailed) ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    ready: true,
    service: 'wheatee-api',
    mode: 'ai',
    mongo: mongoose.connection.readyState === 1,
    supabase: false,
    firebase: false,
    storage: true,
    speech: false,
    knowledgeBase: 0,
    missingConfig: []
  });
});

// ── POST /diagnose ─────────────────────────────────────────────────────────────
app.post('/diagnose', async (req, res) => {
  try {
    // Accept both 'image' and 'imageBase64' field names from mobile app
    const { image, imageBase64, audio, audioBase64, text, userId } = req.body;
    const imageData = image || imageBase64;
    const audioData = audio || audioBase64;

    if (!imageData) {
      return res.status(400).json({ error: 'Image is required for diagnosis' });
    }

    let context = text || '';
    if (audioData) {
      try {
        const stt = await transcribeAudio(audioData);
        if (!stt.fallbackToText) context = stt.transcript;
      } catch (sttErr) {
        console.warn('STT failed, continuing without transcript:', sttErr.message);
      }
    }

    const result = await diagnoseCrop(imageData, context);

    // Sanitize urgency before saving
    const validUrgency = ['low', 'medium', 'high'];
    const urgency = validUrgency.includes(result.urgency?.toLowerCase()) 
      ? result.urgency.toLowerCase() 
      : 'medium';

    if (userId) {
      await Diagnosis.create({
        userId,
        disease: result.disease,
        confidence: result.confidence,
        symptoms: result.symptoms,
        treatment: result.treatment,
        urgency: urgency,
        followUp: result.followUp
      });
      await Conversation.create({
        userId,
        input: context || 'Image uploaded for diagnosis',
        response: `Disease: ${result.disease} (${Math.round(result.confidence * 100)}% confidence)`,
        intent: 'DISEASE'
      });
    }

    // Return in format mobile app expects
    res.json({
      success: true,
      userId,
      disease: result.disease,
      confidence: result.confidence,
      symptoms: result.symptoms,
      treatmentSteps: result.treatment,  // mobile app uses treatmentSteps
      treatment: result.treatment,
      urgency: result.urgency,
      followUp: result.followUp,
      recommendation: result.followUp,   // mobile app uses recommendation
      intent: 'DISEASE'
    });

  } catch (err) {
    console.error('/diagnose error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /ask ──────────────────────────────────────────────────────────────────
app.post('/ask', async (req, res) => {
  try {
    // Accept both 'audio' and 'audioBase64' field names from mobile app
    const { text, audio, audioBase64, userId, intent, farmProfile } = req.body;
    const audioData = audio || audioBase64;

    let question = text || '';
    if (audioData) {
      try {
        const stt = await transcribeAudio(audioData);
        if (!stt.fallbackToText) question = stt.transcript;
      } catch (sttErr) {
        console.warn('STT failed, using text:', sttErr.message);
      }
    }

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const detectedIntent = intent || (await detectIntent(question)).intent;

    // Use farm profile from request OR fetch from DB
    let profile = farmProfile || null;
    if (!profile && userId) {
      profile = await FarmProfile.findOne({ userId });
    }

    const advice = await getAdvice(question, profile, detectedIntent);

    if (userId) {
      await Conversation.create({
        userId,
        input: question,
        response: advice,
        intent: detectedIntent
      });
    }

    // Return in format mobile app expects
    res.json({
      success: true,
      response: advice,
      intent: detectedIntent,
      actionItems: []  // mobile app expects actionItems array
    });

  } catch (err) {
    console.error('/ask error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /farm-profile ─────────────────────────────────────────────────────────
app.post('/farm-profile', async (req, res) => {
  try {
    const { userId, farmSize, cropTypes, soilType, irrigationType } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const profile = await FarmProfile.findOneAndUpdate(
      { userId },
      { userId, farmSize, cropTypes, soilType, irrigationType, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, profile });
  } catch (err) {
    console.error('/farm-profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /farm-profile ──────────────────────────────────────────────────────────
app.get('/farm-profile', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const profile = await FarmProfile.findOne({ userId });
    res.json(profile || null);
  } catch (err) {
    console.error('/farm-profile GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /history ───────────────────────────────────────────────────────────────
app.get('/history', async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const diagnoses = await Diagnosis.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    const conversations = await Conversation.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json({
      success: true,
      userId,
      diagnoses,
      conversations,
      total: diagnoses.length + conversations.length
    });
  } catch (err) {
    console.error('/history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /records ──────────────────────────────────────────────────────────────
app.post('/records', async (req, res) => {
  try {
    const { userId, type, data } = req.body;
    if (!userId || !type || !data) {
      return res.status(400).json({ error: 'userId, type, and data are required' });
    }
    let saved;
    if (type === 'diagnosis') {
      saved = await Diagnosis.create({ userId, ...data });
    } else {
      saved = await Conversation.create({ userId, intent: type, ...data });
    }
    res.json({ success: true, saved });
  } catch (err) {
    console.error('/records error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /account-data ───────────────────────────────────────────────────────
app.delete('/account-data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const [farmProfiles, diagnoses, conversations] = await Promise.all([
      FarmProfile.deleteMany({ userId }),
      Diagnosis.deleteMany({ userId }),
      Conversation.deleteMany({ userId }),
    ]);
    res.json({
      userId,
      farmProfilesDeleted: farmProfiles.deletedCount,
      diagnosesDeleted: diagnoses.deletedCount,
      conversationsDeleted: conversations.deletedCount,
      cropImagesDeleted: 0,
    });
  } catch (err) {
    console.error('/account-data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── MCP Endpoint ───────────────────────────────────────────────────────────────
const MCP_TOOLS = [
  {
    name: "diagnose_crop",
    description: "Analyze crop disease from symptoms",
    inputSchema: {
      type: "object",
      properties: {
        symptoms: { type: "string", description: "Visible symptoms on the crop" },
        cropType: { type: "string", description: "Type of crop e.g. wheat" }
      },
      required: ["symptoms"]
    }
  },
  {
    name: "get_farm_advice",
    description: "Get farming advice for fertilizer, irrigation, yield",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Farming question" }
      },
      required: ["question"]
    }
  },
  {
    name: "get_farm_history",
    description: "Get past diagnoses and conversations for a farmer",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string", description: "Farmer user ID" }
      },
      required: ["userId"]
    }
  },
  {
    name: "save_farm_profile",
    description: "Save or update farmer profile — farm size, crops, soil, irrigation",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        farmSize: { type: "string", description: "Farm size in acres or kanal" },
        cropTypes: { type: "array", items: { type: "string" } },
        soilType: { type: "string" },
        irrigationType: { type: "string" }
      },
      required: ["userId"]
    }
  },
  {
    name: "get_farm_profile",
    description: "Get farmer's farm profile",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" }
      },
      required: ["userId"]
    }
  }
];

app.get('/mcp', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const payload = JSON.stringify({ jsonrpc: "2.0", result: { tools: MCP_TOOLS } });
  res.write(`data: ${payload}\n\n`);
});

app.post('/mcp', async (req, res) => {
  const { method, params, id } = req.body;
  if (method === "tools/list") {
    return res.json({ jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } });
  }
  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      if (name === "diagnose_crop") {
        const result = await getAdvice(args.symptoms, null, 'DISEASE');
        return res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result }] } });
      }
      if (name === "get_farm_advice") {
        const profile = await FarmProfile.findOne({ userId: args.userId });
        const result = await getAdvice(args.question, profile, 'GENERAL');
        return res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result }] } });
      }
      if (name === "get_farm_history") {
        const diagnoses = await Diagnosis.find({ userId: args.userId }).sort({ timestamp: -1 }).limit(5);
        const conversations = await Conversation.find({ userId: args.userId }).sort({ timestamp: -1 }).limit(5);
        return res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ diagnoses, conversations }) }] } });
      }
      if (name === "save_farm_profile") {
        const profile = await FarmProfile.findOneAndUpdate(
          { userId: args.userId },
          { ...args, updatedAt: new Date() },
          { upsert: true, new: true }
        );
        return res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Profile saved: ${JSON.stringify(profile)}` }] } });
      }
      if (name === "get_farm_profile") {
        const profile = await FarmProfile.findOne({ userId: args.userId });
        return res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(profile) }] } });
      }
    } catch (err) {
      return res.status(500).json({ jsonrpc: "2.0", id, error: { message: err.message } });
    }
  }
  res.status(404).json({ jsonrpc: "2.0", id, error: { message: "Method not found" } });
});

// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🌾 Wheatee backend running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /diagnose`);
  console.log(`   POST /ask`);
  console.log(`   POST /farm-profile`);
  console.log(`   GET  /history`);
  console.log(`   POST /records`);
});