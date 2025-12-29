# Supabase URL設定ガイド

## 問題
確認メールのリダイレクト先がローカルホスト（http://localhost:3000）になっている

## 解決方法

### 1. Supabase管理画面での設定

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `wwstpjknjqcrpzblgslo` を選択
3. **Authentication** → **URL Configuration** に移動
4. 以下のURLを追加：

#### Site URL
```
https://yutahamaguchi.github.io/hubpilot-free
```

#### Redirect URLs
```
https://yutahamaguchi.github.io/hubpilot-free
https://yutahamaguchi.github.io/hubpilot-free/
https://yutahamaguchi.github.io/hubpilot-free/reset-password
http://localhost:3000
http://localhost:3000/
http://localhost:3000/reset-password
```

### 2. コード修正（完了済み）

- `auth-manager.js` でリダイレクトURL自動検出機能を追加
- 環境（localhost, GitHub Pages, その他）に応じて適切なURLを設定

### 3. 設定確認方法

1. GitHub Pages: https://yutahamaguchi.github.io/hubpilot-free/deployment-test.html
2. ブラウザのコンソールで `window.authManager.getRedirectUrl()` を実行
3. 正しいURLが表示されることを確認

### 4. テスト手順

1. GitHub Pagesで新規登録を試行
2. 確認メールのリンクが正しいURLになっていることを確認
3. メール認証後、正しくアプリにリダイレクトされることを確認

## 注意事項

- Supabase設定変更後、数分で反映されます
- 開発環境とGitHub Pages両方で動作するよう設定済み
- セキュリティのため、信頼できるドメインのみ追加してください
