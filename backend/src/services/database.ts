import { MongoClient } from 'mongodb';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { allowFallbacks, config, isSupabaseConfigured } from '../config.js';
import { knowledgeBase } from '../data/knowledgeBase.js';
import { FarmProfile, HistoryRecord, KnowledgeRecord } from '../types/domain.js';

type Collections = {
  farmProfiles: FarmProfile[];
  diagnoses: HistoryRecord[];
  conversations: HistoryRecord[];
};

export type DeleteFarmerDataResult = {
  userId: string;
  farmProfilesDeleted: number;
  diagnosesDeleted: number;
  conversationsDeleted: number;
};

const memory: Collections = {
  farmProfiles: [],
  diagnoses: [],
  conversations: [],
};

let client: MongoClient | null = null;
let supabaseClient: SupabaseClient | null = null;
let ready = false;

function supabase() {
  if (!isSupabaseConfigured()) return null;
  supabaseClient ??= createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabaseClient;
}

async function db() {
  if (!config.mongoUri) return null;
  if (!client) {
    client = new MongoClient(config.mongoUri);
    await client.connect();
  }
  const database = client.db(config.mongoDbName);
  if (!ready) {
    await ensureIndexes(database);
    ready = true;
  }
  return database;
}

async function ensureIndexes(database: NonNullable<Awaited<ReturnType<typeof db>>>) {
  await Promise.all([
    database.collection<FarmProfile>('farm_profiles').createIndex({ userId: 1 }, { unique: true }),
    database.collection<HistoryRecord>('diagnoses').createIndex({ userId: 1, timestamp: -1 }),
    database.collection<HistoryRecord>('diagnoses').createIndex({ id: 1 }, { unique: true }),
    database.collection<HistoryRecord>('conversations').createIndex({ userId: 1, timestamp: -1 }),
    database.collection<HistoryRecord>('conversations').createIndex({ id: 1 }, { unique: true }),
    database.collection<KnowledgeRecord>('knowledge_base').createIndex({ id: 1 }, { unique: true }),
    database.collection<KnowledgeRecord>('knowledge_base').createIndex({ crop: 1, category: 1 }),
    database.collection<KnowledgeRecord>('knowledge_base').createIndex({ keywords: 1 }),
  ]);
}

function collectionName(type: HistoryRecord['type']) {
  return type === 'diagnosis' ? 'diagnoses' : 'conversations';
}

export async function saveFarmProfile(profile: FarmProfile): Promise<FarmProfile> {
  const sb = supabase();
  if (sb) {
    const { error } = await sb.from('farm_profiles').upsert(toFarmProfileRow(profile), { onConflict: 'user_id' });
    if (error) throw error;
    return profile;
  }

  const database = await db();
  if (!database && !allowFallbacks()) throw new Error('Production persistence requires MongoDB.');
  if (database) {
    await database.collection<FarmProfile>('farm_profiles').updateOne({ userId: profile.userId }, { $set: profile }, { upsert: true });
    return profile;
  }

  const index = memory.farmProfiles.findIndex((item) => item.userId === profile.userId);
  if (index >= 0) memory.farmProfiles[index] = profile;
  else memory.farmProfiles.push(profile);
  return profile;
}

export async function getFarmProfile(userId: string): Promise<FarmProfile | null> {
  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.from('farm_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data ? fromFarmProfileRow(data) : null;
  }

  const database = await db();
  if (!database && !allowFallbacks()) throw new Error('Production persistence requires MongoDB.');
  if (database) {
    return database.collection<FarmProfile>('farm_profiles').findOne({ userId });
  }
  return memory.farmProfiles.find((item) => item.userId === userId) ?? null;
}

export async function saveHistoryRecord(record: HistoryRecord): Promise<HistoryRecord> {
  const sb = supabase();
  if (sb) {
    const table = record.type === 'diagnosis' ? 'diagnoses' : 'conversations';
    const row = table === 'diagnoses' ? toDiagnosisRow(record) : toConversationRow(record);
    const { error } = await sb.from(table).upsert(row as any, { onConflict: 'id' });
    if (error) throw error;
    return record;
  }

  const database = await db();
  if (!database && !allowFallbacks()) throw new Error('Production persistence requires MongoDB.');
  if (database) {
    await database.collection<HistoryRecord>(collectionName(record.type)).updateOne({ id: record.id }, { $set: record }, { upsert: true });
    return record;
  }

  const target = record.type === 'diagnosis' ? memory.diagnoses : memory.conversations;
  const index = target.findIndex((item) => item.id === record.id);
  if (index >= 0) target[index] = record;
  else target.unshift(record);
  return record;
}

export async function getHistory(userId: string, limit: number): Promise<HistoryRecord[]> {
  const sb = supabase();
  if (sb) {
    const [diagnoses, conversations] = await Promise.all([
      sb.from('diagnoses').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(limit),
      sb.from('conversations').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(limit),
    ]);
    if (diagnoses.error) throw diagnoses.error;
    if (conversations.error) throw conversations.error;
    return [
      ...(diagnoses.data ?? []).map(fromDiagnosisRow),
      ...(conversations.data ?? []).map(fromConversationRow),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  const database = await db();
  if (!database && !allowFallbacks()) throw new Error('Production persistence requires MongoDB.');
  if (database) {
    const [diagnoses, conversations] = await Promise.all([
      database.collection<HistoryRecord>('diagnoses').find({ userId }).sort({ timestamp: -1 }).limit(limit).toArray(),
      database.collection<HistoryRecord>('conversations').find({ userId }).sort({ timestamp: -1 }).limit(limit).toArray(),
    ]);
    return [...diagnoses, ...conversations]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  return [...memory.diagnoses, ...memory.conversations]
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function deleteFarmerData(userId: string): Promise<DeleteFarmerDataResult> {
  const sb = supabase();
  if (sb) {
    const [farmProfiles, diagnoses, conversations] = await Promise.all([
      sb.from('farm_profiles').delete().eq('user_id', userId).select('user_id'),
      sb.from('diagnoses').delete().eq('user_id', userId).select('id'),
      sb.from('conversations').delete().eq('user_id', userId).select('id'),
    ]);
    if (farmProfiles.error) throw farmProfiles.error;
    if (diagnoses.error) throw diagnoses.error;
    if (conversations.error) throw conversations.error;
    return {
      userId,
      farmProfilesDeleted: farmProfiles.data?.length ?? 0,
      diagnosesDeleted: diagnoses.data?.length ?? 0,
      conversationsDeleted: conversations.data?.length ?? 0,
    };
  }

  const database = await db();
  if (!database && !allowFallbacks()) throw new Error('Production persistence requires MongoDB.');
  if (database) {
    const [farmProfiles, diagnoses, conversations] = await Promise.all([
      database.collection<FarmProfile>('farm_profiles').deleteMany({ userId }),
      database.collection<HistoryRecord>('diagnoses').deleteMany({ userId }),
      database.collection<HistoryRecord>('conversations').deleteMany({ userId }),
    ]);
    return {
      userId,
      farmProfilesDeleted: farmProfiles.deletedCount,
      diagnosesDeleted: diagnoses.deletedCount,
      conversationsDeleted: conversations.deletedCount,
    };
  }

  const farmProfilesDeleted = memory.farmProfiles.filter((item) => item.userId === userId).length;
  const diagnosesDeleted = memory.diagnoses.filter((item) => item.userId === userId).length;
  const conversationsDeleted = memory.conversations.filter((item) => item.userId === userId).length;
  memory.farmProfiles = memory.farmProfiles.filter((item) => item.userId !== userId);
  memory.diagnoses = memory.diagnoses.filter((item) => item.userId !== userId);
  memory.conversations = memory.conversations.filter((item) => item.userId !== userId);

  return {
    userId,
    farmProfilesDeleted,
    diagnosesDeleted,
    conversationsDeleted,
  };
}

export async function seedKnowledgeBase() {
  const sb = supabase();
  if (sb) {
    const { error } = await sb.from('knowledge_base').upsert(knowledgeBase.map(toKnowledgeRow), { onConflict: 'id' });
    if (error) throw error;
    return {
      mode: 'supabase' as const,
      seeded: knowledgeBase.length,
    };
  }

  const database = await db();
  if (!database && !allowFallbacks()) throw new Error('Production persistence requires MongoDB.');
  if (!database) {
    return {
      mode: 'memory' as const,
      seeded: knowledgeBase.length,
    };
  }

  await Promise.all(
    knowledgeBase.map((record) =>
      database.collection<KnowledgeRecord>('knowledge_base').updateOne({ id: record.id }, { $set: record }, { upsert: true }),
    ),
  );

  return {
    mode: 'mongo' as const,
    seeded: knowledgeBase.length,
  };
}

export async function closeDatabase() {
  await client?.close();
  client = null;
  supabaseClient = null;
  ready = false;
}

function toFarmProfileRow(profile: FarmProfile) {
  return {
    user_id: profile.userId,
    farm_size: profile.farmSize,
    crop_types: profile.cropTypes,
    soil_type: profile.soilType,
    irrigation_type: profile.irrigationType,
    location: profile.location,
    boundary_geojson: profile.boundaryGeoJson ?? null,
    center_lat: profile.centerLat ?? null,
    center_lng: profile.centerLng ?? null,
    area_hectares: profile.areaHectares ?? null,
    area_kanal: profile.areaKanal ?? null,
    updated_at: new Date().toISOString(),
  };
}

function fromFarmProfileRow(row: Record<string, any>): FarmProfile {
  return {
    userId: row.user_id,
    farmSize: row.farm_size,
    cropTypes: row.crop_types ?? [],
    soilType: row.soil_type,
    irrigationType: row.irrigation_type,
    location: row.location,
    boundaryGeoJson: row.boundary_geojson ?? undefined,
    centerLat: row.center_lat ?? undefined,
    centerLng: row.center_lng ?? undefined,
    areaHectares: row.area_hectares ?? undefined,
    areaKanal: row.area_kanal ?? undefined,
  };
}

function toDiagnosisRow(record: HistoryRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    input: record.input,
    response: record.response,
    intent: record.intent,
    timestamp: record.timestamp,
    image_uri: record.imageUri ?? null,
    image_url: record.imageURL ?? null,
    confidence: record.confidence ?? null,
    action_items: record.actionItems ?? [],
    backend_mode: record.backendMode ?? null,
  };
}

function fromDiagnosisRow(row: Record<string, any>): HistoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: 'diagnosis',
    input: row.input,
    response: row.response,
    intent: row.intent,
    timestamp: row.timestamp,
    imageUri: row.image_uri ?? undefined,
    imageURL: row.image_url ?? undefined,
    confidence: row.confidence ?? undefined,
    actionItems: row.action_items ?? [],
    backendMode: row.backend_mode ?? undefined,
  };
}

function toConversationRow(record: HistoryRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    type: record.type,
    input: record.input,
    response: record.response,
    intent: record.intent,
    timestamp: record.timestamp,
    action_items: record.actionItems ?? [],
    backend_mode: record.backendMode ?? null,
  };
}

function fromConversationRow(row: Record<string, any>): HistoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    input: row.input,
    response: row.response,
    intent: row.intent,
    timestamp: row.timestamp,
    actionItems: row.action_items ?? [],
    backendMode: row.backend_mode ?? undefined,
  };
}

function toKnowledgeRow(record: KnowledgeRecord) {
  return {
    id: record.id,
    crop: record.crop,
    category: record.category,
    title: record.title,
    keywords: record.keywords,
    response: record.response,
    action_items: record.actionItems,
    symptoms: record.symptoms ?? null,
    confidence: record.confidence ?? null,
  };
}
