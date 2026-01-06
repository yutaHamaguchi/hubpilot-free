/**
 * ContentGenerator - AI処理をシミュレートし、コンテンツを生成
 */
class ContentGenerator {
    constructor() {
        this.isGenerating = false;
        this.generationState = null;
        this.supabaseIntegration = null;
        this.notificationService = null;
        this.progressManager = null; // 進捗管理機能を追加
        this.performanceMonitor = window.performanceMonitor; // パフォーマンス監視
        this.resourceManager = window.resourceManager; // リソース管理
    }

    /**
     * 依存関係を設定
     */
    setDependencies(generationState, supabaseIntegration, notificationService, progressManager = null) {
        this.generationState = generationState;
        this.supabaseIntegration = supabaseIntegration;
        this.notificationService = notificationService;
        this.progressManager = progressManager; // ProgressManagerを設定
    }

    /**
     * テーマからピラーページとクラスターページのタイトル生成
     */
    async generateStructure(theme) {
        if (!theme || theme.trim().length === 0) {
            throw new Error('テーマが指定されていません');
        }

        // パフォーマンス監視付きで実行
        return await this.performanceMonitor.trackOperation('構造生成', async () => {
            this.notificationService?.show('構成案を生成中...', 'info');

            // Supabase統合が利用可能な場合は実際のAI生成を使用
            if (this.supabaseIntegration && await this.supabaseIntegration.isConfigured()) {
                return await this.generateStructureWithAI(theme);
            } else {
                return await this.generateStructureMock(theme);
            }
        }, { timeout: 45000 }); // 45秒タイムアウト
    }

    /**
     * AI APIを使用した構造生成
     */
    async generateStructureWithAI(theme) {
        try {
            const result = await this.supabaseIntegration.generateStructure(theme);
            this.notificationService?.show('構成案の生成が完了しました！次のステップに進みます...', 'success');
            return result;
        } catch (error) {
            console.error('AI構造生成エラー:', error);
            this.notificationService?.show('AI生成に失敗しました。モック生成に切り替えます', 'warning');
            return await this.generateStructureMock(theme);
        }
    }

    /**
     * モック構造生成
     */
    async generateStructureMock(theme) {
        // 生成遅延をシミュレート
        await this.delay(2000);

        const pillarPage = {
            title: `${theme}完全ガイド`,
            summary: `${theme}に関する包括的なガイドです。基本概念から実践的な手法まで、${theme}のすべてを網羅しています。`,
            content: '',
            internalLinks: []
        };

        const clusterPages = this.generateClusterPageTitles(theme);

        this.notificationService?.show('構成案の生成が完了しました！次のステップに進みます...', 'success');

        return {
            pillarPage,
            clusterPages
        };
    }

    /**
     * クラスターページのタイトルを生成
     */
    generateClusterPageTitles(theme) {
        const templates = [
            `${theme}の基本概念と重要性`,
            `${theme}を始めるための準備`,
            `${theme}の効果的な戦略`,
            `${theme}のベストプラクティス`,
            `${theme}でよくある間違いと対策`,
            `${theme}の成功事例と分析`,
            `${theme}の最新トレンド`,
            `${theme}のツールと技術`,
            `${theme}の測定と改善方法`,
            `${theme}の将来展望`
        ];

        return templates.map((title, index) => ({
            id: `cluster-${index + 1}`,
            title: title,
            summary: `${title}について詳しく解説します。`,
            wordCount: 0,
            qualityStatus: '未生成'
        }));
    }

    /**
     * クラスターページの見出し生成
     */
    async generateHeadings(clusterPages) {
        if (!clusterPages || clusterPages.length === 0) {
            throw new Error('クラスターページが指定されていません');
        }

        this.notificationService?.show('見出し構成を生成中...', 'info');

        // Supabase統合が利用可能な場合は実際のAI生成を使用
        if (this.supabaseIntegration && await this.supabaseIntegration.isConfigured()) {
            return await this.generateHeadingsWithAI(clusterPages);
        } else {
            return await this.generateHeadingsMock(clusterPages);
        }
    }

    /**
     * AI APIを使用した見出し生成
     */
    async generateHeadingsWithAI(clusterPages) {
        try {
            const headings = {};

            for (const page of clusterPages) {
                const result = await this.supabaseIntegration.generateHeadings(page.title);
                headings[page.id] = result.headings;
            }

            this.notificationService?.show('見出し構成の生成が完了しました', 'success');
            return headings;
        } catch (error) {
            console.error('AI見出し生成エラー:', error);
            this.notificationService?.show('AI生成に失敗しました。モック生成に切り替えます', 'warning');
            return await this.generateHeadingsMock(clusterPages);
        }
    }

    /**
     * モック見出し生成
     */
    async generateHeadingsMock(clusterPages) {
        await this.delay(1500);

        const headings = {};

        clusterPages.forEach(page => {
            headings[page.id] = this.generateHeadingsForPage(page.title);
        });

        this.notificationService?.show('見出し構成の生成が完了しました', 'success');
        return headings;
    }

    /**
     * 単一ページの見出しを生成
     */
    generateHeadingsForPage(title) {
        const baseHeadings = [
            '概要と重要性',
            '基本的な考え方',
            '実践的な手法',
            '成功のポイント'
        ];

        return baseHeadings.map((heading, index) => ({
            id: `h${index + 1}`,
            text: `${heading}`,
            level: 2
        }));
    }

    /**
     * 記事本文の生成（進捗付き）
     */
    async generateArticles(pages, progressCallback) {
        if (!pages || pages.length === 0) {
            throw new Error('生成対象のページが指定されていません');
        }

        // リソース管理に操作を登録
        const operationId = `article-generation-${Date.now()}`;
        this.resourceManager.registerOperation(operationId, {
            type: 'article-generation',
            pageCount: pages.length,
            abortController: new AbortController()
        });

        // パフォーマンス監視付きで実行
        return await this.performanceMonitor.trackOperation('記事生成', async () => {
            this.isGenerating = true;

            // 進捗管理開始
            if (this.progressManager) {
                this.progressManager.start(
                    pages.length,
                    progressCallback, // 進捗更新コールバック
                    (completionData) => { // 完了コールバック
                        console.log('記事生成完了:', completionData);
                        this.notificationService?.show('すべての記事の生成が完了しました', 'success');
                    },
                    (errorData) => { // エラーコールバック
                        console.error('進捗管理エラー:', errorData);
                        this.notificationService?.show(`進捗管理エラー: ${errorData.message}`, 'error');
                    }
                );
            }

            // 従来の生成状態管理も維持（後方互換性）
            if (this.generationState) {
                this.generationState.start(pages.length);
            }

            const articles = [];

            try {
                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];

                    // 進捗管理更新（開始時）
                    if (this.progressManager) {
                        this.progressManager.updateProgress(i, page.title);
                    }

                    // 従来の進捗コールバック実行（後方互換性）
                    this.executeProgressCallback(progressCallback, i + 1, pages.length, page.title);

                    // 記事生成（フォールバック付き）
                    const article = await this.generateSingleArticleWithFallback(page);
                    articles.push(article);

                    // 生成状態更新（従来の方式）
                    if (this.generationState) {
                        this.generationState.updateProgress(i + 1, pages.length);
                    }

                    // 進捗管理更新（完了後）
                    if (this.progressManager) {
                        this.progressManager.updateProgress(i + 1, '');
                    }
                }

                // 完了処理
                if (this.generationState) {
                    this.generationState.complete();
                }

                // 進捗管理は自動的に完了する（updateProgressで100%になったとき）
                if (!this.progressManager) {
                    this.notificationService?.show('すべての記事の生成が完了しました', 'success');
                }

                return articles;

            } catch (error) {
                // エラー処理
                if (this.generationState) {
                    this.generationState.error(error.message);
                }

                if (this.progressManager) {
                    this.progressManager.handleError('記事生成中にエラーが発生しました');
                }

                console.error('記事生成プロセスエラー:', error);
                throw error;
            } finally {
                this.isGenerating = false;
                // リソース管理から操作を解放
                this.resourceManager.unregisterOperation(operationId);
            }
        }, { timeout: 300000 }); // 5分タイムアウト
    }

    /**
     * 単一記事生成（フォールバック付き）
     */
    async generateSingleArticleWithFallback(page) {
        try {
            // AI生成を試行
            if (this.supabaseIntegration && await this.supabaseIntegration.isConfigured()) {
                return await this.generateArticleWithAI(page);
            } else {
                console.log('Supabase未設定のため、モック生成を使用:', page.title);
                return await this.generateArticleMock(page);
            }
        } catch (error) {
            console.warn(`AI生成失敗、モック生成にフォールバック: ${page.title}`, error);
            return await this.generateArticleMock(page);
        }
    }

    /**
     * 進捗コールバック実行
     */
    executeProgressCallback(callback, current, total, currentPage) {
        if (typeof callback === 'function') {
            try {
                callback({
                    current,
                    total,
                    currentPage,
                    progress: (current / total) * 100
                });
            } catch (error) {
                console.error('進捗コールバックエラー:', error);
            }
        }
    }

    /**
     * AI APIを使用した記事生成
     */
    async generateArticleWithAI(page) {
        try {
            const result = await this.supabaseIntegration.generateArticle({
                title: page.title,
                headings: page.headings || [],
                targetWordCount: 2000
            });

            return {
                id: page.id,
                title: page.title,
                content: result.content,
                wordCount: result.wordCount,
                qualityStatus: 'AI生成完了',
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error(`記事生成エラー (${page.title}):`, error);
            // エラー時はモック生成にフォールバック
            return await this.generateArticleMock(page);
        }
    }

    /**
     * モック記事生成
     */
    async generateArticleMock(page) {
        // 生成時間をシミュレート（2-5秒）
        const delay = Math.random() * 3000 + 2000;
        await this.delay(delay);

        const wordCount = Math.floor(Math.random() * 400) + 1800; // 1800-2200文字

        const content = this.generateMockContent(page.title, wordCount);

        return {
            id: page.id,
            title: page.title,
            content: content,
            wordCount: wordCount,
            qualityStatus: 'モック生成完了',
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * モックコンテンツを生成
     */
    generateMockContent(title, targetWordCount) {
        const paragraphs = [
            `${title}は、現代のビジネス環境において重要な要素の一つです。`,
            `この分野における基本的な理解を深めることで、より効果的な戦略を立てることができます。`,
            `実践的なアプローチを通じて、具体的な成果を上げることが可能になります。`,
            `多くの企業がこの手法を採用し、顕著な改善を実現しています。`,
            `継続的な学習と改善により、長期的な成功を収めることができるでしょう。`
        ];

        let content = '';
        let currentWordCount = 0;

        while (currentWordCount < targetWordCount) {
            const paragraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
            content += paragraph + '\n\n';
            currentWordCount += paragraph.length;
        }

        return content.trim();
    }

    /**
     * 品質チェックの実行
     */
    async performQualityCheck(articles) {
        if (!articles || articles.length === 0) {
            throw new Error('品質チェック対象の記事がありません');
        }

        this.notificationService?.show('品質チェックを実行中...', 'info');

        // Supabase統合が利用可能な場合は実際のAI分析を使用
        if (this.supabaseIntegration && await this.supabaseIntegration.isConfigured()) {
            return await this.performQualityCheckWithAI(articles);
        } else {
            return await this.performQualityCheckMock(articles);
        }
    }

    /**
     * AI APIを使用した品質チェック
     */
    async performQualityCheckWithAI(articles) {
        try {
            const qualityChecks = [];

            for (const article of articles) {
                const result = await this.supabaseIntegration.checkQuality(article);
                qualityChecks.push({
                    articleId: article.id,
                    title: article.title,
                    ...result
                });
            }

            this.notificationService?.show('品質チェックが完了しました', 'success');
            return qualityChecks;
        } catch (error) {
            console.error('AI品質チェックエラー:', error);
            this.notificationService?.show('AI分析に失敗しました。基本チェックに切り替えます', 'warning');
            return await this.performQualityCheckMock(articles);
        }
    }

    /**
     * モック品質チェック
     */
    async performQualityCheckMock(articles) {
        await this.delay(2000);

        const qualityChecks = articles.map(article => {
            const score = Math.floor(Math.random() * 30) + 70; // 70-100点
            const status = score >= 85 ? '良好' : score >= 70 ? '要改善' : '要修正';

            return {
                articleId: article.id,
                title: article.title,
                score: score,
                status: status,
                checks: this.generateQualityCheckItems(article, score),
                checkedAt: new Date().toISOString()
            };
        });

        this.notificationService?.show('品質チェックが完了しました', 'success');
        return qualityChecks;
    }

    /**
     * 品質チェック項目を生成
     */
    generateQualityCheckItems(article, score) {
        const checks = [
            {
                name: '文字数',
                status: article.wordCount >= 1800 && article.wordCount <= 2200 ? 'OK' : '要確認',
                value: `${article.wordCount}文字`
            },
            {
                name: 'SEO最適化',
                status: score >= 80 ? 'OK' : '要改善',
                value: `${Math.floor(score * 0.8)}点`
            },
            {
                name: '可読性',
                status: score >= 75 ? 'OK' : '要改善',
                value: `${Math.floor(score * 0.9)}点`
            },
            {
                name: '構造',
                status: 'OK',
                value: '適切'
            }
        ];

        return checks;
    }

    /**
     * ピラーページの生成
     */
    async generatePillarPage(clusterPages) {
        if (!clusterPages || clusterPages.length === 0) {
            throw new Error('クラスターページが指定されていません');
        }

        this.notificationService?.show('ピラーページを生成中...', 'info');

        // Supabase統合が利用可能な場合は実際のAI生成を使用
        if (this.supabaseIntegration && await this.supabaseIntegration.isConfigured()) {
            return await this.generatePillarPageWithAI(clusterPages);
        } else {
            return await this.generatePillarPageMock(clusterPages);
        }
    }

    /**
     * AI APIを使用したピラーページ生成
     */
    async generatePillarPageWithAI(clusterPages) {
        try {
            const result = await this.supabaseIntegration.generatePillarPage(clusterPages);
            this.notificationService?.show('ピラーページの生成が完了しました', 'success');
            return result;
        } catch (error) {
            console.error('AIピラーページ生成エラー:', error);
            this.notificationService?.show('AI生成に失敗しました。モック生成に切り替えます', 'warning');
            return await this.generatePillarPageMock(clusterPages);
        }
    }

    /**
     * モックピラーページ生成
     */
    async generatePillarPageMock(clusterPages) {
        await this.delay(3000);

        const internalLinks = clusterPages.map(page => ({
            title: page.title,
            url: `#${page.id}`,
            description: page.summary
        }));

        const content = this.generatePillarPageContent(clusterPages);

        this.notificationService?.show('ピラーページの生成が完了しました', 'success');

        return {
            content: content,
            internalLinks: internalLinks,
            wordCount: content.length,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * ピラーページのコンテンツを生成
     */
    generatePillarPageContent(clusterPages) {
        let content = '# 包括的ガイド\n\n';
        content += 'このガイドでは、以下のトピックについて詳しく解説します。\n\n';

        clusterPages.forEach((page, index) => {
            content += `## ${index + 1}. ${page.title}\n\n`;
            content += `${page.summary}\n\n`;
        });

        content += '## まとめ\n\n';
        content += 'これらの要素を組み合わせることで、効果的な戦略を構築できます。';

        return content;
    }

    /**
     * 生成の一時停止
     */
    pauseGeneration() {
        if (this.generationState) {
            this.generationState.pause();
        }
    }

    /**
     * 生成の再開
     */
    resumeGeneration() {
        if (this.generationState) {
            this.generationState.resume();
        }
    }

    /**
     * 生成のキャンセル
     */
    cancelGeneration() {
        if (this.generationState) {
            this.generationState.cancel();
        }
        this.isGenerating = false;
    }

    /**
     * 生成状態を取得
     */
    getGenerationStatus() {
        if (this.generationState) {
            return this.generationState.getStatus();
        }
        return { isGenerating: this.isGenerating };
    }

    /**
     * 遅延ユーティリティ
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// グローバルに公開
window.ContentGenerator = ContentGenerator;
