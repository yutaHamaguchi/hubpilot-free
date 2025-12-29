/**
 * HubPilotApp - 簡単版（デバッグ用）
 */
class HubPilotAppSimple {
    constructor() {

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


            // 依存関係の初期化
            this.initializeDependencies();

        } catch (error) {
            console.error('❌ HubPilotAppSimple constructor エラー:', error);
            throw error;
        }
    }

    /**
     * 依存関係を初期化
     */
    initializeDependencies() {

        try {
            // StorageServiceのテスト
            if (typeof StorageService !== 'undefined') {
                this.storageService = new StorageService();
            } else {
                console.error('❌ StorageService が見つかりません');
            }

            // NotificationServiceのテスト
            if (typeof NotificationService !== 'undefined') {
                this.notificationService = new NotificationService();
            } else {
                console.error('❌ NotificationService が見つかりません');
            }

            // ErrorHandlerのテスト
            if (typeof ErrorHandler !== 'undefined') {
                this.errorHandler = new ErrorHandler();
            } else {
                console.error('❌ ErrorHandler が見つかりません');
            }

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

        try {
            if (!this.initialized) {
                throw new Error('依存関係が初期化されていません');
            }

            // 基本的なUI設定
            this.setupBasicUI();


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


        } catch (error) {
            console.error('❌ 基本UI設定エラー:', error);
        }
    }

    /**
     * 構造生成を処理
     */
    async handleGenerateStructure(theme) {

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
