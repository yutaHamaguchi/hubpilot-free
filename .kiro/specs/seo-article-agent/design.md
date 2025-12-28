# 設計ドキュメント

## 概要

SEO記事作成エージェントアプリケーションは、HubSpotのトピッククラスターモデルを自動化するウィザード形式のWebアプリケーションです。ユーザーはテーマを入力し、6つのステップを通じてピラーページと10個のクラスターページを含む包括的なコンテンツ戦略を作成できます。

**主要機能**:
- **AI記事生成**: DeepSeek/OpenAI APIを使用した実際の記事生成
- **画像自動生成**: DALL-E 3/Stability AIによるヒーロー画像・説明画像の生成
- **WordPress統合**: REST APIを使用した記事の自動投稿・下書き保存
- **ユーザー認証**: Supabase Authによるログイン・登録・データ同期
- **クラウドストレージ**: Supabaseによるデータ永続化とリアルタイム同期

アプリケーションはモダンなフルスタック構成で実装され、HubSpotのようなクリーンで信頼感のあるBtoB SaaS風デザインを採用します。

## アーキテクチャ

### 全体構成

```mermaid
graph TB
    A[index.html] --> B[HubPilotApp - メインアプリケーション]
    A --> C[styles.css - スタイル定義]

    B --> D[WizardController - ステップ管理]
    B --> E[ContentGenerator - コンテンツ生成]
    B --> F[UIRenderer - UI描画]
    B --> G[DataStore - データ管理]

    B --> H[AuthManager -
    B --> I[SupabaseIntegration - バックエンド統合]
    B --> J[WordPressIntegration - CMS統合]
    B --> K[ImageGeneration - 画像生成]

    I --> L[Supabase Database]
    I --> M[Supabase Storage]
    I --> N[Supabase Auth]
    I --> O[Edge Functions]

    D --> P[Step1: テーマ入力]
    D --> Q[Step2: 構成案生成]
    D --> R[Step3: 見出し構成]
    D --> S[Step4: 記事執筆]
    D --> T[Step5: 品質チェック]
    D --> U[Step6: 最終承認・投稿]
```

### 技術スタック

**フロントエンド**:
- HTML5、CSS3、Vanilla JavaScript (ES6+)
- レスポンシブデザイン、PWA対応
- CSS Grid、Flexbox、CSS Custom Properties

**バックエンド**:
- Supabase (PostgreSQL + Edge Functions)
- Supabase Auth (認証・認可)
- Supabase Storage (画像保存)

**AI統合**:
- DeepSeek API (記事生成 - 主要)
- OpenAI API (記事生成 - フォールバック)
- DALL-E 3 API (画像生成)
- Stability AI (画像生成 - 代替)

**外部統合**:
- WordPress REST API (記事投稿)
- Supabase Realtime (リアルタイム同期)

**データ管理**:
- Supabase PostgreSQL (クラウドデータ)
- LocalStorage (ローカルキャッシュ)
- 自動同期・バックアップ機能

## コンポーネントとインターフェース

### 1. HubPilotApp (メインアプリケーション)

アプリケーション全体を統括するメインクラス。依存関係の注入と初期化を担当。

```javascript
class HubPilotApp {
    constructor() {
        this.initializeDependencies();
        this.init();
    }

    // 依存関係の初期化
    initializeDependencies()
    setupDependencies()
    setupExternalIntegrations()

    // アプリケーション初期化
    async init()
    setupErrorHandling()
    bindEvents()

    // 開発者コマンド
    getDebugInfo()
    runTests()
    getHealthCheck()
}
```

### 2. WizardController (ステップ管理)

ウィザードの状態管理とナビゲーションを制御するコントローラー。

```javascript
class WizardController {
    constructor(r(currentStep)
        this.currentStep = 1;
        this.totalSteps = 6;
        this.data = {};
    }

    // ステップ間の移動
    nextStep()
    previousStep()
    goToStep(stepNumber)

    // データの保存と復元
    saveData(stepData)
    loadData()

    // バリデーション
    validateCurrentStep()
    validateStep(stepNumber)

    // UI更新
    updateStepIndicator()
    renderCurrentStep()
}
```

### 3. ContentGenerator (コンテンツ生成)

AI APIを使用した実際のコンテンツ生成とモック生成の両方に対応。

```javascript
class ContentGenerator {
    // 構造生成
    async generateStructure(theme)
    async generateStructureWithAI(theme)
    async generateStructureMock(theme)

    // 見出し生成
    async generateHeadings(clusterPages)
    async generateHeadingsWithAI(clusterPages)
    async generateHeadingsMock(clusterPages)

    // 記事本文の生成（進捗付き）
    async generateArticles(pages, progressCallback)
    async generateArticleWithAI(page)
    async generateArticleMock(page)

    // 品質チェックの実行
    async performQualityCheck(articles)
    async performQualityCheckWithAI(articles)
    async performQualityCheckMock(articles)

    // ピラーページの生成
    async generatePillarPage(clusterPages)

    // 生成制御
    pauseGeneration()
    resumeGeneration()
    cancelGeneration()
}
```

### 4. UIRenderer (UI描画)

各ステップのUI描画とユーザーインタラクションを担当。

```javascript
class UIRenderer {
    // ステップ描画
    renderStep(stepNumber, data)
    renderStep1()  // テーマ入力
    renderStep2()  // 構成案確認
    renderStep3()  // 見出し構成
    renderStep4()  // 記事執筆進捗
    renderStep5()  // 品質チェック
    renderStep6()  // 最終承認・投稿

    // UI制御
    updateNavigationButtons()
    animateStepTransition(container)
    showLoading(message)
    hideLoading()
    updateProgress(current, total, message)

    // イベント設定
    setupThemeInputEvents()
    setupStructureEditEvents()
    setupHeadingsEditEvents()
}
```

### 5. AuthManageて、(認証管理) - 新機能

Supabase Authを使用したユーザー認証とセッション管理。

```javascript
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isGuest = false;
    }

    // 認証機能
    async signIn(email, password)
    async signUp(email, password, displayName)
    async signInWithProvider(provider)  // Google, GitHub
    async signOut()

    // ゲスト機能
    continueAsGuest()

    // セッション管理
    async getCurrentUser()
    async refreshSession()
    onAuthStateChange(callback)

    // パスワード管理
    async sendPasswordResetEmail(email)
    async updatePassword(newPassword)

    // プロファイル管理
    async updateProfile(updates)
    async uploadAvatar(file)
}
```

### 6. SupabaseIntegration (バックエンド統合) - 新機能

Supabaseとの統合とEdge Functionsの呼び出し。

```javascript
class SupabaseIntegration {
    constructor() {
        this.supabase = null;
        this.isConfigured = false;
    }

    // 初期化
    async initialize()
    async isConfigured()

    // Edge Functions呼び出し
    async generateArticle(params)
    async analyzeSEO(content)
    async checkQuality(article)
    async generateImages(params)

    // データベース操作
    async saveProject(projectData)
    async loadProject(projectId)
    async listProjects(userId)
    async deleteProject(projectId)

    // ストレージ操作
    async uploadImage(file, path)
    async downloadImage(path)
    async deleteImage(path)

    // リアルタイム機能
    subscribeToProject(projectId, callback)
    unsubscribeFromProject(subscription)
}
```

### 7. WordPressIntegration (CMS統合) - 新機能

WordPress REST APIを使用した記事投稿機能。

```javascript
class WordPressIntegration {
    constructor() {
        this.config = {};
        this.isConfigured = false;
    }

    // 設定管理
    saveConfig(config)
    loadConfig()
    async testConnection(siteUrl, username, appPassword)

    // 記事投稿
    async publishArticle(article, options)
    async publishBatch(articles, options)
    async updateArticle(postId, updates)
    async deleteArticle(postId)

    // WordPress情報取得
    async getCategories()
    async getTags()
    async getMedia()

    // 画像アップロード
    async uploadImage(imageFile, altText)
    async uploadImages(imageFiles)
}
```

### 8. ImageGeneration (画像生成) - 新機能

AI APIを使用した画像生成機能。

```javascript
class ImageGeneration {
    constructor() {
        this.providers = ['dalle3', 'stability'];
        this.currentProvider = 'dalle3';
    }

    // 画像生成
    async generateHeroImage(article)
    async generateExplanationImages(article, count = 2)
    async generateImageBatch(articles)

    // プロンプト生成
    generateImagePrompt(article, type)
    optimizePromptForProvider(prompt, provider)

    // 画像管理
    async saveGeneratedImage(imageData, metadata)
    async loadGeneratedImages(articleId)
    async deleteGeneratedImage(imageId)

    // プロバイダー管理
    switchProvider(provider)
    async testProvider(provider)
    getProviderStatus()
}
```

## データモデル

### プロジェクトデータ構造

```javascript
Project: {
    id: "uuid",
    userId: "uuid",
    theme: "Instagramマーケティング",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",

    pillarPage: {
        title: "Instagramマーケティング完全ガイド",
        content: "...",
        summary: "...",
        wordCount: 3000,
        seoScore: 85,
        images: [
            {
                id: "uuid",
                type: "hero",
                url: "https://...",
                prompt: "...",
                generatedAt: "2024-01-01T00:00:00Z"
            }
        ]
    },

    clusterPages: [
        {
            id: "cluster-1",
            title: "Instagramの基本概念と重要性",
            headings: [
                {
                    id: "h1",
                    text: "概要と重要性",
                    level: 2
                }
            ],
            content: "...",
            wordCount: 2000,
            qualityStatus: "良好",
            seoScore: 78,
            images: [
                {
                    id: "uuid",
                    type: "explanation",
                    url: "https://...",
                    prompt: "...",
                    generatedAt: "2024-01-01T00:00:00Z"
                }
            ],
            wordpressPostId: 123  // WordPress投稿ID
        }
    ],

    qualityChecks: [
        {
            articleId: "cluster-1",
            score: 85,
            status: "良好",
            checks: [
                {
                    name: "文字数",
                    status: "OK",
                    value: "2000文字"
                }
            ],
            checkedAt: "2024-01-01T00:00:00Z"
        }
    ],

    settings: {
        aiProvider: "deepseek",
        imageProvider: "dalle3",
        wordpressConfig: {
            siteUrl: "https://example.com",
            username: "admin",
            defaultStatus: "draft"
        }
    }
}
```

### ユーザーデータ構造

```javascript
User: {
    id: "uuid",
    email: "user@example.com",
    displayName: "山田太郎",
    avatarUrl: "https://...",
    createdAt: "2024-01-01T00:00:00Z",

    preferences: {
        theme: "light",
        language: "ja",
        notifications: true,
        autoSave: true
    },

    subscription: {
        plan: "free",
        usage: {
            articlesGenerated: 10,
            imagesGenerated: 5,
            wordpressPublished: 3
        },
        limits: {
            articlesPerMonth: 50,
            imagesPerMonth: 20,
            wordpressPublishPerMonth: 10
        }
    }
}
```

## 正確性プロパティ

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 入力検証の一貫性
*For all* テーマ入力において、空文字列または空白のみの文字列は無効として扱われ、次のステップへの進行が阻止される
**Validates: Requirements 1.1, 1.2**

### Property 2: 有効入力でのナビゲーション
*For all* 有効なテーマが入力された場合、ユーザーは次のステップに進むことができる
**Validates: Requirements 1.1**

### Property 3: ピラーページ生成の一意性
*For all* 同一テーマに対して、ピラーページのタイトルと構造は一意に決定される
**Validates: Requirements 2.1**

### Property 4: クラスターページ生成の固定数
*For all* テーマに対して、デフォルトで10個のクラスターページが生成される（ユーザーが追加・削除可能）
**Validates: Requirements 2.2**

### Property 5: 見出し数の範囲制約
*For all* クラスターページにおいて、見出し数は3-6個の範囲内で生成される
**Validates: Requirements 3.1**

### Property 6: 記事文字数の範囲制約
*For all* 生成される記事において、文字数は1800-2200文字の範囲内である
**Validates: Requirements 4.1**

### Property 7: 進捗更新の単調性
*For all* 記事生成プロセスにおいて、進捗値は単調増加し、100%を超えない
**Validates: Requirements 4.2**

### Property 8: 品質チェックの網羅性
*For all* 生成された記事に対して、文字数・SEO・可読性・構造の4項目がチェックされる
**Validates: Requirements 5.1**

### Property 9: データ永続化の一貫性
*For all* 保存されたデータは、アプリケーション再起動後も正確に復元される
**Validates: Requirements 6.1**

### Property 10: 認証状態の整合性 - 新機能
*For all* ユーザーセッションにおいて、認証状態とデータアクセス権限が一致する
**Validates: Requirements 7.1**

### Property 11: 画像生成の関連性 - 新機能
*For all* 生成される画像において、記事内容との関連性が保たれる
**Validates: Requirements 8.1**

### Property 12: WordPress投稿の整合性 - 新機能
*For all* WordPress投稿において、記事データと投稿されたコンテンツが一致する
**Validates: Requirements 9.1**

### Property 13: リアルタイム同期の一貫性 - 新機能
*For all* 複数デバイス間において、データ変更がリアルタイムで同期される
**Validates: Requirements 10.1**

## エラーハンドリング

### エラーカテゴリ

1. **入力エラー**: 空のテーマ、無効な文字、文字数制限超過
2. **生成エラー**: AI API失敗、ネットワークエラー、レート制限
3. **認証エラー**: ログイン失敗、セッション期限切れ、権限不足
4. **統合エラー**: WordPress接続失敗、Supabase接続失敗
5. **画像エラー**: 画像生成失敗、アップロード失敗、容量制限
6. **UIエラー**: ブラウザ互換性、画面サイズ、JavaScript無効
7. **データエラー**: 保存失敗、同期失敗、データ破損

### エラー処理戦略

```javascript
// 統一されたエラーハンドリング
errorHandler.handle(error, context, {
    customMessage: 'ユーザー向けメッセージ',
    notify: true,
    showDetails: false,
    retry: true,
    fallback: 'mockGeneration'
});
```

## テスト戦略

### 二重テストアプローチ

**単体テスト**:
- 各クラスの個別機能テスト
- モック/スタブを使用した分離テスト
- エッジケースとエラー条件のテスト

**プロパティベーステスト**:
- JSVerifyを使用した全入力の検証
- 最小反復回数: 100回/プロパティ
- ランダム入力による包括的テスト

**統合テスト**:
- AI API統合テスト
- WordPress統合テスト
- Supabase統合テスト
- 認証フローテスト

**E2Eテスト**:
- 完全なユーザーフローテスト
- 複数ブラウザでの互換性テスト
- モバイルデバイステスト

### テスト設定

各プロパティテストは以下の形式でタグ付け:
```javascript
// Feature: seo-article-agent, Property 1: 入力検証の一貫性
```

最小反復回数: 100回（ランダム化による包括的検証のため）
