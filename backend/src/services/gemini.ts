import { GoogleAuth } from 'google-auth-library';

import { allowFallbacks, config, isAiConfigured } from '../config.js';
import { AdviceResult, DiagnosisResult, FarmProfile, HistoryRecord, Intent } from '../types/domain.js';
import { detectIntent } from '../utils/intent.js';
import { findKnowledge } from './knowledge.js';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

async function vertexGenerate(parts: Array<Record<string, unknown>>) {
  if (!isAiConfigured()) return null;

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  const endpoint = `https://${config.vertexLocation}-aiplatform.googleapis.com/v1/projects/${config.vertexProjectId}/locations/${config.vertexLocation}/publishers/google/models/${config.geminiModel}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Vertex AI failed with ${response.status}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? JSON.parse(text) : null;
}

export async function generateAdvice(text: string, farmProfile: FarmProfile | null, history: HistoryRecord[]): Promise<AdviceResult> {
  const fallbackIntent = detectIntent(text);
  try {
    const result = await vertexGenerate([
      {
        text: [
          'You are Wheatee, a practical digital agronomist for wheat farmers in Pakistan.',
          'Classify the intent as DISEASE, YIELD_ADVICE, FARM_PLANNING, MEMORY_QUERY, or GENERAL_AGRICULTURE.',
          'Return JSON only with keys: intent, response, actionItems.',
          `Farm profile: ${JSON.stringify(farmProfile)}`,
          `Recent farm memory: ${JSON.stringify(history.slice(0, 5))}`,
          `Farmer question: ${text}`,
        ].join('\n'),
      },
    ]);

    if (result?.intent && result?.response && Array.isArray(result?.actionItems)) {
      return {
        intent: result.intent as Intent,
        response: String(result.response),
        actionItems: result.actionItems.map(String),
      };
    }
  } catch (error) {
    if (!allowFallbacks()) throw error;
    // Fall back to deterministic advice if Vertex is not configured or temporarily unavailable.
  }

  return fallbackAdvice(text, fallbackIntent, farmProfile, history);
}

export async function diagnoseCrop(
  text: string,
  imageBase64: string | undefined,
  imageMimeType: string,
  farmProfile: FarmProfile | null,
): Promise<DiagnosisResult> {
  try {
    const parts: Array<Record<string, unknown>> = [
      {
        text: [
          'You are Wheatee, a crop disease diagnosis agent for wheat farmers in Pakistan.',
          'Return JSON only with keys: disease, confidence, symptoms, treatmentSteps, recommendation, intent.',
          'confidence must be a number from 0 to 1. intent must be DISEASE.',
          `Farm profile: ${JSON.stringify(farmProfile)}`,
          `Farmer context: ${text || 'No additional context.'}`,
        ].join('\n'),
      },
    ];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }

    const result = await vertexGenerate(parts);
    if (result?.disease && Array.isArray(result?.symptoms) && Array.isArray(result?.treatmentSteps)) {
      return {
        disease: String(result.disease),
        confidence: Number(result.confidence ?? 0.7),
        symptoms: result.symptoms.map(String),
        treatmentSteps: result.treatmentSteps.map(String),
        recommendation: String(result.recommendation ?? 'Consult a local extension officer before applying chemical treatment.'),
        intent: 'DISEASE',
      };
    }
  } catch (error) {
    if (!allowFallbacks()) throw error;
    // Fall back to deterministic diagnosis when cloud AI is unavailable.
  }

  const knowledge = findKnowledge(text, 'DISEASE');
  return {
    disease: imageBase64 ? knowledge?.title ?? 'Possible wheat disease' : 'Disease symptoms need image confirmation',
    confidence: imageBase64 ? knowledge?.confidence ?? 0.68 : 0.52,
    symptoms: knowledge?.symptoms ?? ['Visible crop symptoms need a clearer image', 'Field context is incomplete'],
    treatmentSteps: knowledge?.actionItems ?? [
      'Scout nearby plots and compare symptom spread.',
      'Avoid excess irrigation while symptoms are active.',
      'Confirm fungicide choice and dosage with a local extension officer.',
    ],
    recommendation: knowledge?.response ?? 'Treat this as a priority crop health check and re-scan affected leaves within 48 hours.',
    intent: 'DISEASE',
  };
}

function fallbackAdvice(text: string, intent: Intent, farmProfile: FarmProfile | null, history: HistoryRecord[]): AdviceResult {
  if (intent === 'MEMORY_QUERY') {
    const recent = history.slice(0, 3).map((record) => `${record.intent}: ${record.input}`).join('; ');
    return {
      intent,
      response: recent ? `Recent farm memory includes ${recent}.` : 'No previous farm records were found for this farmer yet.',
      actionItems: ['Run a diagnosis or ask a planning question to create a farm memory trail.'],
    };
  }

  if (intent === 'FARM_PLANNING') {
    const knowledge = findKnowledge(text, intent);
    return {
      intent,
      response: `For ${farmProfile?.farmSize || 'the farm'}, ${knowledge?.response ?? 'use block-based planning for irrigation and scouting.'}`,
      actionItems: knowledge?.actionItems ?? ['Divide the field into irrigation blocks.'],
    };
  }

  if (intent === 'YIELD_ADVICE') {
    const knowledge = findKnowledge(text, intent);
    return {
      intent,
      response: `For ${farmProfile?.cropTypes?.join(', ') || 'wheat'}, ${knowledge?.response ?? 'yield improvement depends on balanced nutrients and timely irrigation.'}`,
      actionItems: knowledge?.actionItems ?? ['Use split fertilizer doses.'],
    };
  }

  const knowledge = findKnowledge(text, intent);
  if (text.includes('Voice input received')) {
    return {
      intent,
      response: `${text} ${knowledge?.response ?? 'Add text or configure Speech-to-Text for specific voice advice.'}`,
      actionItems: knowledge?.actionItems ?? ['Configure Speech-to-Text v2 for real voice transcripts.'],
    };
  }

  return {
    intent,
    response: knowledge?.response ?? `Wheatee reviewed: "${text}". Share crop stage, farm size, and symptoms for more specific guidance.`,
    actionItems: knowledge?.actionItems ?? ['Add farm profile details.', 'Upload a crop image when symptoms are visible.'],
  };
}
