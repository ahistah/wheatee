import type { NavigatorScreenParams } from '@react-navigation/native';

export type Language = 'en' | 'ur';

export type Intent =
  | 'DISEASE'
  | 'YIELD_ADVICE'
  | 'FARM_PLANNING'
  | 'MEMORY_QUERY'
  | 'GENERAL_AGRICULTURE';

export type User = {
  userId: string;
  name: string;
  phoneOrEmail: string;
  language: Language;
  authProvider: 'firebase' | 'demo';
  idToken?: string;
  refreshToken?: string;
  idTokenExpiresAt?: number;
};

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

export type AdviceResult = {
  intent: Intent;
  response: string;
  actionItems: string[];
};

export type BackendStatus = {
  mode: 'remote' | 'demo';
  baseUrl?: string;
  reachable: boolean;
  ready?: boolean;
  message: string;
  service?: string;
  ai?: boolean;
  mongo?: boolean;
  supabase?: boolean;
  firebase?: boolean;
  storage?: boolean;
  speech?: boolean;
  knowledgeBase?: number;
  missingConfig?: string[];
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Chat: undefined;
  Camera: undefined;
  Voice: undefined;
  Results: {
    title: string;
    record: HistoryRecord;
  };
  HistoryDetail: {
    record: HistoryRecord;
  };
};
