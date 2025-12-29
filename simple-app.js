/**
 * Simple App - 基本的なナビゲーション機能を提供するシンプルなアプリケーション
 */


class SimpleApp {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.data = {
            theme: '',
            pillarPage: {},
            clusterPages: [],
            headings: {},
            articles: [],
            qualityChecks: []
        };

        this.init();
    }

    init() {

        // DOM読み込み完了を待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {

        // 認証画面を非表示にしてメインアプリを表示
        this.showMainApp();

        // イベントリスナーを設定
        this.bindEvents();

        // 初期ステップを表示
        this.showStep(this.currentStep);

    }

    showMainApp() {
        const authOverlay = document.getElementById('auth-overlay');
        const mainApp = document.getElementById('main-app');

        if (authOverlay) {
            authOverlay.style.display = 'none';
        }

        if (mainApp) {
            mainApp.classList.remove('hidden');
        }

    }

    bindEvents() {

        // テーマ入力イベント
        this.bindThemeInputEvents();

        // ナビゲーションボタンイベント
        this.bindNavigationEvents();

        // 構成案生成ボタンイベント
        this.bindGenerateButtonEvents();

        // ステップインジケーターイベント
        this.bindStepIndicatorEvents();

    }

    bindThemeInputEvents() {
        const themeInput = document.getElementById('theme-input');
        const generateBtn = document.getElementById('generate-structure-btn');

        if (themeInput && generateBtn) {
            themeInput.addEventListener('input', (e) => {
                const hasValue = e.target.value.trim().length > 0;
                generateBtn.disabled = !hasValue;

                // 文字数カウント更新
                const charCount = document.getElementById('char-count');
                if (charCount) {
                    charCount.textContent = e.target.value.length;
                }

                // データ保存
                this.data.theme = e.target.value;
            });

            // 初期状態設定
            generateBtn.disabled = !themeInput.value.trim();
        }

        // テーマ例ボタン
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                if (themeInput && theme) {
                    themeInput.value = theme;
                    themeInput.dispatchEvent(new Event('input'));
                }
            });
        });
    }

    bindNavigationEvents() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.previousStep();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        }

    }

    bindGenerateButtonEvents() {
        const generateBtn = document.getElementById('generate-structure-btn');
        const themeInput = document.getElementById('theme-input');

        if (generateBtn && themeInput) {
            generateBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                const theme = themeInput.value.trim();
                if (!theme) {
                    alert('テーマを入力してください');
                    return;
                }

                await this.generateStructure(theme);
            });
        }
    }

    bindStepIndicatorEvents() {
        document.querySelectorAll('.step-item').forEach((stepItem, index) => {
            stepItem.addEventListener('click', () => {
                const stepNumber = index + 1;
                this.goToStep(stepNumber);
            });
        });
    }

    async generateStructure(theme) {
        const generateBtn = document.getElementById('generate-structure-btn');

        try {

            // ボタンを無効化
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="btn-icon">⏳</span> 生成中...';

            // テーマの検証
            if (!theme || theme.trim().length === 0) {
                throw new Error('テーマが入力されていません');
            }

            // 2秒待機（生成をシミュレート）
            await new Promise(resolve => setTimeout(resolve, 2000));

            // モックデータを生成
            this.data.pillarPage = {
                title: `${theme}の完全ガイド - 初心者から上級者まで`,
                summary: `${theme}に関する包括的なガイドです。`
            };

            this.data.clusterPages = [
                { id: 'cluster-1', title: `${theme}とは？基本概念と重要性`, summary: '基本的な概念について' },
                { id: 'cluster-2', title: `${theme}の始め方 - 初心者向けガイド`, summary: '始め方について' },
                { id: 'cluster-3', title: `${theme}の基本戦略と効果的なアプローチ`, summary: '戦略について' },
                { id: 'cluster-4', title: `${theme}のツールと必要なリソース`, summary: 'ツールについて' },
                { id: 'cluster-5', title: `${theme}の成功事例とケーススタディ`, summary: '成功事例について' },
                { id: 'cluster-6', title: `${theme}でよくある間違いと対処法`, summary: '間違いと対処法について' },
                { id: 'cluster-7', title: `${theme}の最新トレンドと将来性`, summary: 'トレンドについて' },
                { id: 'cluster-8', title: `${theme}の測定方法と分析指標`, summary: '測定方法について' },
                { id: 'cluster-9', title: `${theme}の応用テクニックと上級者向けTips`, summary: '応用テクニックについて' },
                { id: 'cluster-10', title: `${theme}のQ&A - よくある質問と回答`, summary: 'Q&Aについて' }
            ];


            // Step 2に移動
            this.nextStep();

            // Step 2のコンテンツを更新
            this.updateStep2Content();

            alert('構成案を生成しました！');

        } catch (error) {
            console.error('❌ Structure generation failed:', error);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Error details:', {
                message: error.message,
                name: error.name,
                theme: theme,
                timestamp: new Date().toISOString()
            });

            // より詳細なエラーメッセージを表示
            let errorMessage = '構成案の生成に失敗しました。';
            if (error.message) {
                errorMessage += '\n詳細: ' + error.message;
            }
            errorMessage += '\n\nページを再読み込みして再試行してください。';

            alert(errorMessage);
        } finally {
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
        }
    }

    updateStep2Content() {
        // ピラーページタイトルを更新
        const pillarTitle = document.getElementById('pillar-page-title');
        if (pillarTitle && this.data.pillarPage) {
            pillarTitle.textContent = this.data.pillarPage.title;
        }

        // クラスターページリストを更新
        const clusterList = document.getElementById('cluster-pages-list');
        if (clusterList && this.data.clusterPages) {
            let html = '';
            this.data.clusterPages.forEach((page, index) => {
                html += `
                    <div class="cluster-page-item">
                        <div class="cluster-page-number">${index + 1}</div>
                        <div class="cluster-page-content">
                            <div class="cluster-page-title">${page.title}</div>
                            <div class="cluster-page-meta">
                                <span class="word-count">約2,000文字</span>
                                <span class="status">生成待ち</span>
                            </div>
                        </div>
                        <div class="cluster-page-actions">
                            <button class="btn btn-small btn-secondary">編集</button>
                        </div>
                    </div>
                `;
            });
            clusterList.innerHTML = html;
        }

        // 統計を更新
        const clusterCount = this.data.clusterPages.length;
        const totalCount = clusterCount + 1;

        this.updateElement('cluster-count', clusterCount);
        this.updateElement('summary-cluster-count', clusterCount);
        this.updateElement('summary-total-count', totalCount);
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
        }
    }

    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            this.currentStep = stepNumber;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
        }
    }

    showStep(stepNumber) {
        // すべてのステップを非表示
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.remove('active');
        });

        // 指定されたステップを表示
        const stepEl = document.getElementById(`step-${stepNumber}`);
        if (stepEl) {
            stepEl.classList.add('active');
        }

    }

    updateStepIndicator() {
        document.querySelectorAll('.step-item').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');

            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });

    }

    updateElement(id, content) {
        const el = document.getElementById(id);
        if (el && content !== null && content !== undefined) {
            el.textContent = content;
        }
    }

    // デバッグ用メソッド
    getDebugInfo() {
        return {
            currentStep: this.currentStep,
            data: this.data,
            timestamp: new Date().toISOString()
        };
    }
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {

    // 少し待ってから初期化（他のスクリプトとの競合を避けるため）
    setTimeout(() => {
        try {
            window.simpleApp = new SimpleApp();
        } catch (error) {
            console.error('❌ Simple App initialization failed:', error);
        }
    }, 100);
});

// グローバルに公開
window.SimpleApp = SimpleApp;

