import { z } from 'zod';

export const farmProfileSchema = z.object({
  userId: z.string().min(1),
  farmSize: z.string().min(1),
  cropTypes: z.array(z.string().min(1)).min(1),
  soilType: z.string().default('unknown'),
  irrigationType: z.string().default('unknown'),
  location: z.string().default('Pakistan'),
  boundaryGeoJson: z.unknown().optional(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  areaHectares: z.number().optional(),
  areaKanal: z.number().optional(),
});

export const askSchema = z.object({
  userId: z.string().min(1),
  text: z.string().optional().default(''),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
  farmProfile: farmProfileSchema.nullish(),
}).refine((payload) => payload.text.trim().length > 0 || Boolean(payload.audioBase64), {
  message: 'Either text or audioBase64 is required',
});

export const diagnoseSchema = z.object({
  userId: z.string().min(1),
  text: z.string().optional().default(''),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional().default('image/jpeg'),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
});

export const recordSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['diagnosis', 'conversation', 'plan']),
  data: z.record(z.unknown()),
});
