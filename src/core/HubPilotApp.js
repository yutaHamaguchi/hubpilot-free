/**
 * HubPilotApp - メインアプリケーションクラス（リファクタリング版）
 * 設計ドキュメントに基づいた4クラス構造を採用
 */
class HubPilotApp {
    constructor() {
        // 依存関係のインスタンス化
        this.initializeDependencies();

        // 初期化
        this.init();
    }

    /**
     * 依存関係を初期化
     */
    initializeDependencies() {
        // ユーティリティサービス
        this.storageService = new StorageService();
        this.notificationService = new NotificationService();
        this.errorHandler = new ErrorHandler();

        // コアサービス
        this.dataStore = new DataStore();
        this.generationState = new GenerationState();

        // UIサービス
        this.templateEngine = new TemplateEngine();
        this.uiRenderer = new UIRenderer();

        // メインコントローラー
        this.wizardController = new WizardController();
        this.contentGenerator = new ContentGenerator();

        // 依存関係の注入
        this.setupDependencies();

        // 外部統合（既存のコードとの互換性）
        this.setupExternalIntegrations();
    }

    /**
     * 依存関係を設定
     */
    setupDependencies() {
        // DataStoreの依存関係
        this.dataStore.setDependencies(this.storageService, this.notificationService);

        // GenerationStateの依存関係
        this.generationState.setDependencies(this.notificationService);

        // UIRendererの依存関係
        this.uiRenderer.setDependencies(this.templateEngine, this.notificationService, this.wizardController);

        // WizardControllerの依存関係
        this.wizardController.setDependencies(
            this.dataStore,
            this.uiRenderer,
            this.contentGenerator,
            this.notificationService
        );

        // ContentGeneratorの依存関係
        this.contentGenerator.setDependencies(
            this.generationState,
            window.supabaseIntegration, // 既存のSupabase統合
            this.notificationService
        );
    }

    /**
     * 外部統合を設定（既存コードとの互換性）
     */
    setupExternalIntegrations() {
        // 既存のSupabase統合
        if (window.supabaseIntegration) {
            this.supabaseIntegration = window.supabaseIntegration;
        }

        // 既存の認証管理
        if (window.authManager) {
            this.authManager = window.authManager;
        }

        // 既存のWordPress統合
        if (window.wordpressIntegration) {
            this.wordpressIntegration = window.wordpressIntegration;
        }

        // 既存の画像生成
        if (window.imageGeneration) {
            this.imageGeneration = window.imageGeneration;
        }
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        try {
            // エラーハンドリングの設定
            this.setupErrorHandling();

            // データの読み込み
            this.wizardController.loadData();

            // イベントの設定
            this.bindEvents();

            // キーボードショートカットの設定
            this.setupKeyboardShortcuts();

            // モバイル最適化
            this.setupMobileOptimizations();

            // パフォーマンス監視
            this.setupPerformanceMonitoring();

            // 開発者コマンド
            this.setupDeveloperCommands();

            // 自動保存
            this.setupAutoSave();

            // 外部統合の初期化
            await this.initializeExternalIntegrations();

            // UIの初期描画
            this.wizardController.renderCurrentStep();

            // 初期化完了
            this.hideLoading();
            this.notificationService.show('アプリケーションが準備完了しました', 'success', 3000);

        } catch (error) {
            this.errorHandler.handle(error, 'app-initialization', {
                customMessage: 'アプリケーションの初期化に失敗しました',
                notify: true,
                showDetails: true
            });
            this.hideLoading();
        }
    }

    /**
     * 外部統合を初期化
     */
    async initializeExternalIntegrations() {
        // Supabase統合の初期化
        if (this.supabaseIntegration) {
            try {
                await this.supabaseIntegration.initialize();
            } catch (error) {
                console.warn('Supabase統合の初期化に失敗:', error);
            }
        }

        // 認証管理の初期化
        if (this.authManager) {
            try {
                await this.authManager.initialize();
            } catch (error) {
                console.warn('認証管理の初期化に失敗:', error);
            }
        }
    }

    /**
     * エラーハンドリングを設定
     */
    setupErrorHandling() {
        // グローバルエラーハンドラー
        window.addEventListener('error', (event) => {
            this.errorHandler.handle(event.error, 'global-error', {
                notify: true,
                showDetails: false
            });
        });

        // Promise未処理エラーハンドラー
        window.addEventListener('unhandledrejection', (event) => {
            this.errorHandler.handle(event.reason, 'unhandled-promise', {
                notify: true,
                showDetails: false
            });
        });
    }

    /**
     * イベントを設定
     */
    bindEvents() {
        // DOM要素が存在するまで待機
        setTimeout(() => {
            // ナビゲーションボタン
            this.bindNavigationEvents();

            // ステップ固有のイベント
            this.bindStepEvents();

            // ブラウザイベント
            this.bindBrowserEvents();
        }, 100);
    }

    /**
     * ナビゲーションイベントを設定
     */
    bindNavigationEvents() {
        // 次へボタン
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.wizardController.nextStep();
            });
        }

        // 前へボタン
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.wizardController.previousStep();
            });
        }

        // ステップインジケーター
        document.querySelectorAll('.step').forEach((step, index) => {
            step.addEventListener('click', () => {
                this.wizardController.goToStep(index + 1);
            });
        });
    }

    /**
     * ステップ固有のイベントを設定
     */
    bindStepEvents() {
        // Step 1: テーマ入力
        this.bindStep1Events();

        // Step 2: 構造生成
        this.bindStep2Events();

        // Step 3: 見出し編集
        this.bindStep3Events();

        // Step 4: 記事生成
        this.bindStep4Events();

        // Step 5: 品質チェック
        this.bindStep5Events();

        // Step 6: 最終承認
        this.bindStep6Events();
    }

    /**
     * Step 1のイベントを設定
     */
    bindStep1Events() {
        // テーマ入力
        const themeInput = document.getElementById('theme-input');
        if (themeInput) {
            themeInput.addEventListener('input', (e) => {
                this.wizardController.saveData({ theme: e.target.value });

                // ボタンの有効/無効を切り替え
                const generateBtn = document.getElementById('generate-structure-btn');
                if (generateBtn) {
                    generateBtn.disabled = !e.target.value.trim();
                }
            });
        }

        // 構成案生成ボタン
        const generateBtn = document.getElementById('generate-structure-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                try {
                    const theme = themeInput ? themeInput.value.trim() : '';
                    if (!theme) {
                        this.notificationService.show('テーマを入力してください', 'error');
                        return;
                    }

                    await this.wizardController.generateStructure();
                } catch (error) {
                    this.errorHandler.handle(error, 'structure-generation', {
                        customMessage: '構造の生成に失敗しました',
                        notify: true
                    });
                }
            });
        }

        // テーマ例選択
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                if (themeInput && theme) {
                    themeInput.value = theme;
                    this.wizardController.saveData({ theme });

                    // ボタンを有効化
                    const generateBtn = document.getElementById('generate-structure-btn');
                    if (generateBtn) {
                        generateBtn.disabled = false;
                    }
                }
            });
        });

        // 文字数カウント
        if (themeInput) {
            const updateCharCount = () => {
                const charCountEl = document.getElementById('char-count');
                if (charCountEl) {
                    charCountEl.textContent = themeInput.value.length;
                }
            };

            themeInput.addEventListener('input', updateCharCount);
            updateCharCount(); // 初期値設定
        }
    }

    /**
     * Step 2のイベントを設定
     */
    bindStep2Events() {
        // 構造生成
        window.generateStructure = async () => {
            try {
                await this.wizardController.generateStructure();
            } catch (error) {
                this.errorHandler.handle(error, 'structure-generation', {
                    customMessage: '構造の生成に失敗しました',
                    notify: true
                });
            }
        };

        // ページ追加
        window.addNewPage = () => {
            const newPage = {
                id: `cluster-${Date.now()}`,
                title: '新しいページ',
                summary: 'ページの説明を入力してください',
                wordCount: 0,
                qualityStatus: '未生成'
            };

            const currentData = this.wizardController.data;
            currentData.clusterPages.push(newPage);
            this.wizardController.saveData(currentData);
            this.wizardController.renderCurrentStep();
        };

        // ページ削除
        window.removePage = (pageId) => {
            const currentData = this.wizardController.data;
            currentData.clusterPages = currentData.clusterPages.filter(page => page.id !== pageId);
            this.wizardController.saveData(currentData);
            this.wizardController.renderCurrentStep();
        };
    }

    /**
     * Step 3のイベントを設定
     */
    bindStep3Events() {
        // 見出し生成
        window.generateHeadings = async () => {
            try {
                await this.wizardController.generateHeadings();
            } catch (error) {
                this.errorHandler.handle(error, 'headings-generation', {
                    customMessage: '見出しの生成に失敗しました',
                    notify: true
                });
            }
        };

        // 見出し追加
        window.addHeading = (pageId) => {
            const currentData = this.wizardController.data;
            if (!currentData.headings[pageId]) {
                currentData.headings[pageId] = [];
            }

            currentData.headings[pageId].push({
                id: `h${Date.now()}`,
                text: '新しい見出し',
                level: 2
            });

            this.wizardController.saveData(currentData);
            this.wizardController.renderCurrentStep();
        };

        // 見出し削除
        window.removeHeading = (pageId, headingId) => {
            const currentData = this.wizardController.data;
            if (currentData.headings[pageId]) {
                currentData.headings[pageId] = currentData.headings[pageId].filter(h => h.id !== headingId);
                this.wizardController.saveData(currentData);
                this.wizardController.renderCurrentStep();
            }
        };
    }

    /**
     * Step 4のイベントを設定
     */
    bindStep4Events() {
        // 記事生成開始
        window.startGeneration = async () => {
            try {
                const pages = this.wizardController.data.clusterPages;

                // 進捗コールバック
                const progressCallback = (progress) => {
                    this.uiRenderer.updateProgress(
                        progress.current,
                        progress.total,
                        `生成中: ${progress.currentPage}`
                    );
                };

                // 生成実行
                const articles = await this.contentGenerator.generateArticles(pages, progressCallback);

                // データ保存
                this.wizardController.saveData({ articles });

                // UI更新
                this.wizardController.renderCurrentStep();

            } catch (error) {
                this.errorHandler.handle(error, 'article-generation', {
                    customMessage: '記事の生成に失敗しました',
                    notify: true
                });
            }
        };

        // 生成制御
        window.pauseGeneration = () => this.contentGenerator.pauseGeneration();
        window.resumeGeneration = () => this.contentGenerator.resumeGeneration();
        window.cancelGeneration = () => this.contentGenerator.cancelGeneration();

        // 記事詳細表示
        window.viewArticle = (articleId) => {
            const article = this.wizardController.data.articles.find(a => a.id === articleId);
            if (article) {
                this.showArticleModal(article);
            }
        };
    }

    /**
     * Step 5のイベントを設定
     */
    bindStep5Events() {
        // 品質チェック開始
        window.startQualityCheck = async () => {
            try {
                const articles = this.wizardController.data.articles;
                const qualityChecks = await this.contentGenerator.performQualityCheck(articles);

                this.wizardController.saveData({ qualityChecks });
                this.wizardController.renderCurrentStep();

            } catch (error) {
                this.errorHandler.handle(error, 'quality-check', {
                    customMessage: '品質チェックに失敗しました',
                    notify: true
                });
            }
        };
    }

    /**
     * Step 6のイベントを設定
     */
    bindStep6Events() {
        // プロジェクトダウンロード
        window.downloadProject = () => {
            try {
                this.downloadProjectData();
            } catch (error) {
                this.errorHandler.handle(error, 'project-download', {
                    customMessage: 'ダウンロードに失敗しました',
                    notify: true
                });
            }
        };

        // CMS投稿
        window.publishProject = () => {
            try {
                this.showPublishModal();
            } catch (error) {
                this.errorHandler.handle(error, 'project-publish', {
                    customMessage: '投稿に失敗しました',
                    notify: true
                });
            }
        };
    }

    /**
     * ブラウザイベントを設定
     */
    bindBrowserEvents() {
        // ページ離脱時の警告
        window.addEventListener('beforeunload', (e) => {
            if (this.wizardController.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '未保存の変更があります。ページを離れますか？';
            }
        });

        // オンライン/オフライン状態
        window.addEventListener('online', () => {
            this.notificationService.show('オンラインに復帰しました', 'success');
        });

        window.addEventListener('offline', () => {
            this.notificationService.show('オフラインモードです', 'warning');
        });
    }

    /**
     * キーボードショートカットを設定
     */
    setupKeyboardShortcuts() {
        // WizardControllerで既に設定済み

        // 追加のショートカット
        document.addEventListener('keydown', (e) => {
            // Ctrl + S で保存
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.dataStore.save(this.wizardController.data);
                this.notificationService.show('データを保存しました', 'success');
            }

            // Ctrl + Z でリセット（確認付き）
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                if (confirm('すべてのデータをリセットしますか？')) {
                    this.wizardController.resetData();
                }
            }
        });
    }

    /**
     * モバイル最適化を設定
     */
    setupMobileOptimizations() {
        // タッチジェスチャー
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 水平スワイプでステップ移動
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // 右スワイプ - 前のステップ
                    this.wizardController.previousStep();
                } else {
                    // 左スワイプ - 次のステップ
                    this.wizardController.nextStep();
                }
            }
        });
    }

    /**
     * パフォーマンス監視を設定
     */
    setupPerformanceMonitoring() {
        // パフォーマンス測定
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                }, 0);
            });
        }
    }

    /**
     * 開発者コマンドを設定
     */
    setupDeveloperCommands() {
        // グローバルオブジェクトとして公開
        window.hubpilot = {
            // データアクセス
            getData: () => this.wizardController.data,
            setData: (data) => this.wizardController.saveData(data),

            // ナビゲーション
            goToStep: (step) => this.wizardController.goToStep(step),
            getCurrentStep: () => this.wizardController.currentStep,

            // デバッグ
            debug: () => this.getDebugInfo(),
            stats: () => this.getStats(),
            health: () => this.getHealthCheck(),

            // テスト
            test: () => this.runTests(),
            quality: () => this.runQualityCheck(),

            // ユーティリティ
            export: () => this.exportData(),
            import: (data) => this.importData(data),
            reset: () => this.wizardController.resetData(),

            // 内部アクセス（開発用）
            _app: this,
            _wizard: this.wizardController,
            _generator: this.contentGenerator,
            _ui: this.uiRenderer
        };
    }

    /**
     * 自動保存を設定
     */
    setupAutoSave() {
        setInterval(() => {
            if (this.wizardController.hasUnsavedChanges()) {
                this.dataStore.save(this.wizardController.data);
            }
        }, 30000); // 30秒間隔
    }

    /**
     * 記事モーダルを表示
     */
    showArticleModal(article) {
        const modal = this.templateEngine.createArticleModal(article);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * 投稿モーダルを表示
     */
    showPublishModal() {
        // WordPress統合が利用可能な場合
        if (this.wordpressIntegration) {
            if (typeof openWordPressModal === 'function') {
                openWordPressModal();
            }
        } else {
            this.notificationService.show('CMS統合が設定されていません', 'warning');
        }
    }

    /**
     * プロジェクトデータをダウンロード
     */
    downloadProjectData() {
        const data = {
            ...this.wizardController.data,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `hubpilot-project-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        this.notificationService.show('プロジェクトをダウンロードしました', 'success');
    }

    /**
     * データをエクスポート
     */
    exportData() {
        return {
            data: this.wizardController.data,
            step: this.wizardController.currentStep,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * データをインポート
     */
    importData(importedData) {
        if (importedData.data) {
            this.wizardController.saveData(importedData.data);
        }
        if (importedData.step) {
            this.wizardController.goToStep(importedData.step);
        }
        this.notificationService.show('データをインポートしました', 'success');
    }

    /**
     * デバッグ情報を取得
     */
    getDebugInfo() {
        return {
            currentStep: this.wizardController.currentStep,
            dataSize: JSON.stringify(this.wizardController.data).length,
            hasUnsavedChanges: this.wizardController.hasUnsavedChanges(),
            generationStatus: this.contentGenerator.getGenerationStatus(),
            storageUsage: this.storageService.getStorageUsage(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 統計情報を取得
     */
    getStats() {
        const data = this.wizardController.data;
        return {
            theme: data.theme || 'なし',
            pillarPage: data.pillarPage ? '作成済み' : '未作成',
            clusterPages: (data.clusterPages || []).length,
            articles: (data.articles || []).length,
            qualityChecks: (data.qualityChecks || []).length,
            totalWordCount: this.calculateTotalWordCount()
        };
    }

    /**
     * ヘルスチェックを実行
     */
    getHealthCheck() {
        const checks = {
            dataStore: this.dataStore ? 'OK' : 'ERROR',
            storageService: this.storageService ? 'OK' : 'ERROR',
            wizardController: this.wizardController ? 'OK' : 'ERROR',
            contentGenerator: this.contentGenerator ? 'OK' : 'ERROR',
            uiRenderer: this.uiRenderer ? 'OK' : 'ERROR',
            supabaseIntegration: this.supabaseIntegration ? 'OK' : 'NOT_CONFIGURED'
        };

        const overallHealth = Object.values(checks).every(status => status === 'OK' || status === 'NOT_CONFIGURED') ? 'HEALTHY' : 'UNHEALTHY';

        return {
            overall: overallHealth,
            components: checks,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * テストを実行
     */
    runTests() {
        const results = [];

        // 基本機能テスト
        results.push(this.testBasicNavigation());
        results.push(this.testDataPersistence());
        results.push(this.testValidation());

        const passed = results.filter(r => r.passed).length;
        const total = results.length;

        console.log(`テスト結果: ${passed}/${total} 通過`);
        results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.message}`);
        });

        return { passed, total, results };
    }

    /**
     * 基本ナビゲーションテスト
     */
    testBasicNavigation() {
        try {
            const originalStep = this.wizardController.currentStep;

            // ステップ移動テスト
            this.wizardController.goToStep(2);
            if (this.wizardController.currentStep !== 2) {
                throw new Error('ステップ移動が失敗');
            }

            // 元に戻す
            this.wizardController.goToStep(originalStep);

            return { name: '基本ナビゲーション', passed: true, message: 'OK' };
        } catch (error) {
            return { name: '基本ナビゲーション', passed: false, message: error.message };
        }
    }

    /**
     * データ永続化テスト
     */
    testDataPersistence() {
        try {
            const testData = { theme: 'テストテーマ' };

            // データ保存
            this.wizardController.saveData(testData);

            // データ読み込み
            const savedData = this.dataStore.load();

            if (savedData.theme !== testData.theme) {
                throw new Error('データの保存・読み込みが失敗');
            }

            return { name: 'データ永続化', passed: true, message: 'OK' };
        } catch (error) {
            return { name: 'データ永続化', passed: false, message: error.message };
        }
    }

    /**
     * バリデーションテスト
     */
    testValidation() {
        try {
            // 空のテーマでバリデーション
            this.wizardController.data.theme = '';
            if (this.wizardController.validateStep(1)) {
                throw new Error('空のテーマがバリデーションを通過');
            }

            // 有効なテーマでバリデーション
            this.wizardController.data.theme = 'テストテーマ';
            if (!this.wizardController.validateStep(1)) {
                throw new Error('有効なテーマがバリデーションを通過しない');
            }

            return { name: 'バリデーション', passed: true, message: 'OK' };
        } catch (error) {
            return { name: 'バリデーション', passed: false, message: error.message };
        }
    }

    /**
     * 品質チェックを実行
     */
    runQualityCheck() {
        // 既存の品質チェック機能を使用
        console.log('品質チェックを実行中...');
        return this.getHealthCheck();
    }

    /**
     * 総文字数を計算
     */
    calculateTotalWordCount() {
        const data = this.wizardController.data;
        let total = 0;

        if (data.pillarPage && data.pillarPage.content) {
            total += data.pillarPage.content.length;
        }

        if (data.articles) {
            total += data.articles.reduce((sum, article) => sum + (article.wordCount || 0), 0);
        }

        return total;
    }

    /**
     * ローディングを非表示
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * データを更新（外部からの呼び出し用）
     */
    updateData(updates) {
        this.wizardController.saveData(updates);
    }

    /**
     * データを保存（外部からの呼び出し用）
     */
    saveData(data) {
        this.wizardController.saveData(data);
    }
}

// グローバルに公開
window.HubPilotApp = HubPilotApp;
