-- ===========================================
-- HubPilot Free - Initial Database Schema
-- ===========================================

-- プロジェクト管理テーブル
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  theme VARCHAR(255) NOT NULL,
  pillar_page JSONB,
  cluster_pages JSONB,
  headings JSONB,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 記事管理テーブル
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  seo_score INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  ai_provider VARCHAR(50) DEFAULT 'deepseek',
  generation_time INTEGER, -- 生成時間（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO分析結果テーブル
CREATE TABLE seo_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  keyword_density JSONB,
  readability_score INTEGER,
  heading_structure JSONB,
  internal_links JSONB,
  suggestions TEXT[],
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 生成ログテーブル
CREATE TABLE generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(50), -- 'started', 'in_progress', 'completed', 'failed'
  current_article INTEGER DEFAULT 0,
  total_articles INTEGER,
  error_message TEXT,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_articles_project_id ON articles(project_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_seo_analysis_article_id ON seo_analysis(article_id);
CREATE INDEX idx_generation_logs_project_id ON generation_logs(project_id);

-- Row Level Security (RLS) 設定
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- 現在は認証なしでアクセス可能（将来的に認証実装時に変更）
CREATE POLICY "Allow all access" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all access" ON articles FOR ALL USING (true);
CREATE POLICY "Allow all access" ON seo_analysis FOR ALL USING (true);
CREATE POLICY "Allow all access" ON generation_logs FOR ALL USING (true);

-- 更新トリガー関数（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新トリガー設定
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_logs_updated_at BEFORE UPDATE ON generation_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
