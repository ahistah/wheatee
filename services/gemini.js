const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({
  project: process.env.VERTEX_PROJECT_ID || 'wheatee-hackathon-498716',
  location: process.env.VERTEX_LOCATION || 'us-central1'
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
});

async function diagnoseCrop(imageBase64, textContext = '') {
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        { text: `You are Wheatee, expert crop disease specialist for Pakistan wheat farms.
Analyze this crop image. Farmer context: ${textContext || 'None.'}
Return ONLY valid JSON:
{"disease":"name","confidence":0.0,"symptoms":["s1"],"treatment":["t1"],"urgency":"low","followUp":"advice"}` }
      ]
    }]
  });
  const text = result.response.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

async function getAdvice(question, farmProfile, intent) {
  const ctx = farmProfile
    ? `Farm: ${farmProfile.farmSize} | Crops: ${farmProfile.cropTypes?.join(', ')} | Soil: ${farmProfile.soilType}`
    : 'No farm profile.';
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `You are Wheatee, expert agronomist for Pakistan wheat farmers.
Task: ${intent}. Farm: ${ctx}.
Question: ${question}
Use Pakistani units (kanal, maund, kilo). Be specific and concise.` }]
    }]
  });
  return result.response.candidates[0].content.parts[0].text;
}

async function detectIntent(text, hasImage = false) {
  if (hasImage) return { intent: 'DISEASE', confidence: 1.0 };
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `Classify this farmer query. Return ONLY JSON.
Query: "${text}"
Intents: DISEASE, YIELD_ADVICE, FARM_PLANNING, MEMORY_QUERY, GENERAL_AGRICULTURE
Format: {"intent":"NAME","confidence":0.0}` }]
    }]
  });
  const raw = result.response.candidates[0].content.parts[0].text;
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

module.exports = { diagnoseCrop, getAdvice, detectIntent };