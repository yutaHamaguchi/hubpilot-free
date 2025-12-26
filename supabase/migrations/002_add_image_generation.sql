-- ===========================================
-- HubPilot Free - Image Generation Schema
-- ===========================================

-- 画像管理テーブル
CREATE TABLE article_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  image_type VARCHAR(50) NOT NULL, -- 'hero', 'illustration'
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  prompt TEXT,
  generation_provider VARCHAR(50), -- 'dalle3', 'stability', etc.
  generation_cost DECIMAL(10,4) DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  position INTEGER DEFAULT 0, -- 記事内の位置（説明画像用）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 画像生成コストトラッキングテーブル
CREATE TABLE image_generation_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  image_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_article_images_article_id ON article_images(article_id);
CREATE INDEX idx_article_images_type ON article_images(image_type);
CREATE INDEX idx_image_costs_project_id ON image_generation_costs(project_id);
CREATE INDEX idx_image_costs_created_at ON image_generation_costs(created_at);

-- Row Level Security 設定
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generation_costs ENABLE ROW LEVEL SECURITY;

-- 現在は認証なしでアクセス可能（将来的に認証実装時に変更）
CREATE POLICY "Allow all access" ON article_images FOR ALL USING (true);
CREATE POLICY "Allow all access" ON image_generation_costs FOR ALL USING (true);

-- 便利なビュー：記事と画像の結合
CREATE VIEW articles_with_images AS
SELECT
  a.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ai.id,
        'type', ai.image_type,
        'url', ai.image_url,
        'prompt', ai.prompt,
        'position', ai.position
      ) ORDER BY ai.position
    ) FILTER (WHERE ai.id IS NOT NULL),
    '[]'::json
  ) as images
FROM articles a
LEFT JOIN article_images ai ON a.id = ai.article_id
GROUP BY a.id;

-- コスト集計用の関数
CREATE OR REPLACE FUNCTION get_monthly_image_cost()
RETURNS DECIMAL(10,4) AS $$
  SELECT COALESCE(SUM(total_cost), 0)
  FROM image_generation_costs
  WHERE created_at >= date_trunc('month', NOW());
$$ LANGUAGE SQL;

-- プロジェクト単位のコスト取得
CREATE OR REPLACE FUNCTION get_project_image_cost(p_project_id UUID)
RETURNS DECIMAL(10,4) AS $$
  SELECT COALESCE(SUM(total_cost), 0)
  FROM image_generation_costs
  WHERE project_id = p_project_id;
$$ LANGUAGE SQL;
