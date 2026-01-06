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

        // Phase 7-8で追加された新しいコンポーネント
        this.performanceMonitor = window.performanceMonitor || null;
        this.resourceManager = window.resourceManager || null;
        this.dataValidator = window.dataValidator || null;
        this.logger = window.logger || null;
        this.progressManager = window.progressManager || null;

        // テストスイート
        this.developerTestSuite = new DeveloperTestSuite();
        this.integrationTestSuite = new IntegrationTestSuite();

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

        // 新しいコンポーネントの依存関係設定
        if (this.developerTestSuite) {
            this.developerTestSuite.setDependencies(
                this.contentGenerator,
                window.supabaseIntegration,
                this.progressManager,
                this.errorHandler
            );
        }

        if (this.integrationTestSuite) {
            this.integrationTestSuite.setDependencies(
                this,
                this.contentGenerator,
                window.supabaseIntegration,
                this.progressManager,
                this.errorHandler
            );
        }
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
        if (this.authManager && typeof this.authManager.initialize === 'function') {
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
        // DOM要素が存在するまで待機（複数回試行）
        const bindEventsWithRetry = (attempts = 0) => {
            const maxAttempts = 10;

            try {
                // ナビゲーションボタン
                this.bindNavigationEvents();

                // ステップ固有のイベント
                this.bindStepEvents();

                // ブラウザイベント
                this.bindBrowserEvents();

                console.log('✅ イベントバインディング完了');
            } catch (error) {
                console.warn(`⚠️ イベントバインディング試行 ${attempts + 1}/${maxAttempts} 失敗:`, error);

                if (attempts < maxAttempts - 1) {
                    setTimeout(() => bindEventsWithRetry(attempts + 1), 200);
                } else {
                    console.error('❌ イベントバインディングが最大試行回数に達しました');
                }
            }
        };

        // 初回実行
        setTimeout(() => bindEventsWithRetry(), 100);
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

        // イベント委譲を使用して動的に生成されるボタンも捕捉
        document.addEventListener('click', (e) => {
            // 「この構成で進める」ボタン
            if (e.target.id === 'proceed-to-headings-btn' || e.target.closest('#proceed-to-headings-btn')) {
                e.preventDefault();
                console.log('🔘 「この構成で進める」ボタンがクリックされました');

                // 構成データの検証
                const currentData = this.wizardController.data;
                if (!currentData.pillarPage || !currentData.clusterPages || currentData.clusterPages.length === 0) {
                    this.notificationService.show('構成データが不完全です。構成案を生成してください。', 'error');
                    return;
                }

                // 次のステップ（見出し構成）に移動
                this.wizardController.nextStep();
                return;
            }

            // 「記事執筆を開始」ボタン
            if (e.target.id === 'start-writing-btn' || e.target.closest('#start-writing-btn')) {
                e.preventDefault();
                console.log('🔘 「記事執筆を開始」ボタンがクリックされました');

                // 見出しデータの検証
                const currentData = this.wizardController.data;
                if (!currentData.headings || Object.keys(currentData.headings).length === 0) {
                    this.notificationService.show('見出し構成が設定されていません。', 'error');
                    return;
                }

                // 次のステップ（記事執筆）に移動
                this.wizardController.nextStep();
                return;
            }

            // その他の動的ボタンも同様に処理
        });
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

                    // ボタンを無効化して重複実行を防止
                    generateBtn.disabled = true;
                    generateBtn.textContent = '生成中...';

                    await this.wizardController.generateStructure();

                    // ボタンを元に戻す
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = `
                        <span class="btn-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        </span>
                        構成案を作成
                    `;
                } catch (error) {
                    // エラー時もボタンを元に戻す
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = `
                        <span class="btn-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        </span>
                        構成案を作成
                    `;

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

        // 「この構成で進める」ボタン
        const proceedBtn = document.getElementById('proceed-to-headings-btn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                // 構成データの検証
                const currentData = this.wizardController.data;
                if (!currentData.pillarPage || !currentData.clusterPages || currentData.clusterPages.length === 0) {
                    this.notificationService.show('構成データが不完全です。構成案を生成してください。', 'error');
                    return;
                }

                // 次のステップ（見出し構成）に移動
                this.wizardController.nextStep();
            });
        }

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
                const pages = this.wizardController.data?.clusterPages || [];

                if (pages.length === 0) {
                    this.notificationService.show('生成対象のページがありません', 'warning');
                    return;
                }

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
                const articles = this.wizardController.data?.articles || [];

                if (articles.length === 0) {
                    this.notificationService.show('品質チェック対象の記事がありません', 'warning');
                    return;
                }

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

            // 新しいテスト機能
            testDeveloper: () => this.runDeveloperTests(),
            testIntegration: () => this.runIntegrationTests(),
            testAll: () => this.runAllTests(),

            // パフォーマンス監視
            performance: () => this.performanceMonitor ? this.performanceMonitor.showPerformanceReport() : 'PerformanceMonitor未利用',
            resources: () => this.resourceManager ? this.resourceManager.logResourceStats() : 'ResourceManager未利用',

            // ユーティリティ
            export: () => this.exportData(),
            import: (data) => this.importData(data),
            reset: () => this.wizardController.resetData(),

            // ボタン修復
            fixButtons: () => this.fixButtonEvents(),

            // 内部アクセス（開発用）
            _app: this,
            _wizard: this.wizardController,
            _generator: this.contentGenerator,
            _ui: this.uiRenderer,
            _performance: this.performanceMonitor,
            _resources: this.resourceManager,
            _testDev: this.developerTestSuite,
            _testIntegration: this.integrationTestSuite
        };

        // ボタン修復関数をグローバルに公開
        window.fixCreateNewConfigButton = () => this.fixButtonEvents();
    }

    /**
     * ボタンイベントを修復
     */
    fixButtonEvents() {
        console.log('🔧 ボタンイベントを修復中...');

        // 「この構成で進める」ボタンの修復
        const proceedBtn = document.getElementById('proceed-to-headings-btn');
        if (proceedBtn) {
            // 既存のイベントリスナーを削除
            const newBtn = proceedBtn.cloneNode(true);
            proceedBtn.parentNode.replaceChild(newBtn, proceedBtn);

            // 新しいイベントリスナーを追加
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 修復された「この構成で進める」ボタンがクリックされました');

                // 構成データの検証
                const currentData = this.wizardController.data;
                if (!currentData.pillarPage || !currentData.clusterPages || currentData.clusterPages.length === 0) {
                    this.notificationService.show('構成データが不完全です。構成案を生成してください。', 'error');
                    return;
                }

                // 次のステップ（見出し構成）に移動
                this.wizardController.nextStep();
            });

            console.log('✅ 「この構成で進める」ボタンを修復しました');
        } else {
            console.warn('⚠️ 「この構成で進める」ボタンが見つかりません');
        }

        // 「記事執筆を開始」ボタンの修復
        const startWritingBtn = document.getElementById('start-writing-btn');
        if (startWritingBtn) {
            const newBtn = startWritingBtn.cloneNode(true);
            startWritingBtn.parentNode.replaceChild(newBtn, startWritingBtn);

            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 修復された「記事執筆を開始」ボタンがクリックされました');

                // 見出しデータの検証
                const currentData = this.wizardController.data;
                if (!currentData.headings || Object.keys(currentData.headings).length === 0) {
                    this.notificationService.show('見出し構成が設定されていません。', 'error');
                    return;
                }

                // 次のステップ（記事執筆）に移動
                this.wizardController.nextStep();
            });

            console.log('✅ 「記事執筆を開始」ボタンを修復しました');
        }

        // その他の重要なボタンも修復
        this.fixOtherButtons();

        return '✅ ボタンイベントの修復が完了しました';
    }

    /**
     * その他のボタンを修復
     */
    fixOtherButtons() {
        // 構成案生成ボタン
        const generateBtn = document.getElementById('generate-structure-btn');
        if (generateBtn && !generateBtn.hasAttribute('data-fixed')) {
            generateBtn.setAttribute('data-fixed', 'true');
            generateBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const themeInput = document.getElementById('theme-input');
                const theme = themeInput ? themeInput.value.trim() : '';

                if (!theme) {
                    this.notificationService.show('テーマを入力してください', 'error');
                    return;
                }

                // ボタンを無効化
                generateBtn.disabled = true;
                generateBtn.textContent = '生成中...';

                try {
                    await this.wizardController.generateStructure();

                    // ボタンを元に戻す
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = `
                        <span class="btn-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        </span>
                        構成案を作成
                    `;
                } catch (error) {
                    // エラー時もボタンを元に戻す
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = `
                        <span class="btn-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        </span>
                        構成案を作成
                    `;

                    this.errorHandler.handle(error, 'structure-generation', {
                        customMessage: '構造の生成に失敗しました',
                        notify: true
                    });
                }
            });
        }

        // ナビゲーションボタン
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');

        if (nextBtn && !nextBtn.hasAttribute('data-fixed')) {
            nextBtn.setAttribute('data-fixed', 'true');
            nextBtn.addEventListener('click', () => {
                this.wizardController.nextStep();
            });
        }

        if (prevBtn && !prevBtn.hasAttribute('data-fixed')) {
            prevBtn.setAttribute('data-fixed', 'true');
            prevBtn.addEventListener('click', () => {
                this.wizardController.previousStep();
            });
        }
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

        results.forEach(result => {
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
        return this.getHealthCheck();
    }

    /**
     * 開発者テストを実行
     */
    async runDeveloperTests() {
        console.log('🚀 開発者テストスイート実行開始');

        if (!this.developerTestSuite) {
            console.error('❌ DeveloperTestSuiteが利用できません');
            return { success: false, error: 'DeveloperTestSuiteが初期化されていません' };
        }

        try {
            const result = await this.developerTestSuite.runAllTests();
            console.log('✅ 開発者テストスイート完了');
            return result;
        } catch (error) {
            console.error('❌ 開発者テスト実行中にエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 統合テストを実行
     */
    async runIntegrationTests() {
        console.log('🚀 統合テストスイート実行開始');

        if (!this.integrationTestSuite) {
            console.error('❌ IntegrationTestSuiteが利用できません');
            return { success: false, error: 'IntegrationTestSuiteが初期化されていません' };
        }

        try {
            const result = await this.integrationTestSuite.runAllIntegrationTests();
            console.log('✅ 統合テストスイート完了');
            return result;
        } catch (error) {
            console.error('❌ 統合テスト実行中にエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 全テストを実行
     */
    async runAllTests() {
        console.log('🚀 ========== 全テストスイート実行開始 ==========');

        const startTime = performance.now();
        const results = {
            basic: null,
            developer: null,
            integration: null
        };

        try {
            // 1. 基本テスト
            console.log('\n1️⃣ 基本テスト実行');
            results.basic = this.runTests();

            // 2. 開発者テスト
            console.log('\n2️⃣ 開発者テスト実行');
            results.developer = await this.runDeveloperTests();

            // 3. 統合テスト
            console.log('\n3️⃣ 統合テスト実行');
            results.integration = await this.runIntegrationTests();

            const endTime = performance.now();
            const totalDuration = endTime - startTime;

            // 結果サマリー
            console.log('\n📊 ========== 全テスト結果サマリー ==========');
            console.log(`総実行時間: ${totalDuration.toFixed(2)}ms`);
            console.log(`基本テスト: ${results.basic.passed}/${results.basic.total}件成功`);
            console.log(`開発者テスト: ${results.developer.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`統合テスト: ${results.integration.success ? '✅ 成功' : '❌ 失敗'}`);

            const allSuccess = results.basic.passed === results.basic.total &&
                             results.developer.success &&
                             results.integration.success;

            if (allSuccess) {
                console.log('\n🎉 すべてのテストが成功しました！');
            } else {
                console.log('\n⚠️ 一部のテストが失敗しました。詳細を確認してください。');
            }
            console.log('===============================================');

            return {
                success: allSuccess,
                duration: totalDuration,
                results
            };

        } catch (error) {
            console.error('❌ 全テスト実行中にエラーが発生:', error);
            return {
                success: false,
                error: error.message,
                results
            };
        }
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
    /**
     * 開発者テストを実行
     */
    async runDeveloperTests() {
        console.log('🚀 開発者テストスイート実行開始');

        if (!this.developerTestSuite) {
            console.error('❌ DeveloperTestSuiteが利用できません');
            return { success: false, error: 'DeveloperTestSuiteが初期化されていません' };
        }

        try {
            const result = await this.developerTestSuite.runAllTests();
            console.log('✅ 開発者テストスイート完了');
            return result;
        } catch (error) {
            console.error('❌ 開発者テスト実行中にエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 統合テストを実行
     */
    async runIntegrationTests() {
        console.log('🚀 統合テストスイート実行開始');

        if (!this.integrationTestSuite) {
            console.error('❌ IntegrationTestSuiteが利用できません');
            return { success: false, error: 'IntegrationTestSuiteが初期化されていません' };
        }

        try {
            const result = await this.integrationTestSuite.runAllIntegrationTests();
            console.log('✅ 統合テストスイート完了');
            return result;
        } catch (error) {
            console.error('❌ 統合テスト実行中にエラー:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 全テストを実行
     */
    async runAllTests() {
        console.log('🚀 ========== 全テストスイート実行開始 ==========');

        const startTime = performance.now();
        const results = {
            basic: null,
            developer: null,
            integration: null
        };

        try {
            // 1. 基本テスト
            console.log('\n1️⃣ 基本テスト実行');
            results.basic = this.runTests();

            // 2. 開発者テスト
            console.log('\n2️⃣ 開発者テスト実行');
            results.developer = await this.runDeveloperTests();

            // 3. 統合テスト
            console.log('\n3️⃣ 統合テスト実行');
            results.integration = await this.runIntegrationTests();

            const endTime = performance.now();
            const totalDuration = endTime - startTime;

            // 結果サマリー
            console.log('\n📊 ========== 全テスト結果サマリー ==========');
            console.log(`総実行時間: ${totalDuration.toFixed(2)}ms`);
            console.log(`基本テスト: ${results.basic.passed}/${results.basic.total}件成功`);
            console.log(`開発者テスト: ${results.developer.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`統合テスト: ${results.integration.success ? '✅ 成功' : '❌ 失敗'}`);

            const allSuccess = results.basic.passed === results.basic.total &&
                             results.developer.success &&
                             results.integration.success;

            if (allSuccess) {
                console.log('\n🎉 すべてのテストが成功しました！');
            } else {
                console.log('\n⚠️ 一部のテストが失敗しました。詳細を確認してください。');
            }
            console.log('===============================================');

            return {
                success: allSuccess,
                duration: totalDuration,
                results
            };

        } catch (error) {
            console.error('❌ 全テスト実行中にエラーが発生:', error);
            return {
                success: false,
                error: error.message,
                results
            };
        }
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
