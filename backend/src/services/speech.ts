import { GoogleAuth } from 'google-auth-library';

import { allowFallbacks, config, isSpeechConfigured } from '../config.js';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

type SpeechResponse = {
  results?: Array<{
    alternatives?: Array<{
      transcript?: string;
    }>;
  }>;
};

export async function transcribeAudio(audioBase64?: string, audioMimeType = 'audio/m4a') {
  if (!audioBase64) return '';
  if (!isSpeechConfigured()) {
    if (!allowFallbacks()) throw new Error('Speech-to-Text is required in production.');
    return '';
  }

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  const recognizer = `projects/${config.speechProjectId}/locations/${config.speechLocation}/recognizers/${config.speechRecognizer}`;
  const endpoint = `https://speech.googleapis.com/v2/${recognizer}:recognize`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        autoDecodingConfig: {},
        languageCodes: config.speechLanguageCodes,
        model: config.speechModel,
        explicitDecodingConfig: audioMimeType.includes('wav')
          ? undefined
          : undefined,
      },
      content: audioBase64,
    }),
  });

  if (!response.ok) {
    throw new Error(`Speech-to-Text failed with ${response.status}`);
  }

  const json = (await response.json()) as SpeechResponse;
  return json.results
    ?.flatMap((result) => result.alternatives ?? [])
    .map((alternative) => alternative.transcript?.trim())
    .filter(Boolean)
    .join(' ')
    .trim() ?? '';
}

export async function mergeTextAndAudio(text: string, audioBase64?: string, audioMimeType?: string) {
  let transcript = '';
  try {
    transcript = await transcribeAudio(audioBase64, audioMimeType);
  } catch (error) {
    if (!allowFallbacks()) throw error;
    transcript = '';
  }

  const merged = [text.trim(), transcript ? `Voice transcript: ${transcript}` : '']
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!merged && audioBase64) {
    return 'Voice input received, but transcript is unavailable because Speech-to-Text is not configured.';
  }

  return merged;
}
