const speech = require('@google-cloud/speech').v2;
const client = new speech.SpeechClient();

// ── Transcribe Audio (Urdu + English) ─────────────────────────────────────────
async function transcribeAudio(audioBase64) {
  try {
    const request = {
      recognizer: `projects/${process.env.VERTEX_PROJECT_ID}/locations/global/recognizers/_`,
      config: {
        autoDecodingConfig: {},
        languageCodes: ['ur-PK', 'en-PK'], // Try Urdu first, fall back to English
        model: 'chirp',
      },
      content: audioBase64,
    };

    const [response] = await client.recognize(request);
    const confidence = response.results[0]?.alternatives[0]?.confidence || 0;

    // Fall back to text input if confidence too low
    if (confidence < 0.7) {
      return { transcript: '', fallbackToText: true, confidence };
    }

    const transcript = response.results
      .map(r => r.alternatives[0].transcript)
      .join(' ');

    return { transcript, confidence, fallbackToText: false };

  } catch (err) {
    console.error('STT error:', err.message);
    return { transcript: '', fallbackToText: true, confidence: 0 };
  }
}

module.exports = { transcribeAudio };
