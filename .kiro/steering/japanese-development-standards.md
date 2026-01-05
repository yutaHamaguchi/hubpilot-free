---
inclusion: always
---

# 日本語開発標準とガイドライン

## プロジェクト概要

このプロジェクトは **HubPilot Free** - HubSpot風のトピッククラスターモデルに基づくSEO記事作成エージェントです。

### 主要技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript ES6+
- **バックエンド**: Supabase (PostgreSQL + Edge Functions)
- **AI API**: DeepSeek API (主要), OpenAI API (フォールバック)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage
- **外部連携**: WordPress REST API

## 日本語コーディング標準

### コメントとドキュメント
- **コメント**: 日本語で記述する
- **変数名・関数名**: 英語を使用（国際的な標準に従う）
- **ユーザー向けメッセージ**: 日本語で記述
- **エラーメッセージ**: 日本語で分かりやすく記述

```javascript
// ✅ 良い例
/**
 * SEO記事を生成する関数
 * @param {string} theme - メインテーマ
 * @param {Array} keywords - キーワードリスト
 * @returns {Promise<Object>} 生成された記事データ
 */
async function generateSeoArticle(theme, keywords) {
    try {
        // DeepSeek APIを使用して記事を生成
        const response = await callDeepSeekAPI(theme, keywords);
        return response;
    } catch (error) {
        console.error('記事生成中にエラーが発生しました:', error);
        throw new Error('記事の生成に失敗しました。しばらく時間をおいて再試行してください。');
    }
}
```

### UI/UXテキスト標準

#### ボタンテキスト
- **実行系**: 「生成する」「保存する」「送信する」
- **ナビゲーション**: 「次へ」「戻る」「完了」
- **確認系**: 「はい」「いいえ」「キャンセル」

#### メッセージ標準
- **成功**: 「✅ 正常に完了しました」
- **エラー**: 「❌ エラーが発生しました: [詳細]」
- **警告**: 「⚠️ 注意: [内容]」
- **情報**: 「ℹ️ [情報内容]」

### ファイル命名規則

#### JavaScript ファイル
- **コンポーネント**: `PascalCase.js` (例: `ContentGenerator.js`)
- **ユーティリティ**: `camelCase.js` (例: `apiHelper.js`)
- **設定ファイル**: `kebab-case.js` (例: `supabase-config.js`)

#### CSS ファイル
- **メイン**: `styles.css`
- **機能別**: `feature-name-styles.css` (例: `auth-styles.css`)

#### ドキュメント
- **セットアップ**: `SETUP_GUIDE.md`
- **機能別ガイド**: `FEATURE_SETUP_GUIDE.md` (例: `AUTH_SETUP_GUIDE.md`)

## プロジェクト固有の開発ルール

### API呼び出しパターン

```javascript
// DeepSeek API優先、OpenAIフォールバック
async function callAIAPI(prompt, options = {}) {
    try {
        // まずDeepSeekを試行（低コスト）
        return await callDeepSeekAPI(prompt, options);
    } catch (deepseekError) {
        console.warn('DeepSeek APIが失敗しました。OpenAIにフォールバックします:', deepseekError);
        try {
            return await callOpenAIAPI(prompt, options);
        } catch (openaiError) {
            throw new Error('すべてのAI APIが失敗しました。ネットワーク接続とAPIキーを確認してください。');
        }
    }
}
```

### エラーハンドリング標準

```javascript
// ユーザーフレンドリーなエラーメッセージ
function handleError(error, context = '') {
    const userMessage = {
        'NETWORK_ERROR': 'ネットワーク接続を確認してください',
        'API_KEY_INVALID': 'APIキーが無効です。設定を確認してください',
        'RATE_LIMIT': 'API利用制限に達しました。しばらく時間をおいて再試行してください',
        'SUPABASE_ERROR': 'データベース接続エラーです。管理者にお問い合わせください'
    };

    const message = userMessage[error.code] || `予期しないエラーが発生しました: ${error.message}`;

    // ユーザーに表示
    showNotification(message, 'error');

    // 開発者用ログ
    console.error(`[${context}] エラー詳細:`, error);
}
```

### データ構造標準

#### プロジェクトデータ
```javascript
const projectStructure = {
    id: 'uuid',
    theme: 'メインテーマ',
    pillarPage: {
        title: 'ピラーページタイトル',
        content: 'コンテンツ',
        seoScore: 85
    },
    clusterPages: [
        {
            title: 'クラスターページタイトル',
            content: 'コンテンツ',
            keywords: ['キーワード1', 'キーワード2'],
            seoScore: 78
        }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
};
```

### テスト標準

#### 単体テスト
```javascript
// テスト関数は日本語でコメント
describe('記事生成機能', () => {
    test('有効なテーマで記事が生成されること', async () => {
        const theme = 'AI技術の最新動向';
        const result = await generateSeoArticle(theme, ['AI', '機械学習']);

        expect(result).toBeDefined();
        expect(result.title).toContain('AI');
        expect(result.content.length).toBeGreaterThan(1000);
    });

    test('無効な入力でエラーが発生すること', async () => {
        await expect(generateSeoArticle('', [])).rejects.toThrow('テーマが指定されていません');
    });
});
```

### 設定ファイル管理

#### 環境変数命名
```bash
# Supabase設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI API設定
DEEPSEEK_API_KEY=your-deepseek-key
OPENAI_API_KEY=your-openai-key

# WordPress連携
WORDPRESS_SITE_URL=https://your-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
```

#### 設定検証
```javascript
function validateConfig() {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'DEEPSEEK_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`必須の環境変数が設定されていません: ${missing.join(', ')}`);
    }
}
```

## デバッグとログ

### コンソールコマンド
プロジェクトでは以下のデバッグコマンドが利用可能：

```javascript
// 基本情報
hubpilot.debug()     // デバッグ情報表示
hubpilot.stats()     // 統計情報
hubpilot.health()    // ヘルスチェック

// テスト関連
hubpilot.test()      // 包括的テスト実行
hubpilot.quality()   // 品質評価

// データ操作
hubpilot.export()    // データエクスポート
hubpilot.reset()     // データリセット
```

### ログレベル
```javascript
const LOG_LEVELS = {
    ERROR: 'エラー',
    WARN: '警告',
    INFO: '情報',
    DEBUG: 'デバッグ'
};

function log(level, message, data = null) {
    const timestamp = new Date().toLocaleString('ja-JP');
    console.log(`[${timestamp}] ${LOG_LEVELS[level]}: ${message}`, data || '');
}
```

## パフォーマンス最適化

### 画像最適化
- **形式**: WebP優先、PNG/JPEGフォールバック
- **サイズ**: 最大1920x1080、品質80%
- **遅延読み込み**: `loading="lazy"` 属性使用

### API呼び出し最適化
- **キャッシュ**: LocalStorageで結果をキャッシュ（24時間）
- **バッチ処理**: 複数記事の一括生成対応
- **レート制限**: 1秒間に最大3リクエスト

### データベース最適化
- **インデックス**: user_id, created_at, project_idにインデックス
- **RLS**: Row Level Securityでユーザーデータ分離
- **バックアップ**: 自動バックアップ（最新5件保持）

## セキュリティガイドライン

### API キー管理
- **環境変数**: 本番環境では必ず環境変数を使用
- **フロントエンド**: 公開キー（anon key）のみ使用
- **バックエンド**: サービスキーはEdge Functionsでのみ使用

### データ検証
```javascript
function validateUserInput(input) {
    // XSS対策
    const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 長さ制限
    if (sanitized.length > 10000) {
        throw new Error('入力が長すぎます（最大10,000文字）');
    }

    return sanitized.trim();
}
```

## 国際化対応

### 日付・時刻
```javascript
// 日本時間での表示
const formatDate = (date) => {
    return new Date(date).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
```

### 数値フォーマット
```javascript
// 日本語での数値表示
const formatNumber = (num) => {
    return new Intl.NumberFormat('ja-JP').format(num);
};

// 通貨表示
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
    }).format(amount);
};
```

このsteering fileに従って開発を進めることで、一貫性のある高品質な日本語対応アプリケーションを構築できます。
