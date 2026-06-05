export type Intent =
  | 'DISEASE'
  | 'YIELD_ADVICE'
  | 'FARM_PLANNING'
  | 'MEMORY_QUERY'
  | 'GENERAL_AGRICULTURE';

export type FarmProfile = {
  userId: string;
  farmSize: string;
  cropTypes: string[];
  soilType: string;
  irrigationType: string;
  location: string;
  boundaryGeoJson?: unknown;
  centerLat?: number;
  centerLng?: number;
  areaHectares?: number;
  areaKanal?: number;
};

export type HistoryRecord = {
  id: string;
  userId: string;
  type: 'diagnosis' | 'conversation' | 'plan';
  input: string;
  response: string;
  intent: Intent;
  timestamp: string;
  imageUri?: string;
  imageURL?: string;
  imageDisplayURL?: string;
  confidence?: number;
  actionItems?: string[];
  backendMode?: 'remote' | 'demo';
};

export type AdviceResult = {
  intent: Intent;
  response: string;
  actionItems: string[];
};

export type DiagnosisResult = {
  disease: string;
  confidence: number;
  symptoms: string[];
  treatmentSteps: string[];
  recommendation: string;
  intent: Intent;
  imageURL?: string;
  imageDisplayURL?: string;
};

export type KnowledgeRecord = {
  id: string;
  crop: string;
  category: Intent;
  title: string;
  keywords: string[];
  response: string;
  actionItems: string[];
  symptoms?: string[];
  confidence?: number;
};
