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
};

export type FarmProfile = {
  userId: string;
  farmSize: string;
  cropTypes: string[];
  soilType: string;
  irrigationType: string;
  location: string;
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
  confidence?: number;
};

export type DiagnosisResult = {
  disease: string;
  confidence: number;
  symptoms: string[];
  treatmentSteps: string[];
  recommendation: string;
  intent: Intent;
};

export type AdviceResult = {
  intent: Intent;
  response: string;
  actionItems: string[];
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
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};
import type { NavigatorScreenParams } from '@react-navigation/native';
