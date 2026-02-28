-- 1. Cache plant data to protect Perenual rate limit
CREATE TABLE IF NOT EXISTS plant_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perenual_id INTEGER UNIQUE,
  common_name TEXT,
  scientific_name TEXT,
  data JSONB,
  image_urls TEXT[],
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User saved plants
CREATE TABLE IF NOT EXISTS saved_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  plant_common_name TEXT,
  plant_scientific_name TEXT,
  environmental_profile JSONB,
  recommendation_data JSONB,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scan sessions
CREATE TABLE IF NOT EXISTS scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinates POINT,
  environmental_profile JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
