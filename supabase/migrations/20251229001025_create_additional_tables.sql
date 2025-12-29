CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  current_article INTEGER DEFAULT 0,
  total_articles INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  keyword_density JSONB,
  readability_score INTEGER,
  heading_structure JSONB,
  internal_links JSONB,
  suggestions TEXT[],
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  image_type TEXT CHECK (image_type IN ('hero', 'illustration')),
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  prompt TEXT,
  generation_provider TEXT,
  generation_cost DECIMAL(10,6),
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_generation_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  provider TEXT,
  image_count INTEGER,
  total_cost DECIMAL(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);;
