-- ===========================================
-- HubPilot Free - Authentication Schema
-- ===========================================

-- 既存テーブルにuser_idカラムを追加
-- NULL許可 = 認証前に作成されたデータとの互換性維持
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE generation_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE image_generation_costs ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- インデックス追加（パフォーマンス向上）
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_image_costs_user_id ON image_generation_costs(user_id);

-- ===========================================
-- Row Level Security (RLS) ポリシーの更新
-- ===========================================

-- 既存の緩いポリシーを削除
DROP POLICY IF EXISTS "Allow all access" ON projects;
DROP POLICY IF EXISTS "Allow all access" ON articles;
DROP POLICY IF EXISTS "Allow all access" ON seo_analysis;
DROP POLICY IF EXISTS "Allow all access" ON generation_logs;
DROP POLICY IF EXISTS "Allow all access" ON article_images;
DROP POLICY IF EXISTS "Allow all access" ON image_generation_costs;

-- ===========================================
-- Projects テーブルのRLSポリシー
-- ===========================================

-- 認証済みユーザーは自分のプロジェクトを閲覧可能
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 認証済みユーザーは自分のプロジェクトを作成可能
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは自分のプロジェクトを更新可能
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- 認証済みユーザーは自分のプロジェクトを削除可能
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ゲストモード: user_idがNULLのプロジェクトは誰でもアクセス可能
-- （LocalStorageモードとの互換性のため）
CREATE POLICY "Allow public access to guest projects"
  ON projects FOR ALL
  USING (user_id IS NULL);

-- ===========================================
-- Articles テーブルのRLSポリシー
-- ===========================================

-- プロジェクト経由でのアクセス制御
CREATE POLICY "Users can view articles of own projects"
  ON articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert articles to own projects"
  ON articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update articles of own projects"
  ON articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete articles of own projects"
  ON articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- ===========================================
-- SEO Analysis テーブルのRLSポリシー
-- ===========================================

CREATE POLICY "Users can access seo_analysis of own articles"
  ON seo_analysis FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM articles
      JOIN projects ON projects.id = articles.project_id
      WHERE articles.id = seo_analysis.article_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- ===========================================
-- Generation Logs テーブルのRLSポリシー
-- ===========================================

CREATE POLICY "Users can view own generation logs"
  ON generation_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own generation logs"
  ON generation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own generation logs"
  ON generation_logs FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ===========================================
-- Article Images テーブルのRLSポリシー
-- ===========================================

CREATE POLICY "Users can access images of own articles"
  ON article_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM articles
      JOIN projects ON projects.id = articles.project_id
      WHERE articles.id = article_images.article_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- ===========================================
-- Image Generation Costs テーブルのRLSポリシー
-- ===========================================

CREATE POLICY "Users can view own image costs"
  ON image_generation_costs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own image costs"
  ON image_generation_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ===========================================
-- ユーザープロファイルテーブル（追加機能）
-- ===========================================

CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name VARCHAR(255),
  avatar_url TEXT,
  plan VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  monthly_quota_articles INTEGER DEFAULT 50,
  monthly_quota_images INTEGER DEFAULT 100,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザープロファイルのRLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 新規ユーザー登録時に自動でプロファイル作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 使用量トラッキング用ビュー
-- ===========================================

-- ユーザーの月間使用量を取得するビュー
CREATE VIEW user_monthly_usage AS
SELECT
  p.user_id,
  COUNT(DISTINCT a.id) as articles_generated,
  COALESCE(SUM(igc.image_count), 0) as images_generated,
  COALESCE(SUM(igc.total_cost), 0) as total_cost,
  date_trunc('month', NOW()) as month
FROM projects p
LEFT JOIN articles a ON p.id = a.project_id
  AND a.created_at >= date_trunc('month', NOW())
LEFT JOIN image_generation_costs igc ON p.id = igc.project_id
  AND igc.created_at >= date_trunc('month', NOW())
WHERE p.user_id IS NOT NULL
GROUP BY p.user_id;

-- ===========================================
-- コスト関数の更新（ユーザーごと）
-- ===========================================

-- ユーザーの月間画像生成コストを取得
CREATE OR REPLACE FUNCTION get_user_monthly_image_cost(p_user_id UUID)
RETURNS DECIMAL(10,4) AS $$
  SELECT COALESCE(SUM(total_cost), 0)
  FROM image_generation_costs
  WHERE user_id = p_user_id
  AND created_at >= date_trunc('month', NOW());
$$ LANGUAGE SQL SECURITY DEFINER;

-- 現在のユーザーの月間コストを取得（RLS対応）
CREATE OR REPLACE FUNCTION get_my_monthly_image_cost()
RETURNS DECIMAL(10,4) AS $$
  SELECT COALESCE(SUM(total_cost), 0)
  FROM image_generation_costs
  WHERE user_id = auth.uid()
  AND created_at >= date_trunc('month', NOW());
$$ LANGUAGE SQL SECURITY DEFINER;

-- ===========================================
-- 完了メッセージ
-- ===========================================

COMMENT ON TABLE user_profiles IS 'ユーザープロファイル情報';
COMMENT ON FUNCTION handle_new_user() IS '新規ユーザー登録時の自動プロファイル作成';
COMMENT ON VIEW user_monthly_usage IS 'ユーザーの月間使用量統計';
