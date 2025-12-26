# 🔐 HubPilot Free - セットアップ必須項目

このファイルには、Phase 2（AI記事生成機能）を動作させるために必要な設定項目をリストアップしています。

## ✅ 必須セットアップ項目

### 1. Supabaseプロジェクトの作成

#### 手順:
1. **Supabaseアカウント作成**
   - https://supabase.com/ にアクセス
   - GitHubアカウントでサインアップ（無料）

2. **新規プロジェクト作成**
   - Dashboard > "New Project" をクリック
   - プロジェクト名: `hubpilot-free`
   - データベースパスワードを設定（強力なパスワード推奨）
   - リージョン選択: `Northeast Asia (Tokyo)` 推奨
   - プランは **Free** でOK（500MB DB、500k Edge Functions実行/月）

3. **API キー取得**
   - Project Settings > API に移動
   - 以下の値をコピー:
     - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
     - **anon public**: `eyJhbGciOiJIUzI1...`（公開用キー）
     - **service_role**: `eyJhbGciOiJIUzI1...`（サーバー用キー、**秘密厳守**）

#### 設定箇所:
```javascript
// supabase-config.js の 8-9行目を更新
url: 'https://xxxxxxxxxxxxx.supabase.co', // ← ここに Project URL
anonKey: 'eyJhbGciOiJIUzI1...', // ← ここに anon public key
```

#### .env ファイル作成:
```bash
cp .env.example .env
```

`.env` ファイルを編集:
```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...（Edge Functions用）
```

---

### 2. データベースのセットアップ

#### 手順:
1. **Supabase SQL Editorを開く**
   - Dashboard > SQL Editor

2. **マイグレーションSQL実行**
   - `supabase/migrations/001_initial_schema.sql` の内容をコピー
   - SQL Editorにペースト
   - "Run" をクリック

3. **確認**
   - Table Editor で以下のテーブルが作成されたことを確認:
     - `projects`
     - `articles`
     - `seo_analysis`
     - `generation_logs`

#### CLI経由の場合:
```bash
# Supabase CLIインストール
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref xxxxxxxxxxxxx

# マイグレーション実行
supabase db push
```

---

### 3. AI APIキーの取得

現在、2つのAIプロバイダーをサポートしています:

#### A. DeepSeek API（推奨 - コスト効率最高）

**特徴:**
- OpenAIの約1/10のコスト
- GPT-4レベルの品質
- 優れた日本語対応

**取得手順:**
1. https://platform.deepseek.com/ にアクセス
2. アカウント作成（メールアドレスまたはGitHub）
3. API Keys ページで "Create new key" をクリック
4. キーをコピー: `sk-xxxxxxxxxxxxxxxxxxxx`

**料金（2024年12月時点）:**
- 入力: $0.27 / 1M tokens
- 出力: $1.10 / 1M tokens
- 目安: 2000文字記事 = 約$0.005（0.5円）

**設定:**
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

#### B. OpenAI API（バックアップ用）

**取得手順:**
1. https://platform.openai.com/ にアクセス
2. アカウント作成
3. API Keys で "Create new secret key" をクリック
4. キーをコピー: `sk-proj-xxxxxxxxxxxxxxxxxxxx`

**料金（GPT-4o）:**
- 入力: $2.50 / 1M tokens
- 出力: $10.00 / 1M tokens
- 目安: 2000文字記事 = 約$0.05（5円）

**設定:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

**⚠️ 重要:** 少なくとも **DeepSeek** または **OpenAI** のどちらか1つは必須です。

---

### 4. Edge Functionsのデプロイ

#### 手順:

```bash
# Supabase CLIで各Functionをデプロイ
supabase functions deploy generate-article
supabase functions deploy analyze-seo
supabase functions deploy check-quality
```

#### 環境変数の設定（Edge Functions用）:

```bash
# DeepSeek APIキー設定
supabase secrets set DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# OpenAI APIキー設定（オプション）
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# Supabase接続情報（自動設定されるが確認）
supabase secrets set SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...

# 設定確認
supabase secrets list
```

---

### 5. フロントエンド統合

#### index.html への追加:

`index.html` の `</head>` タグの直前に以下を追加:

```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase設定 -->
<script src="supabase-config.js"></script>

<!-- Supabase統合レイヤー -->
<script src="supabase-integration.js"></script>
```

---

## 📊 セットアップ確認チェックリスト

完了したら ✅ をつけてください:

- [ ] Supabaseプロジェクト作成完了
- [ ] `supabase-config.js` にURL・キーを設定
- [ ] `.env` ファイル作成・設定
- [ ] データベーススキーマ作成完了
- [ ] DeepSeek APIキー取得・設定
- [ ] OpenAI APIキー取得・設定（オプション）
- [ ] Edge Functions デプロイ完了
- [ ] Edge Functions の環境変数設定完了
- [ ] `index.html` にスクリプト追加
- [ ] ブラウザで動作確認

---

## 🧪 動作確認方法

### 1. Supabase接続テスト

ブラウザのコンソールで:

```javascript
// Supabase設定確認
window.showSupabaseConfig()

// 接続テスト
await window.supabaseIntegration.testConnection()
```

期待される結果:
```
✅ Supabase接続OK
```

### 2. モックモード確認

Supabase未設定の場合、自動的にモックモードで動作します:

```
⚠️ Supabase設定が不完全です。モックモードで動作します。
```

モックモードでは:
- 記事生成のシミュレーションが動作
- 実際のAI生成は行われない
- ローカルストレージのみ使用

### 3. 実際の記事生成テスト

すべて設定完了後、アプリで:
1. Step 1: テーマ入力
2. Step 2: 構成案確認
3. Step 3: 見出し設定
4. Step 4: **記事生成開始** ← ここで実際のAI生成が実行されます

コンソールで進捗確認:
```
📊 進捗: 1/5 (20%)
📊 進捗: 2/5 (40%)
...
✅ すべての記事生成が完了しました
```

---

## 💰 コスト見積もり

### 無料枠での運用

**Supabase無料枠:**
- Database: 500MB（小規模サイトなら十分）
- Edge Functions: 500,000実行/月
- Storage: 1GB
- Realtime: 200同時接続

**DeepSeek API:**
- 初回クレジット: $5（約1000記事分）
- 月額上限設定可能

**想定コスト（月間100記事生成の場合）:**
- Supabase: $0（無料枠内）
- DeepSeek API: $0.50（約50円）
- **合計: 約50円/月**

### 有料プラン移行タイミング

以下の場合に有料プランを検討:
- Database: 500MB超過（約10,000記事以上）
- Edge Functions: 500k実行/月超過
- より高速な処理が必要

---

## 🆘 トラブルシューティング

### Supabase接続エラー

**症状:** `❌ Supabase接続エラー`

**確認事項:**
1. `supabase-config.js` のURL・キーが正しいか
2. Supabaseプロジェクトが起動しているか（Dashboard確認）
3. ブラウザのネットワークタブでエラー詳細確認

### Edge Functions実行エラー

**症状:** 記事生成が失敗する

**確認事項:**
1. Edge Functionsがデプロイされているか
   ```bash
   supabase functions list
   ```
2. 環境変数が設定されているか
   ```bash
   supabase secrets list
   ```
3. API キーが有効か（残高確認）

### AI API エラー

**症状:** `DeepSeek API error: 401`

**確認事項:**
1. APIキーが正しいか
2. APIキーに残高があるか
3. レート制限に達していないか

---

## 📞 サポート

問題が解決しない場合:

1. **GitHub Issues**: バグ報告・質問
2. **Supabase Discord**: Supabase関連の質問
3. **DeepSeek Discord**: DeepSeek API関連の質問

---

**準備が完了したら、このファイルを削除してもOKです！** 🎉
