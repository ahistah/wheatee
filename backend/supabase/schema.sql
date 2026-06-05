create table if not exists public.farm_profiles (
  user_id text primary key,
  farm_size text not null,
  crop_types text[] not null default '{}',
  soil_type text not null default 'unknown',
  irrigation_type text not null default 'unknown',
  location text not null default 'Pakistan',
  boundary_geojson jsonb,
  center_lat double precision,
  center_lng double precision,
  area_hectares double precision,
  area_kanal double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id text primary key,
  user_id text not null,
  input text not null,
  response text not null,
  intent text not null,
  timestamp timestamptz not null,
  image_uri text,
  image_url text,
  confidence double precision,
  action_items text[],
  backend_mode text
);

create table if not exists public.conversations (
  id text primary key,
  user_id text not null,
  type text not null,
  input text not null,
  response text not null,
  intent text not null,
  timestamp timestamptz not null,
  action_items text[],
  backend_mode text
);

create table if not exists public.knowledge_base (
  id text primary key,
  crop text not null,
  category text not null,
  title text not null,
  keywords text[] not null default '{}',
  response text not null,
  action_items text[] not null default '{}',
  symptoms text[],
  confidence double precision
);

create index if not exists diagnoses_user_timestamp_idx on public.diagnoses (user_id, timestamp desc);
create index if not exists conversations_user_timestamp_idx on public.conversations (user_id, timestamp desc);
create index if not exists knowledge_base_crop_category_idx on public.knowledge_base (crop, category);

alter table public.farm_profiles enable row level security;
alter table public.diagnoses enable row level security;
alter table public.conversations enable row level security;
alter table public.knowledge_base enable row level security;

-- The backend uses SUPABASE_SERVICE_ROLE_KEY. Client-side table access is intentionally not granted here.
