/**
 * HubPilotApp - 簡単版（デバッグ用）
 */
class HubPilotAppSimple {
    constructor() {
        console.log('🚀 HubPilotAppSimple constructor 開始');

        try {
            // 基本的な初期化のみ
            this.initialized = false;
            this.data = {
                theme: '',
                pillarPage: {},
                clusterPages: [],
                headings: {},
                articles: [],
                qualityChecks: []
            };

            console.log('✅ HubPilotAppSimple 基本プロパティ初期化完了');

            // 依存関係の初期化
            this.initializeDependencies();

            console.log('✅ HubPilotAppSimple constructor 完了');
        } catch (error) {
            console.error('❌ HubPilotAppSimple constructor エラー:', error);
            throw error;
        }
    }

    /**
     * 依存関係を初期化
     */
    initializeDependencies() {
        console.log('🔧 依存関係の初期化開始');

        try {
            // StorageServiceのテスト
            console.log('StorageService クラス:', typeof StorageService);
            if (typeof StorageService !== 'undefined') {
                this.storageService = new StorageService();
                console.log('✅ StorageService 初期化完了');
            } else {
                console.error('❌ StorageService が見つかりません');
            }

            // NotificationServiceのテスト
            console.log('NotificationService クラス:', typeof NotificationService);
            if (typeof NotificationService !== 'undefined') {
                this.notificationService = new NotificationService();
                console.log('✅ NotificationService 初期化完了');
            } else {
                console.error('❌ NotificationService が見つかりません');
            }

            // ErrorHandlerのテスト
            console.log('ErrorHandler クラス:', typeof ErrorHandler);
            if (typeof ErrorHandler !== 'undefined') {
                this.errorHandler = new ErrorHandler();
                console.log('✅ ErrorHandler 初期化完了');
            } else {
                console.error('❌ ErrorHandler が見つかりません');
            }

            console.log('✅ 依存関係の初期化完了');
            this.initialized = true;

        } catch (error) {
            console.error('❌ 依存関係の初期化エラー:', error);
            throw error;
        }
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        console.log('🎯 アプリケーション初期化開始');

        try {
            if (!this.initialized) {
                throw new Error('依存関係が初期化されていません');
            }

            // 基本的なUI設定
            this.setupBasicUI();

            console.log('✅ アプリケーション初期化完了');

            if (this.notificationService) {
                this.notificationService.show('アプリケーションが準備完了しました', 'success', 3000);
            }

        } catch (error) {
            console.error('❌ アプリケーション初期化エラー:', error);
            throw error;
        }
    }

    /**
     * 基本的なUI設定
     */
    setupBasicUI() {
        console.log('🎨 基本UI設定開始');

        try {
            // メインアプリを表示
            const authOverlay = document.getElementById('auth-overlay');
            const mainApp = document.getElementById('main-app');

            if (authOverlay) {
                authOverlay.style.display = 'none';
            }

            if (mainApp) {
                mainApp.classList.remove('hidden');
            }

            // テーマ入力フィールドの設定
            const themeInput = document.getElementById('theme-input');
            const generateBtn = document.getElementById('generate-structure-btn');

            if (themeInput && generateBtn) {
                themeInput.addEventListener('input', (e) => {
                    generateBtn.disabled = !e.target.value.trim();
                });

                generateBtn.addEventListener('click', () => {
                    const theme = themeInput.value.trim();
                    if (theme) {
                        this.handleGenerateStructure(theme);
                    }
                });
            }

            console.log('✅ 基本UI設定完了');

        } catch (error) {
            console.error('❌ 基本UI設定エラー:', error);
        }
    }

    /**
     * 構造生成を処理
     */
    async handleGenerateStructure(theme) {
        console.log('🏗️ 構造生成開始:', theme);

        try {
            if (this.notificationService) {
                this.notificationService.show('構成案を生成中...', 'info');
            }

            // 簡単なモック生成
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockStructure = {
                pillarPage: {
                    title: `${theme}完全ガイド`,
                    summary: `${theme}に関する包括的なガイドです。`
                },
                clusterPages: [
                    { id: 'cluster-1', title: `${theme}の基本概念`, summary: '基本的な概念について' },
                    { id: 'cluster-2', title: `${theme}の実践方法`, summary: '実践的な手法について' },
                    { id: 'cluster-3', title: `${theme}のベストプラクティス`, summary: 'ベストプラクティスについて' }
                ]
            };

            this.data = { ...this.data, ...mockStructure };

            if (this.notificationService) {
                this.notificationService.show('構成案の生成が完了しました', 'success');
            }

            console.log('✅ 構造生成完了:', mockStructure);

        } catch (error) {
            console.error('❌ 構造生成エラー:', error);
            if (this.notificationService) {
                this.notificationService.show('構造生成に失敗しました', 'error');
            }
        }
    }

    /**
     * データを取得
     */
    getData() {
        return this.data;
    }

    /**
     * 初期化状態を取得
     */
    isInitialized() {
        return this.initialized;
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.HubPilotAppSimple = HubPilotAppSimple;
}
