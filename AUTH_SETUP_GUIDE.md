# 認証機能セットアップガイド

HubPilot Freeに認証機能が追加されました！このガイドでは、認証機能の設定方法とデプロイ手順を説明します。

## 🎯 認証機能の概要

### 追加された機能
- ✅ メール/パスワード認証
- ✅ ソーシャルログイン（Google, GitHub対応）
- ✅ パスワードリセット機能
- ✅ ユーザーごとのデータ分離（Row Level Security）
- ✅ ゲストモード（認証なしでも利用可能）
- ✅ LocalStorageデータのクラウド移行機能

### 動作モード

**1. 認証モード（推奨）**
- クラウドにデータ保存
- 複数デバイスで同期
- セキュアなアクセス制御

**2. ゲストモード**
- LocalStorageにデータ保存
- ブラウザローカルのみ
- 認証不要

---

## 📋 セットアップ手順

### Step 1: データベースマイグレーション実行

認証用のテーブルとポリシーを作成します。

```bash
# マイグレーションを適用
supabase db push
```

または個別に実行：

```bash
supabase migration up --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**確認コマンド:**
```bash
supabase db diff
```

---

### Step 2: Supabase認証設定

#### 2.1 メール認証の設定

Supabaseダッシュボードで設定：

1. **Authentication** > **Settings** > **Auth**
2. **Enable Email Confirmations**: ON （推奨）
3. **Minimum Password Length**: 8
4. **Site URL**: `http://localhost:8000`（開発時）
5. **Redirect URLs**:
   - `http://localhost:8000/`
   - `https://yourdomain.com/`（本番環境）

#### 2.2 ソーシャルログイン設定（オプション）

**Google OAuth:**

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. **APIs & Services** > **Credentials** > **OAuth 2.0 Client ID**を作成
3. **Authorized redirect URIs**に以下を追加:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
4. Client IDとClient Secretを取得
5. Supabaseダッシュボード > **Authentication** > **Providers** > **Google**
6. Client ID/Secretを設定して有効化

**GitHub OAuth:**

1. [GitHub Settings](https://github.com/settings/developers) > **OAuth Apps** > **New OAuth App**
2. **Authorization callback URL**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
3. Client IDとClient Secretを取得
4. Supabaseダッシュボード > **Authentication** > **Providers** > **GitHub**
5. Client ID/Secretを設定して有効化

---

### Step 3: JWT検証の有効化（本番環境推奨）

**開発環境（JWT検証なし）:**
```json
// package.json
{
  "deploy": "npm run build && supabase db push && supabase functions deploy --no-verify-jwt"
}
```

**本番環境（JWT検証あり - 推奨）:**
```json
// package.json
{
  "deploy": "npm run build && supabase db push && supabase functions deploy"
}
```

JWT検証を有効にする場合、Edge Functionで以下の設定が必要：

```typescript
// supabase/functions/generate-article/index.ts など
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // JWT検証が有効な場合、認証ヘッダーからユーザー取得
  const authHeader = req.headers.get('Authorization')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // ... 処理 ...
})
```

---

### Step 4: Row Level Security（RLS）ポリシーの確認

マイグレーション実行後、以下のポリシーが自動的に適用されます：

**Projects テーブル:**
- ✅ ユーザーは自分のプロジェクトのみ閲覧・編集可能
- ✅ ゲストプロジェクト（user_id = NULL）は誰でもアクセス可能

**Articles テーブル:**
- ✅ プロジェクトのオーナーのみアクセス可能

**ポリシーの確認:**
```sql
-- Supabase SQL Editorで実行
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

### Step 5: フロントエンド設定の確認

`supabase-config.js`が正しく設定されているか確認：

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://[YOUR-PROJECT-REF].supabase.co',  // ✅ 設定済み
  anonKey: 'your-anon-key-here',  // ✅ 設定済み
  // ...
};
```

**確認スクリプト実行:**
```bash
npm run validate
```

---

### Step 6: デプロイ

#### ローカルテスト

```bash
# Supabaseローカル環境起動
supabase start

# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:8000 を開く
```

#### 本番デプロイ

```bash
# マイグレーション適用
supabase db push

# Edge Functionsデプロイ
supabase functions deploy

# 静的ファイルデプロイ（Supabase Storage使用時）
npm run deploy:storage
```

---

## 🔐 セキュリティベストプラクティス

### 本番環境チェックリスト

- [ ] JWT検証を有効化（`--no-verify-jwt`を削除）
- [ ] CORS設定を厳格化（特定ドメインのみ許可）
- [ ] メール確認を有効化
- [ ] パスワード強度要件を設定（最低8文字）
- [ ] レート制限を設定（API呼び出し制限）
- [ ] RLSポリシーが正しく設定されているか確認
- [ ] 環境変数がハードコードされていないか確認
- [ ] `.env`ファイルが`.gitignore`に含まれているか確認

### CORS設定の厳格化

```typescript
// supabase/functions/generate-images/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

環境変数設定:
```bash
supabase secrets set ALLOWED_ORIGIN=https://yourdomain.com
```

---

## 🧪 テスト方法

### 1. 新規登録テスト

1. アプリを開く
2. 「新規登録」タブを選択
3. メールアドレスとパスワードを入力
4. 確認メールが届くことを確認
5. メール内のリンクをクリック
6. ログインできることを確認

### 2. ログインテスト

1. 登録したアカウントでログイン
2. プロジェクトを作成
3. データが保存されることを確認

### 3. データ分離テスト

1. ユーザーAでログイン → プロジェクト作成
2. ログアウト
3. ユーザーBでログイン
4. ユーザーAのプロジェクトが表示されないことを確認

### 4. ゲストモードテスト

1. 「ゲストとして続ける」をクリック
2. プロジェクトを作成
3. LocalStorageにデータが保存されることを確認
4. ページをリロードしてもデータが残ることを確認

---

## 🔧 トラブルシューティング

### 認証エラーが表示される

**症状:** "Invalid login credentials"

**原因と対処:**
1. メールアドレス/パスワードが間違っている
2. メール確認が完了していない → 確認メール内のリンクをクリック
3. アカウントが存在しない → 新規登録が必要

### プロジェクトが表示されない

**症状:** ログインできるが、以前作成したプロジェクトが表示されない

**原因と対処:**
1. RLSポリシーが正しく設定されていない → マイグレーション再実行
   ```bash
   supabase db reset
   supabase db push
   ```

2. user_idが正しく設定されていない → データベース確認
   ```sql
   SELECT id, user_id, theme FROM projects ORDER BY created_at DESC LIMIT 10;
   ```

### ソーシャルログインが動作しない

**症状:** Googleログインボタンをクリックしても反応しない

**原因と対処:**
1. OAuth設定が完了していない → Google/GitHub側の設定を確認
2. Redirect URLが間違っている → Supabaseダッシュボードで確認
3. プロバイダーが有効化されていない → Authentication > Providers で確認

### LocalStorageデータの移行に失敗する

**症状:** 「データ移行に失敗しました」エラー

**原因と対処:**
1. ネットワークエラー → 再度試行
2. データ形式が不正 → ブラウザコンソールでエラー確認
3. 権限不足 → RLSポリシー確認

手動移行方法:
```javascript
// ブラウザコンソールで実行
const data = localStorage.getItem('hubpilot_data')
console.log(JSON.parse(data))  // データ確認
```

---

## 📊 ユーザー管理

### ユーザー一覧の確認

Supabaseダッシュボード:
- **Authentication** > **Users**

または SQL:
```sql
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

### ユーザーの削除

```sql
-- 特定ユーザーの削除（カスケード削除）
DELETE FROM auth.users WHERE id = 'user-uuid-here';

-- ユーザーの全プロジェクトも自動削除されます（ON DELETE CASCADE）
```

### 使用量統計の確認

```sql
-- ユーザーごとの記事生成数
SELECT
  u.email,
  COUNT(DISTINCT a.id) as article_count,
  COUNT(DISTINCT p.id) as project_count
FROM auth.users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN articles a ON a.project_id = p.id
GROUP BY u.id, u.email
ORDER BY article_count DESC;

-- 月間画像生成コスト
SELECT * FROM user_monthly_usage;
```

---

## 🚀 今後の拡張

認証機能の実装により、以下の機能が実装可能になりました：

1. **有料プラン対応**
   - プラン別の使用量制限
   - サブスクリプション管理

2. **チーム機能**
   - プロジェクトの共有
   - コラボレーション機能

3. **使用量制限**
   - 月間記事生成数の制限
   - 画像生成数の制限

4. **API提供**
   - ユーザーごとのAPIキー発行
   - 外部システム連携

---

## 📚 関連ドキュメント

- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Providers Setup](https://supabase.com/docs/guides/auth/social-login)
- [HubPilot Free README](./README.md)
- [Supabaseセットアップガイド](./SETUP_REQUIRED.md)

---

## ❓ サポート

問題が解決しない場合：

1. GitHub Issueを作成
2. エラーメッセージをコピー
3. 実行環境（ブラウザ、OS）を記載
4. 再現手順を詳しく説明

---

**認証機能の実装により、HubPilot Freeはより安全でスケーラブルなアプリケーションになりました！** 🎉
