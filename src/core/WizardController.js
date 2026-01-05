/**
 * WizardController - ウィザードの状態管理とナビゲーションを制御
 */
class WizardController {
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

        // 変更追跡用
        this.lastSavedData = null;
        this.unsavedChanges = false;
        this.isInternalNavigation = false;

        // 依存関係の注入
        this.dataStore = null;
        this.uiRenderer = null;
        this.contentGenerator = null;
        this.notificationService = null;

        this.setupKeyboardShortcuts();
        this.setupBrowserNavigation();
    }

    /**
     * 依存関係を設定
     */
    setDependencies(dataStore, uiRenderer, contentGenerator, notificationService) {
        this.dataStore = dataStore;
        this.uiRenderer = uiRenderer;
        this.contentGenerator = contentGenerator;
        this.notificationService = notificationService;
    }

    /**
     * 次のステップに移動
     */
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.updateStepIndicator();
                this.renderCurrentStep();
                this.updateURL();
                this.trackStepChange('next');
            }
        }
    }

    /**
     * 前のステップに移動
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepIndicator();
            this.renderCurrentStep();
            this.updateURL();
            this.trackStepChange('previous');
        }
    }

    /**
     * 指定されたステップに移動
     */
    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            // 現在のステップより後のステップに移動する場合は検証
            if (stepNumber > this.currentStep) {
                for (let i = this.currentStep; i < stepNumber; i++) {
                    if (!this.validateStep(i)) {
                        this.notificationService?.show(
                            `ステップ${i}を完了してから進んでください`,
                            'warning'
                        );
                        return false;
                    }
                }
            }

            this.currentStep = stepNumber;
            this.updateStepIndicator();
            this.renderCurrentStep();
            this.updateURL();
            this.trackStepChange('direct');
            return true;
        }
        return false;
    }

    /**
     * 現在のステップを検証
     */
    validateCurrentStep() {
        return this.validateStep(this.currentStep);
    }

    /**
     * 指定されたステップを検証
     */
    validateStep(stepNumber) {
        switch (stepNumber) {
            case 1:
                return this.data.theme && this.data.theme.trim().length > 0;
            case 2:
                return this.data.pillarPage && this.data.clusterPages &&
                       this.data.clusterPages.length > 0;
            case 3:
                return this.data.headings && Object.keys(this.data.headings).length > 0;
            case 4:
                return this.data.articles && this.data.articles.length > 0;
            case 5:
                return this.data.qualityChecks && this.data.qualityChecks.length > 0;
            case 6:
                return true; // 最終ステップは常に有効
            default:
                return false;
        }
    }

    /**
     * ステップデータを保存
     */
    saveData(stepData) {
        Object.assign(this.data, stepData);
        this.unsavedChanges = true;

        if (this.dataStore) {
            this.dataStore.save(this.data);
            this.lastSavedData = JSON.parse(JSON.stringify(this.data));
            this.unsavedChanges = false;
        }
    }

    /**
     * データを読み込み
     */
    loadData() {
        if (this.dataStore) {
            const savedData = this.dataStore.load();
            if (savedData) {
                this.data = { ...this.data, ...savedData };
                this.lastSavedData = JSON.parse(JSON.stringify(this.data));
            }
        }
    }

    /**
     * ステップインジケーターを更新
     */
    updateStepIndicator() {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');

            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });

        // プログレスバーの更新
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * 現在のステップをレンダリング
     */
    renderCurrentStep() {
        if (this.uiRenderer) {
            this.uiRenderer.renderStep(this.currentStep, this.data);
        }

        // ステップ固有の処理
        this.handleStepSpecificLogic();
    }

    /**
     * ステップ固有のロジックを処理
     */
    handleStepSpecificLogic() {
        switch (this.currentStep) {
            case 1:
                this.focusThemeInput();
                break;
            case 2:
                this.loadStructureIfNeeded();
                break;
            case 3:
                this.loadHeadingsIfNeeded();
                break;
            case 4:
                this.setupArticleGeneration();
                break;
            case 5:
                this.setupQualityCheck();
                break;
            case 6:
                this.setupFinalApproval();
                break;
        }
    }

    /**
     * URLを更新
     */
    updateURL() {
        if (!this.isInternalNavigation) {
            const url = new URL(window.location);
            url.searchParams.set('step', this.currentStep);
            window.history.pushState({ step: this.currentStep }, '', url);
        }
    }

    /**
     * URLからステップを読み込み
     */
    loadStepFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const stepParam = urlParams.get('step');
        if (stepParam) {
            const step = parseInt(stepParam);
            if (step >= 1 && step <= this.totalSteps) {
                this.currentStep = step;
            }
        }
    }

    /**
     * キーボードショートカットを設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + 矢印キーでステップ移動
            if (e.ctrlKey) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextStep();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.previousStep();
                }
            }

            // 数字キーでステップ移動（Ctrl + 1-6）
            if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                this.goToStep(parseInt(e.key));
            }
        });
    }

    /**
     * ブラウザナビゲーションを設定
     */
    setupBrowserNavigation() {
        window.addEventListener('popstate', (e) => {
            this.isInternalNavigation = true;
            if (e.state && e.state.step) {
                this.currentStep = e.state.step;
            } else {
                this.loadStepFromURL();
            }
            this.updateStepIndicator();
            this.renderCurrentStep();
            this.isInternalNavigation = false;
        });
    }

    /**
     * ステップ変更を追跡
     */
    trackStepChange(action) {
        // アナリティクス用のイベント追跡
        if (window.gtag) {
            window.gtag('event', 'step_change', {
                step_number: this.currentStep,
                action: action
            });
        }
    }

    /**
     * テーマ入力にフォーカス
     */
    focusThemeInput() {
        setTimeout(() => {
            const themeInput = document.getElementById('theme-input');
            if (themeInput) {
                themeInput.focus();
            }
        }, 100);
    }

    /**
     * 構造を必要に応じて読み込み
     */
    loadStructureIfNeeded() {
        if (!this.data.pillarPage.title && this.data.theme) {
            // 構造生成が必要
            this.generateStructure();
        }
    }

    /**
     * 見出しを必要に応じて読み込み
     */
    loadHeadingsIfNeeded() {
        if (Object.keys(this.data.headings).length === 0 && this.data.clusterPages.length > 0) {
            // 見出し生成が必要
            this.generateHeadings();
        }
    }

    /**
     * 記事生成を設定
     */
    setupArticleGeneration() {
        // 記事生成の準備
    }

    /**
     * 品質チェックを設定
     */
    setupQualityCheck() {
        // 品質チェックの準備
    }

    /**
     * 最終承認を設定
     */
    setupFinalApproval() {
        // 最終承認の準備
    }

    /**
     * 構造を生成
     */
    async generateStructure() {
        if (this.contentGenerator) {
            try {
                const structure = await this.contentGenerator.generateStructure(this.data.theme);
                this.saveData(structure);

                // 構造生成完了後、自動的に次のステップに移動
                setTimeout(() => {
                    this.nextStep();
                }, 1000); // 1秒後に移動（ユーザーが成功メッセージを確認できるように）

            } catch (error) {
                this.notificationService?.show('構造の生成に失敗しました', 'error');
            }
        }
    }

    /**
     * 見出しを生成
     */
    async generateHeadings() {
        if (this.contentGenerator) {
            try {
                const headings = await this.contentGenerator.generateHeadings(this.data.clusterPages);
                this.saveData({ headings });
                this.renderCurrentStep();
            } catch (error) {
                this.notificationService?.show('見出しの生成に失敗しました', 'error');
            }
        }
    }

    /**
     * 未保存の変更があるかチェック
     */
    hasUnsavedChanges() {
        return this.unsavedChanges;
    }

    /**
     * データをリセット
     */
    resetData() {
        this.data = {
            theme: '',
            pillarPage: {},
            clusterPages: [],
            headings: {},
            articles: [],
            qualityChecks: []
        };
        this.currentStep = 1;
        this.unsavedChanges = false;
        this.lastSavedData = null;

        if (this.dataStore) {
            this.dataStore.clear();
        }

        this.updateStepIndicator();
        this.renderCurrentStep();
        this.updateURL();
    }
}

// グローバルに公開
window.WizardController = WizardController;
