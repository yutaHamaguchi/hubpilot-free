# 🎨 画像生成機能 実装プラン

## 📋 概要

ブログ記事完成時に、各記事のヒーロー画像と説明画像（2〜3個）を自動生成する機能を実装します。

## 🎯 要件

### 基本機能
- **ヒーロー画像**: 記事のメイン画像（1枚/記事）
- **説明画像**: 記事内容を補足する画像（2〜3枚/記事）
- **自動プロンプト生成**: 記事内容から画像生成プロンプトを自動作成
- **Markdown統合**: 生成した画像を記事Markdownに自動挿入
- **ストレージ管理**: Supabase Storageに画像を保存

### UI/UX
- Step 6（最終承認）で画像生成ボタンを表示
- 生成進捗のリアルタイム表示
- 画像プレビュー機能
- 画像の再生成機能

## 🔌 画像生成API比較

### オプション1: OpenAI DALL-E 3（推奨）

**特徴:**
- 最高品質の画像生成
- 優れた日本語プロンプト理解
- 安全なコンテンツフィルター
- 簡単な統合

**料金:**
- Standard (1024x1024): $0.040/枚
- HD (1024x1792): $0.080/枚

**コスト試算（1記事あたり）:**
- ヒーロー画像（HD）: $0.080
- 説明画像3枚（Standard）: $0.120
- **合計: $0.200/記事（約30円）**

**プロス:**
- ✅ 高品質・高精度
- ✅ 日本語プロンプト対応
- ✅ 安全性が高い
- ✅ 統合が簡単

**コンス:**
- ❌ コストが高め
- ❌ 生成速度がやや遅い（10-30秒/枚）

### オプション2: Stability AI (Stable Diffusion)

**特徴:**
- コスト効率が良い
- 高速生成
- カスタマイズ性が高い

**料金:**
- Standard: $0.01/枚（1024x1024）
- 月額プラン: $10/月（無制限）

**コスト試算（1記事あたり）:**
- ヒーロー画像: $0.010
- 説明画像3枚: $0.030
- **合計: $0.040/記事（約6円）**

**プロス:**
- ✅ 超低コスト
- ✅ 高速生成（3-5秒/枚）
- ✅ カスタマイズ可能

**コンス:**
- ❌ 日本語プロンプトは翻訳が必要
- ❌ 品質が不安定な場合がある

### オプション3: Replicate (複数モデル)

**特徴:**
- 様々なモデルにアクセス可能
- 従量課金制

**料金:**
- SDXL: $0.0045/枚
- Flux: $0.003/枚

**コスト試算（1記事あたり）:**
- **合計: $0.018/記事（約2.7円）**

**プロス:**
- ✅ 最安コスト
- ✅ 多様なモデル選択
- ✅ 高速

**コンス:**
- ❌ 日本語プロンプト弱い
- ❌ 品質がモデルに依存

## 💡 推奨構成

### フェーズ1: DALL-E 3メイン + Stability AIフォールバック

```
優先順位:
1. DALL-E 3 (OpenAI) - デフォルト
2. Stability AI - フォールバック
3. ローカル画像/プレースホルダー - オフライン時
```

**理由:**
- 高品質が求められるヒーロー画像にはDALL-E 3
- コスト削減が必要な場合はStability AIに切替可能
- ユーザーが選択可能

## 🏗️ アーキテクチャ設計

### 1. データベーススキーマ拡張

```sql
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_article_images_article_id ON article_images(article_id);
CREATE INDEX idx_article_images_type ON article_images(image_type);
```

### 2. Supabase Storage構成

```
hubpilot-images (bucket)
├── public/
│   ├── hero/
│   │   └── {article_id}/{image_id}.png
│   └── illustrations/
│       └── {article_id}/{image_id}.png
└── temp/
    └── {session_id}/
```

**Bucket設定:**
- Public access（公開画像用）
- Max file size: 5MB
- Allowed MIME types: image/png, image/jpeg, image/webp

### 3. Edge Function: generate-images

```typescript
supabase/functions/generate-images/index.ts

入力:
{
  articleId: string,
  title: string,
  content: string,
  generateHero: boolean,
  generateIllustrations: boolean,
  illustrationCount: number (2-3)
}

出力:
{
  success: boolean,
  images: [
    {
      type: 'hero' | 'illustration',
      url: string,
      prompt: string,
      provider: string
    }
  ],
  totalCost: number
}
```

**処理フロー:**
1. 記事コンテンツ分析
2. 画像プロンプト自動生成（AI使用）
3. 画像生成API呼び出し
4. Supabase Storageにアップロード
5. データベースに記録
6. 記事Markdownに画像挿入

### 4. プロンプト自動生成

DeepSeek/OpenAIを使用して、記事内容から画像生成プロンプトを自動作成：

```typescript
// ヒーロー画像プロンプト生成例
const heroPromptTemplate = `
記事タイトル: ${title}
記事内容の要約: ${summary}

上記の記事に最適なヒーロー画像を生成するための、DALL-E 3用の英語プロンプトを作成してください。

要件:
- プロフェッショナルで視覚的に魅力的
- 記事のテーマを明確に表現
- 1024x1792サイズに適した構図
- テキストは含めない
- 写真風またはイラスト風（記事の内容に応じて）

英語プロンプトのみを出力:
`;

// 説明画像プロンプト生成例
const illustrationPromptTemplate = `
記事セクション: ${sectionHeading}
セクション内容: ${sectionContent}

このセクションを説明する画像のDALL-E 3用プロンプトを作成してください。

要件:
- セクション内容を視覚的に説明
- シンプルで分かりやすい
- 1024x1024サイズ
- インフォグラフィック風またはイラスト風

英語プロンプトのみを出力:
`;
```

## 🎨 UI/UX設計

### Step 6（最終承認）への追加

```html
<!-- 画像生成セクション -->
<div class="image-generation-section">
  <h3>🎨 記事画像の自動生成</h3>
  <p>各記事にヒーロー画像と説明画像を自動生成します。</p>

  <div class="image-options">
    <label>
      <input type="checkbox" checked id="generate-hero">
      ヒーロー画像を生成（1枚/記事）
    </label>
    <label>
      <input type="checkbox" checked id="generate-illustrations">
      説明画像を生成（2-3枚/記事）
    </label>
    <select id="illustration-count">
      <option value="2">2枚</option>
      <option value="3" selected>3枚</option>
    </select>
  </div>

  <div class="image-provider-select">
    <label>画像生成プロバイダー:</label>
    <select id="image-provider">
      <option value="dalle3">DALL-E 3 (高品質 - $0.20/記事)</option>
      <option value="stability">Stability AI (低コスト - $0.04/記事)</option>
      <option value="auto">自動選択</option>
    </select>
  </div>

  <div class="cost-estimate">
    <strong>推定コスト:</strong>
    <span id="image-cost-estimate">$2.00 (10記事)</span>
  </div>

  <button class="btn btn-primary" id="generate-images-btn">
    🎨 画像を生成
  </button>

  <!-- 生成進捗 -->
  <div class="image-generation-progress" style="display: none;">
    <div class="progress-bar">
      <div class="progress-fill" id="image-progress-fill"></div>
    </div>
    <p id="image-progress-text">画像生成中... (0/10)</p>
  </div>

  <!-- 画像プレビュー -->
  <div class="generated-images-preview" id="images-preview">
    <!-- 動的に生成 -->
  </div>
</div>
```

### 画像プレビューカード

```html
<div class="image-card">
  <div class="image-header">
    <h4>{記事タイトル}</h4>
    <span class="image-type-badge">ヒーロー画像</span>
  </div>
  <img src="{image_url}" alt="{alt_text}">
  <div class="image-actions">
    <button class="btn-small" onclick="regenerateImage()">
      🔄 再生成
    </button>
    <button class="btn-small" onclick="downloadImage()">
      💾 ダウンロード
    </button>
  </div>
</div>
```

## 🚀 実装フェーズ

### Phase 1: 基盤構築（1-2日）
- [ ] データベーススキーマ拡張
- [ ] Supabase Storage設定
- [ ] Edge Function骨格作成

### Phase 2: 画像生成機能（2-3日）
- [ ] プロンプト自動生成機能
- [ ] DALL-E 3統合
- [ ] Stability AI統合（オプション）
- [ ] 画像アップロード機能

### Phase 3: フロントエンド統合（1-2日）
- [ ] UI実装（Step 6拡張）
- [ ] 進捗表示機能
- [ ] プレビュー機能
- [ ] Markdown自動挿入

### Phase 4: テスト・最適化（1日）
- [ ] エンドツーエンドテスト
- [ ] コスト最適化
- [ ] エラーハンドリング強化

## 💰 コスト管理

### コスト上限設定

```typescript
const COST_LIMITS = {
  maxCostPerArticle: 0.50, // $0.50/記事
  maxMonthlyBudget: 50.00,  // $50/月
  alertThreshold: 40.00     // $40でアラート
};

// コストトラッキング
CREATE TABLE image_generation_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  provider VARCHAR(50),
  image_count INTEGER,
  total_cost DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 最適化戦略

1. **プロバイダー自動切替**
   - 月初はDALL-E 3使用
   - 予算70%到達でStability AIに切替
   - 予算90%到達で画像生成停止

2. **キャッシュ活用**
   - 類似プロンプトの画像を再利用
   - 同一テーマの画像バリエーション生成

3. **バッチ処理**
   - 複数記事の画像を一括生成
   - レート制限回避

## 🔒 セキュリティ・品質管理

### コンテンツフィルタリング
- OpenAI Content Policyに準拠
- 不適切な画像の自動検出
- ユーザー報告機能

### 画像品質チェック
- 解像度検証
- アスペクト比確認
- ファイルサイズ制限

## 📊 成功指標

- ✅ 画像生成成功率: 95%以上
- ✅ 平均生成時間: 30秒/記事以内
- ✅ ユーザー満足度: 4.0/5以上
- ✅ コスト効率: $0.20/記事以下

## 🔄 今後の拡張

- AI画像編集機能
- カスタムスタイル選択
- 画像のA/Bテスト
- 画像SEO最適化（alt text自動生成）

---

**次のステップ:** Phase 1から実装開始しますか？
