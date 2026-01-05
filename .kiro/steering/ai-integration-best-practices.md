---
inclusion: fileMatch
fileMatchPattern: '*AI*|*ai*|*Service*|*service*|*API*|*api*'
---

# AI統合ベストプラクティス

## AI API統合戦略

### プロバイダー優先順位
1. **DeepSeek API** (主要) - 超低コスト、高品質
2. **OpenAI API** (フォールバック) - 安定性重視
3. **将来拡張** - Claude, Gemini等

### コスト最適化戦略

#### DeepSeek API優先使用
```javascript
class AIService {
    constructor() {
        this.providers = {
            deepseek: new DeepSeekProvider(),
            openai: new OpenAIProvider()
        };
        this.defaultProvider = 'deepseek';
        this.fallbackProvider = 'openai';
    }

    async generateContent(prompt, options = {}) {
        try {
            // DeepSeek優先（OpenAIの約1/10のコスト）
            return await this.providers.deepseek.generate(prompt, options);
        } catch (error) {
            console.warn('DeepSeek失敗、OpenAIにフォールバック:', error.message);

            // OpenAIフォールバック
            return await this.providers.openai.generate(prompt, options);
        }
    }
}
```

#### トークン使用量監視
```javascript
class TokenTracker {
    constructor() {
        this.usage = {
            deepseek: { tokens: 0, cost: 0 },
            openai: { tokens: 0, cost: 0 }
        };
    }

    trackUsage(provider, tokens) {
        const rates = {
            deepseek: 0.00014, // $0.14/1M tokens
            openai: 0.0015     // $1.50/1M tokens
        };

        thovider].tokens += tokens;
        this.usage[provider].cost += (tokens / 1000000) * rates[provider];

        // Supabaseにログ保存
        this.logUsage(provider, tokens, this.usage[provider].cost);
    }

    async logUsage(provider, tokens, cost) {
        await supabase.from('generation_logs').insert({
            ai_provider: provider,
            tokens_used: tokens,
            cost_estimate: cost,
            created_at: new Date().toISOString()
        });
    }
}
```

## プロンプトエンジニアリング

### 記事生成プロンプト設計

#### 構造化プロンプト
```javascript
function buildArticlePrompt(theme, keywords, structure) {
    return `
# SEO記事生成指示

## 基本情報
- **メインテーマ**: ${theme}
- **ターゲットキーワード**: ${keywords.join(', ')}
- **記事タイプ**: ${structure.type}
- **想定文字数**: ${structure.wordCount}文字

## 記事構成
${structure.headings.map((h, i) => `${i + 1}. ${h}`).join('\n')}

## 執筆ガイドライン
1. **SEO最適化**: キーワード密度2-3%を維持
2. **読みやすさ**: 中学生でも理解できる文章
3. **専門性**: 信頼できる情報源に基づく内容
4. **独自性**: オリジナルの視点や分析を含む

## 出力形式
- Markdown形式で出力
- 見出しは適切なレベル（H2, H3）を使用
- 各セクション300-500文字程度
- 自然な文章でキーワードを配置

## 品質基準
- 情報の正確性を重視
- 読者にとって価値のある内容
- SEOベストプラクティスに準拠
- 日本語として自然な表現

記事を生成してください：
`;
}
```

#### 画像生成プロンプト
```javascript
function generateImagePrompt(articleTitle, content, imageType) {
    const basePrompts = {
        hero: `
Create a professional hero image for an article titled "${articleTitle}".
Style: Modern, clean, business-oriented
Colors: Orange (#ff7a59) and navy blue accents
Elements: Abstract, technology-focused, no text overlay
Aspect ratio: 16:9
Quality: High resolution, suitable for web use
`,
        content: `
Create a supporting illustration for the article section about "${content.substring(0, 100)}...".
Style: Minimalist, informative, diagram-like
Colors: Complementary to orange and navy theme
Elements: Icons, charts, or conceptual illustrations
Aspect ratio: 4:3
Quality: Clear, web-optimized
`
    };

    return basePrompts[imageType] || basePrompts.content;
}
```

### プロンプト最適化テクニック

#### Few-Shot Learning
```javascript
const EXAMPLE_ARTICLES = [
    {
        theme: "AI技術の最新動向",
        output: `# AI技術の最新動向：2024年に注目すべき5つのトレンド

## はじめに
人工知能（AI）技術は急速に進歩し、私たちの生活やビジネスに大きな影響を与えています...

## 1. 生成AI（Generative AI）の普及
ChatGPTやGPT-4の登場により、生成AIが一般的になりました...`
    }
];

function buildFewShotPrompt(theme, keywords) {
    const examples = EXAMPLE_ARTICLES.slice(0, 2); // 2例まで

    return `
以下の例を参考に、同様の品質とスタイルで記事を生成してください：

${examples.map(ex => `
## 例：
テーマ: ${ex.theme}
出力:
${ex.output}
`).join('\n')}

## 新しい記事：
テーマ: ${theme}
キーワード: ${keywords.join(', ')}

上記の例と同じスタイルで記事を生成してください：
`;
}
```

## エラーハンドリング戦略

### API障害対応
```javascript
class RobustAIService {
    constructor() {
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
    }

    async generateWithRetry(prompt, options = {}) {
        let lastError;

        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                return await this.generateContent(prompt, options);
            } catch (error) {
                lastError = error;

                // リトライ可能なエラーかチェック
                if (!this.isRetryableError(error)) {
                    throw error;
                }

                // 指数バックオフ
                const delay = Math.min(
                    this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
                    this.retryConfig.maxDelay
                );

                console.warn(`AI API試行 ${attempt} 失敗、${delay}ms後にリトライ:`, error.message);
                await this.sleep(delay);
            }
        }

        throw new Error(`AI API呼び出しが${this.retryConfig.maxRetries}回失敗しました: ${lastError.message}`);
    }

    isRetryableError(error) {
        const retryableCodes = [
            'RATE_LIMIT_EXCEEDED',
            'NETWORK_ERROR',
            'TIMEOUT',
            'SERVER_ERROR'
        ];

        return retryableCodes.includes(error.code) ||
               error.status >= 500 ||
               error.message.includes('timeout');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### レート制限対応
```javascript
class RateLimiter {
    constructor(requestsPerSecond = 3) {
        this.requestsPerSecond = requestsPerSecond;
        this.requests = [];
    }

    async throttle() {
        const now = Date.now();

        // 1秒以内のリクエストをフィルタ
        this.requests = this.requests.filter(time => now - time < 1000);

        if (this.requests.length >= this.requestsPerSecond) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = 1000 - (now - oldestRequest);

            if (waitTime > 0) {
                console.log(`レート制限により${waitTime}ms待機`);
                await this.sleep(waitTime);
            }
        }

        this.requests.push(now);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

## 品質保証

### 生成コンテンツ検証
```javascript
class ContentValidator {
    static validate(content, requirements) {
        const issues = [];

        // 文字数チェック
        if (content.length < requirements.minLength) {
            issues.push(`文字数不足: ${content.length}文字 (最小: ${requirements.minLength}文字)`);
        }

        // キーワード密度チェック
        const keywordDensity = this.calculateKeywordDensity(content, requirements.keywords);
        if (keywordDensity < 1 || keywordDensity > 4) {
            issues.push(`キーワード密度が範囲外: ${keywordDensity.toFixed(1)}% (推奨: 1-4%)`);
        }

        // 見出し構造チェック
        const headings = this.extractHeadings(content);
        if (headings.length < 3) {
            issues.push('見出しが不足しています（最低3個必要）');
        }

        // 重複コンテンツチェック
        if (this.hasDuplicateContent(content)) {
            issues.push('重複する内容が検出されました');
        }

        return {
            isValid: issues.length === 0,
            issues,
            score: Math.max(0, 100 - (issues.length * 20))
        };
    }

    static calculateKeywordDensity(content, keywords) {
        const words = content.toLowerCase().split(/\s+/);
        const keywordCount = keywords.reduce((count, keyword) => {
            return count + (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        }, 0);

        return (keywordCount / words.length) * 100;
    }

    static extractHeadings(content) {
        return content.match(/^#{1,6}\s+.+$/gm) || [];
    }

    static hasDuplicateContent(content) {
        const sentences = content.split(/[.!?]+/);
        const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));

        return sentences.length - uniqueSentences.size > sentences.length * 0.1;
    }
}
```

### A/Bテスト機能
```javascript
class AIProviderTester {
    constructor() {
        this.testResults = new Map();
    }

    async compareProviders(prompt, providers = ['deepseek', 'openai']) {
        const results = {};

        for (const provider of providers) {
            const startTime = Date.now();

            try {
                const content = await this.generateWithProvider(provider, prompt);
                const quality = ContentValidator.validate(content, {
                    minLength: 1000,
                    keywords: ['AI', '技術'],
                });

                results[provider] = {
                    success: true,
                    content,
                    quality: quality.score,
                    responseTime: Date.now() - startTime,
                    cost: this.estimateCost(provider, content.length)
                };
            } catch (error) {
                results[provider] = {
                    success: false,
                    error: error.message,
                    responseTime: Date.now() - startTime
                };
            }
        }

        return this.analyzeResults(results);
    }

    analyzeResults(results) {
        const analysis = {
            bestProvider: null,
            bestScore: 0,
            comparison: results
        };

        for (const [provider, result] of Object.entries(results)) {
            if (result.success) {
                const score = this.calculateOverallScore(result);
                if (score > analysis.bestScore) {
                    analysis.bestScore = score;
                    analysis.bestProvider = provider;
                }
            }
        }

        return analysis;
    }

    calculateOverallScore(result) {
        // 品質50%、速度30%、コスト20%の重み付け
        const qualityScore = result.quality;
        const speedScore = Math.max(0, 100 - (result.responseTime / 100));
        const costScore = Math.max(0, 100 - (result.cost * 1000));

        return (qualityScore * 0.5) + (speedScore * 0.3) + (costScore * 0.2);
    }
}
```

## 監視・分析

### パフォーマンス監視
```javascript
class AIPerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            totalResponseTime: 0,
            totalCost: 0
        };
    }

    recordRequest(provider, success, responseTime, cost = 0) {
        this.metrics.requests++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.totalCost += cost;

        if (success) {
            this.metrics.successes++;
        } else {
            this.metrics.failures++;
        }

        // Supabaseに記録
        this.logMetrics(provider, success, responseTime, cost);
    }

    getStats() {
        return {
            successRate: (this.metrics.successes / this.metrics.requests) * 100,
            averageResponseTime: this.metrics.totalResponseTime / this.metrics.requests,
            totalCost: this.metrics.totalCost,
            requestCount: this.metrics.requests
        };
    }

    async logMetrics(provider, success, responseTime, cost) {
        await supabase.from('ai_metrics').insert({
            provider,
            success,
            response_time: responseTime,
            cost,
            timestamp: new Date().toISOString()
        });
    }
}
```

### コスト分析
```javascript
class CostAnalyzer {
    static async generateReport(startDate, endDate) {
        const { data: logs } = await supabase
            .from('generation_logs')
            .select('*')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        const report = {
            totalCost: 0,
            byProvider: {},
            byOperation: {},
            recommendations: []
        };

        logs.forEach(log => {
            report.totalCost += log.cost_estimate || 0;

            // プロバイダー別集計
            if (!report.byProvider[log.ai_provider]) {
                report.byProvider[log.ai_provider] = { cost: 0, requests: 0 };
            }
            report.byProvider[log.ai_provider].cost += log.cost_estimate || 0;
            report.byProvider[log.ai_provider].requests++;

            // 操作別集計
            if (!report.byOperation[log.operation_type]) {
                report.byOperation[log.operation_type] = { cost: 0, requests: 0 };
            }
            report.byOperation[log.operation_type].cost += log.cost_estimate || 0;
            report.byOperation[log.operation_type].requests++;
        });

        // 最適化提案
        report.recommendations = this.generateRecommendations(report);

        return report;
    }

    static generateRecommendations(report) {
        const recommendations = [];

        // DeepSeek使用率チェック
        const deepseekRatio = (report.byProvider.deepseek?.requests || 0) /
                             Object.values(report.byProvider).reduce((sum, p) => sum + p.requests, 0);

        if (deepseekRatio < 0.8) {
            recommendations.push('DeepSeek APIの使用率を上げることで、コストを大幅に削減できます');
        }

        // 高コスト操作の特定
        const highCostOps = Object.entries(report.byOperation)
            .filter(([_, data]) => data.cost > report.totalCost * 0.3)
            .map(([op, _]) => op);

        if (highCostOps.length > 0) {
            recommendations.push(`高コスト操作の最適化を検討してください: ${highCostOps.join(', ')}`);
        }

        return recommendations;
    }
}
```

このベストプラクティスに従うことで、コスト効率的で高品質なAI統合を実現できます。
