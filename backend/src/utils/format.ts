import { AdviceResult, DiagnosisResult } from '../types/domain.js';

export function formatAdvice(result: AdviceResult): string {
  const actions = result.actionItems.length ? `\n\nAction plan\n${result.actionItems.map((item) => `- ${item}`).join('\n')}` : '';
  return `${result.response}${actions}`;
}

export function formatDiagnosis(result: DiagnosisResult): string {
  return [
    `${result.disease} (${Math.round(result.confidence * 100)}% confidence)`,
    `Visible symptoms\n${result.symptoms.map((item) => `- ${item}`).join('\n')}`,
    `Treatment steps\n${result.treatmentSteps.map((item) => `- ${item}`).join('\n')}`,
    result.recommendation,
  ].join('\n\n');
}
