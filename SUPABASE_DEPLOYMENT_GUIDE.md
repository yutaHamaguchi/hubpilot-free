# Supabaseデプロイメントガイド

## 概要

HubPilot FreeをSupabaseのみで完全に動作させることが**可能**です。このガイドでは、Supabaseへのデプロイ手順と必要な設定を詳しく説明します。

---

## デプロイ可能性の結論

✅ **はい、Supabaseのみで完全に動作します**

現在の構成で以下のSupabase機能を活用してデプロイできます：
- **Supabase Storage**: 静的ファイル（HTML/CSS/JS）のホスティング
- **Supabase Database**: PostgreSQLデータベース
- **Supabase Edge Functions**: サーバーサイドロジック（AI記事生成等）
- **Supabase Auth**: ユーザー認証（実装済み）
- **Supabase Realtime**: リアルタイム進捗更新

---

## 必要なもの

### 1. Supabaseアカウント
- 無料プラン（Free Tier）で開始可能
- https://supabase.com/dashboard でアカウント作成

### 2. 外部APIキー（必須）
以下のいずれか、または両方：
- **DeepSeek API Key** （推奨・コスト効率的）
  - https://platform.deepseek.com/
  - 1Mトークンあたり$0.14-$2.19
- **OpenAI API Key** （バックアップ）
  - https://platform.openai.com/
  - GPT-4: 1Mトークンあたり$30-$60

### 3. 画像生成APIキー（オプション）
画像生成機能を使用する場合：
- **DALL-E API Key** または
- **Stability AI API Key** または
- **Midjourney API Key**

---

## デプロイ手順

### ステップ1: Supabaseプロジェクト作成

1. **Supabaseダッシュボードにアクセス**
   ```
   https://supabase.com/dashboard
   ```

2. **新規プロジェクトを作成**
   - Organization: 新規作成または既存を選択
   - Project Name: `hubpilot-free`
   - Database Password: 強力なパスワードを設定
   - Region: 最寄りのリージョン（例: `Northeast Asia (Tokyo)`）
   - Pricing Plan: Free（開始時）

3. **プロジェクトが作成されるまで待機**（約2分）

### ステップ2: データベースマイグレーション

1. **Supabase CLIをインストール**（ローカル環境）
   ```bash
   npm install -g supabase
   ```

2. **Supabaseにログイン**
   ```bash
   supabase login
   ```

3. **プロジェクトにリンク**
   ```bash
   cd /path/to/hubpilot-free
   supabase link --project-ref <your-project-ref>
   ```

   `<your-project-ref>`はダッシュボードのProject Settings > General > Reference IDで確認

4. **マイグレーションを実行**
   ```bash
   supabase db push
   ```

   これにより以下のマイグレーションが実行されます：
   - `001_initial_schema.sql` - 基本テーブル（projects, articles等）
   - `002_add_image_generation.sql` - 画像生成機能
   - `003_add_authentication.sql` - 認証機能

5. **マイグレーション成功を確認**
   ```bash
   supabase db remote commit
   ```

### ステップ3: Edge Functionsデプロイ

1. **すべてのEdge Functionsをデプロイ**
   ```bash
   supabase functions deploy generate-article
   supabase functions deploy analyze-seo
   supabase functions deploy check-quality
   supabase functions deploy generate-images
   ```

2. **環境変数を設定**

   各Functionに必要なAPIキーを設定：

   ```bash
   # DeepSeek API Key（推奨）
   supabase secrets set DEEPSEEK_API_KEY=your-deepseek-api-key

   # OpenAI API Key（バックアップ）
   supabase secrets set OPENAI_API_KEY=your-openai-api-key

   # 画像生成APIキー（オプション）
   supabase secrets set DALLE_API_KEY=your-dalle-api-key
   # または
   supabase secrets set STABILITY_API_KEY=your-stability-api-key
   ```

3. **Secretsの設定を確認**
   ```bash
   supabase secrets list
   ```

### ステップ4: Storageバケット作成

1. **Supabaseダッシュボードにアクセス**
   - Storage > New Bucket

2. **Publicバケットを作成**
   - Name: `public`
   - Public: ✅ チェック
   - File size limit: 50MB
   - Allowed MIME types: `image/*`, `text/html`, `text/css`, `application/javascript`

3. **Privateバケットを作成**（ユーザーデータ用）
   - Name: `private`
   - Public: ❌ チェック解除

### ステップ5: 静的ファイルのアップロード

#### オプション1: Supabase Storageを使用（推奨）

1. **必要なファイルを圧縮**
   ```bash
   # プロジェクトルートで実行
   zip -r hubpilot-static.zip \
     index.html \
     styles.css \
     app.js \
     auth-manager.js \
     auth-styles.css \
     image-generation.js \
     image-generation-styles.css \
     supabase-config.js \
     supabase-integration.js \
     wordpress-integration.js \
     wordpress-styles.css \
     src/
   ```

2. **Supabase Storageにアップロード**

   Supabaseダッシュボード > Storage > public > Upload Files

   または、CLIを使用：
   ```bash
   supabase storage upload public/index.html ./index.html
   supabase storage upload public/styles.css ./styles.css
   supabase storage upload public/app.js ./app.js
   # その他のファイルも同様に
   ```

3. **アクセスURLを取得**
   ```
   https://<your-project-ref>.supabase.co/storage/v1/object/public/public/index.html
   ```

#### オプション2: Vercel/Netlifyを使用（より簡単）

Supabase StorageはAPIアクセス用で、静的サイトホスティングは別サービスの方が便利です：

**Vercel**:
1. GitHubリポジトリにプッシュ
2. Vercelにインポート
3. 環境変数なしでデプロイ可能

**Netlify**:
1. GitHubリポジトリにプッシュ
2. Netlifyにインポート
3. 自動デプロイ設定

### ステップ6: フロントエンド設定更新

1. **supabase-config.jsを更新**

   ```javascript
   window.SUPABASE_CONFIG = {
     // これらの値をSupabaseダッシュボードから取得
     url: 'https://your-project-ref.supabase.co',
     anonKey: 'your-anon-key-here',

     // その他の設定はそのまま
     functions: { ... },
     storage: { ... },
     // ...
   };
   ```

2. **Project Settings > API から値を取得**
   - **Project URL** → `url`
   - **anon public** → `anonKey`

3. **更新したファイルを再アップロード**
   ```bash
   supabase storage upload public/supabase-config.js ./supabase-config.js --upsert
   ```

### ステップ7: 認証設定（オプション）

ユーザー認証を有効にする場合：

1. **Authentication > Providers**で以下を有効化：
   - Email（デフォルトで有効）
   - Google（オプション）
   - GitHub（オプション）

2. **Email Templatesをカスタマイズ**（オプション）
   - Confirm signup
   - Reset password
   - Magic link

3. **URL Configurationを設定**
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/**`

### ステップ8: 動作確認

1. **アプリケーションにアクセス**
   ```
   https://<your-project-ref>.supabase.co/storage/v1/object/public/public/index.html
   ```

   または Vercel/Netlify URL:
   ```
   https://your-app.vercel.app
   ```

2. **接続テストを実行**

   ブラウザのコンソールで：
   ```javascript
   window.supabaseIntegration.testConnection()
   ```

   期待される出力：
   ```
   ✅ Supabase接続成功
   ✅ データベース接続正常
   ✅ Edge Functions利用可能
   ```

3. **記事生成をテスト**

   Step 1でテーマを入力し、ウィザードを進めて記事生成をテスト

---

## コスト見積もり

### Supabase（Free Tier）
- **データベース**: 500MB（十分）
- **Storage**: 1GB（十分）
- **Edge Functions**: 500K実行/月（十分）
- **帯域幅**: 5GB/月

**無料枠を超えた場合**:
- Pro Plan: $25/月
- データベース追加: 8GB → $0.125/GB
- Storage追加: 100GB → $0.021/GB

### AI API（変動コスト）

**DeepSeek（推奨）**:
- 1記事（2000文字）: 約$0.02-0.05
- 10記事生成: 約$0.20-0.50
- 月100記事: 約$2-5

**OpenAI GPT-4**:
- 1記事（2000文字）: 約$0.50-1.00
- 10記事生成: 約$5-10
- 月100記事: 約$50-100

**推奨**: DeepSeekを優先使用（OpenAIはバックアップ）

### 画像生成（オプション）

**DALL-E 3**:
- 1画像（1024x1024）: $0.040
- 10記事×2画像: $0.80
- 月100記事: 約$8

### 月間コスト例

**ライトユース（月10記事）**:
- Supabase: $0（Free Tier内）
- DeepSeek: $0.50
- 画像生成: $0.80（オプション）
- **合計: 約$1.30/月**

**ミディアムユース（月50記事）**:
- Supabase: $0-25
- DeepSeek: $2.50
- 画像生成: $4.00（オプション）
- **合計: 約$6.50-31.50/月**

**ヘビーユース（月200記事）**:
- Supabase: $25（Pro Plan推奨）
- DeepSeek: $10
- 画像生成: $16（オプション）
- **合計: 約$51/月**

---

## トラブルシューティング

### Edge Functionsが動作しない

**症状**: 記事生成時に「Edge Function呼び出しエラー」

**解決策**:
1. Secretsが正しく設定されているか確認
   ```bash
   supabase secrets list
   ```

2. Edge Functionのログを確認
   ```bash
   supabase functions logs generate-article
   ```

3. APIキーが有効か確認
   - DeepSeek: https://platform.deepseek.com/usage
   - OpenAI: https://platform.openai.com/usage

### CORSエラーが発生

**症状**: ブラウザコンソールに「CORS policy」エラー

**解決策**:
1. Edge Functionsの`corsHeaders`を確認（すでに設定済み）
2. Supabase Settings > API > CORS allowed origins に配信ドメインを追加

### データベース接続エラー

**症状**: 「Failed to connect to database」

**解決策**:
1. マイグレーションが正しく実行されたか確認
   ```bash
   supabase db remote commit
   ```

2. RLS（Row Level Security）ポリシーを確認
   - 現在は`Allow all access`ポリシーで全アクセス許可

3. Supabase URLとAnon Keyが正しいか確認

### ストレージアップロードエラー

**症状**: ファイルアップロードが失敗

**解決策**:
1. バケットが公開設定になっているか確認
2. MIME typeが許可されているか確認
3. ファイルサイズ制限（デフォルト50MB）を確認

---

## セキュリティ設定

### 本番環境での推奨設定

1. **RLSポリシーの更新**

   認証ユーザーのみアクセス許可：
   ```sql
   -- projects テーブル
   DROP POLICY "Allow all access" ON projects;
   CREATE POLICY "Users can access own projects" ON projects
     FOR ALL USING (auth.uid() = user_id);

   -- 他のテーブルも同様
   ```

2. **CORS設定の制限**

   Supabase Settings > API > CORS allowed origins:
   ```
   https://your-domain.com
   https://your-app.vercel.app
   ```

3. **APIキーの環境変数管理**

   絶対にコードにハードコーディングしない：
   ```bash
   # ✅ 正しい
   supabase secrets set DEEPSEEK_API_KEY=xxx

   # ❌ 間違い
   const apiKey = "sk-xxx" // コードに直接記述
   ```

4. **Rate Limiting設定**

   Edge Functionsにレート制限を実装（推奨）

---

## パフォーマンス最適化

### 1. CDN設定

Vercel/Netlifyは自動的にCDNを使用しますが、Supabase Storageの場合：
- Cloudflareなどのリバースプロキシを設定
- 静的ファイルをキャッシュ

### 2. Edge Functionsの最適化

- **同時実行制限**: デフォルトは10並列
- **タイムアウト設定**: 長時間処理は分割

### 3. データベースインデックス

すでに主要なインデックスは作成済み：
```sql
CREATE INDEX idx_articles_project_id ON articles(project_id);
CREATE INDEX idx_articles_status ON articles(status);
```

---

## メンテナンス

### バックアップ

**自動バックアップ（Pro Plan）**:
- 毎日自動バックアップ
- 7日間保持

**手動バックアップ（Free Tier）**:
```bash
# データベースをエクスポート
supabase db dump -f backup.sql

# Storageファイルをダウンロード
supabase storage download public/
```

### モニタリング

**Supabase Dashboard > Reports**:
- API Request数
- Database usage
- Storage usage
- Edge Functions実行回数

**アラート設定**:
- コスト上限アラート（設定済み: $80）
- エラーレート監視

---

## まとめ

✅ **HubPilot FreeはSupabaseのみで完全に動作します**

**必要な手順**:
1. Supabaseプロジェクト作成（無料）
2. データベースマイグレーション実行
3. Edge Functionsデプロイ + APIキー設定
4. 静的ファイルホスティング（Supabase Storage または Vercel/Netlify）
5. 設定ファイル更新（URL、Anon Key）

**推奨構成**:
- **データベース + Edge Functions**: Supabase
- **静的ファイルホスティング**: Vercel/Netlify（より簡単）
- **AI API**: DeepSeek（コスト効率的）

**月間コスト**: 約$1-50（使用量による）

**次のステップ**: このガイドに従ってデプロイを実行してください。問題が発生した場合は、トラブルシューティングセクションを参照してください。

---

**作成日**: 2025年12月27日
**対象バージョン**: HubPilot Free v1.0
**Supabase CLI**: v1.0+
