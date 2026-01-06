/**
 * 進捗管理クラス
 * 記事生成の進捗状態を管理し、UI更新を行う
 *
 * 機能:
 * - 進捗状態の管理とUI更新
 * - 推定時間計算
 * - リアルタイム進捗表示
 *
 * 要件: 5.1, 5.2, 5.3, 5.4, 5.5
 */
class ProgressManager {
    constructor() {
        // 進捗状態
        this.totalArticles = 0;
        this.completedArticles = 0;
        this.currentArticleTitle = '';
        this.isActive = false;

        // 時間管理
        this.startTime = null;
        this.estimatedTimeRemaining = 0;
        this.averageTimePerArticle = 0;

        // UI要素
        this.progressBar = null;
        this.progressText = null;
        this.currentArticleElement = null;
        this.timeRemainingElement = null;

        // コールバック
        this.onProgressUpdate = null;
        this.onComplete = null;
        this.onError = null;

        this.initializeUIElements();
    }

    /**
     * UI要素を初期化
     */
    initializeUIElements() {
        try {
            this.progressBar = document.getElementById('generation-pgress-bar');
            this.progressText = document.getElementById('generation-progress-text');
            this.currentArticleElement = document.getElementById('current-article-title');
            this.timeRemainingElement = document.getElementById('time-remaining');

            // UI要素が見つからない場合は警告を出すが、エラーにはしない
            if (!this.progressBar) {
                console.warn('進捗バー要素が見つかりません: generation-progress-bar');
            }
            if (!this.progressText) {
                console.warn('進捗テキスト要素が見つかりません: generation-progress-text');
            }
        } catch (error) {
            console.error('UI要素の初期化エラー:', error);
        }
    }

    /**
     * 進捗管理を開始
     * @param {number} totalArticles - 総記事数
     * @param {Function} onProgressUpdate - 進捗更新コールバック
     * @param {Function} onComplete - 完了コールバック
     * @param {Function} onError - エラーコールバック
     */
    start(totalArticles, onProgressUpdate = null, onComplete = null, onError = null) {
        try {
            // 状態初期化
            this.totalArticles = totalArticles || 0;
            this.completedArticles = 0;
            this.currentArticleTitle = '';
            this.isActive = true;
            this.startTime = Date.now();
            this.estimatedTimeRemaining = 0;
            this.averageTimePerArticle = 0;

            // コールバック設定
            this.onProgressUpdate = onProgressUpdate;
            this.onComplete = onComplete;
            this.onError = onError;

            // UI初期化
            this.updateUI();

            console.log(`進捗管理開始: 総記事数 ${this.totalArticles}`);

        } catch (error) {
            console.error('進捗管理開始エラー:', error);
            this.handleError('進捗管理の開始に失敗しました');
        }
    }

    /**
     * 進捗を更新
     * @param {number} completedCount - 完了記事数
     * @param {string} currentTitle - 現在処理中の記事タイトル
     */
    updateProgress(completedCount, currentTitle = '') {
        try {
            // 入力検証
            if (typeof completedCount !== 'number' || completedCount < 0) {
                throw new Error('完了記事数が無効です');
            }

            if (completedCount > this.totalArticles) {
                console.warn(`完了記事数が総記事数を超えています: ${completedCount} > ${this.totalArticles}`);
                completedCount = this.totalArticles;
            }

            // 進捗の単調性を確保（後退しない）
            if (completedCount < this.completedArticles) {
                console.warn(`進捗が後退しています: ${completedCount} < ${this.completedArticles}`);
                return;
            }

            // 状態更新
            this.completedArticles = completedCount;
            this.currentArticleTitle = currentTitle || '';

            // 推定時間計算
            this.calculateEstimatedTime();

            // UI更新
            this.updateUI();

            // コールバック実行
            if (this.onProgressUpdate && typeof this.onProgressUpdate === 'function') {
                try {
                    this.onProgressUpdate({
                        completed: this.completedArticles,
                        total: this.totalArticles,
                        percentage: this.getProgressPercentage(),
                        currentTitle: this.currentArticleTitle,
                        estimatedTimeRemaining: this.estimatedTimeRemaining
                    });
                } catch (callbackError) {
                    console.error('進捗更新コールバックエラー:', callbackError);
                }
            }

            // 完了チェック
            if (this.completedArticles >= this.totalArticles) {
                this.complete();
            }

        } catch (error) {
            console.error('進捗更新エラー:', error);
            this.handleError('進捗の更新に失敗しました');
        }
    }

    /**
     * 進捗完了
     */
    complete() {
        try {
            this.isActive = false;
            this.completedArticles = this.totalArticles;
            this.currentArticleTitle = '';
            this.estimatedTimeRemaining = 0;

            // UI更新
            this.updateUI();

            // 完了コールバック実行
            if (this.onComplete && typeof this.onComplete === 'function') {
                try {
                    this.onComplete({
                        totalArticles: this.totalArticles,
                        totalTime: Date.now() - this.startTime,
                        averageTimePerArticle: this.averageTimePerArticle
                    });
                } catch (callbackError) {
                    console.error('完了コールバックエラー:', callbackError);
                }
            }

            console.log('記事生成完了');

        } catch (error) {
            console.error('進捗完了処理エラー:', error);
            this.handleError('進捗完了処理に失敗しました');
        }
    }

    /**
     * エラー処理
     * @param {string} errorMessage - エラーメッセージ
     */
    handleError(errorMessage) {
        try {
            this.isActive = false;

            // エラーコールバック実行
            if (this.onError && typeof this.onError === 'function') {
                try {
                    this.onError({
                        message: errorMessage,
                        completed: this.completedArticles,
                        total: this.totalArticles
                    });
                } catch (callbackError) {
                    console.error('エラーコールバック実行エラー:', callbackError);
                }
            }

            console.error('進捗管理エラー:', errorMessage);

        } catch (error) {
            console.error('エラー処理中にエラー:', error);
        }
    }

    /**
     * 推定残り時間を計算
     */
    calculateEstimatedTime() {
        try {
            if (!this.startTime || this.completedArticles === 0) {
                this.estimatedTimeRemaining = 0;
                this.averageTimePerArticle = 0;
                return;
            }

            const elapsedTime = Date.now() - this.startTime;
            this.averageTimePerArticle = elapsedTime / this.completedArticles;

            const remainingArticles = this.totalArticles - this.completedArticles;
            this.estimatedTimeRemaining = Math.round(this.averageTimePerArticle * remainingArticles);

        } catch (error) {
            console.error('推定時間計算エラー:', error);
            this.estimatedTimeRemaining = 0;
            this.averageTimePerArticle = 0;
        }
    }

    /**
     * 進捗パーセンテージを取得
     * @returns {number} 進捗パーセンテージ（0-100）
     */
    getProgressPercentage() {
        if (this.totalArticles === 0) return 0;
        return Math.round((this.completedArticles / this.totalArticles) * 100);
    }

    /**
     * UI要素を更新
     */
    updateUI() {
        try {
            const percentage = this.getProgressPercentage();

            // 進捗バー更新
            if (this.progressBar) {
                this.progressBar.style.width = `${percentage}%`;
                this.progressBar.setAttribute('aria-valuenow', percentage);
            }

            // 進捗テキスト更新
            if (this.progressText) {
                this.progressText.textContent = `${this.completedArticles}/${this.totalArticles} (${percentage}%)`;
            }

            // 現在の記事タイトル更新
            if (this.currentArticleElement) {
                if (this.currentArticleTitle) {
                    this.currentArticleElement.textContent = `生成中: ${this.currentArticleTitle}`;
                    this.currentArticleElement.style.display = 'block';
                } else {
                    this.currentArticleElement.style.display = 'none';
                }
            }

            // 推定残り時間更新
            if (this.timeRemainingElement) {
                if (this.estimatedTimeRemaining > 0 && this.isActive) {
                    const minutes = Math.floor(this.estimatedTimeRemaining / 60000);
                    const seconds = Math.floor((this.estimatedTimeRemaining % 60000) / 1000);
                    this.timeRemainingElement.textContent = `推定残り時間: ${minutes}分${seconds}秒`;
                    this.timeRemainingElement.style.display = 'block';
                } else {
                    this.timeRemainingElement.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('UI更新エラー:', error);
        }
    }

    /**
     * 進捗状態をリセット
     */
    reset() {
        try {
            this.totalArticles = 0;
            this.completedArticles = 0;
            this.currentArticleTitle = '';
            this.isActive = false;
            this.startTime = null;
            this.estimatedTimeRemaining = 0;
            this.averageTimePerArticle = 0;

            // コールバッククリア
            this.onProgressUpdate = null;
            this.onComplete = null;
            this.onError = null;

            // UI更新
            this.updateUI();

            console.log('進捗管理リセット完了');

        } catch (error) {
            console.error('進捗管理リセットエラー:', error);
        }
    }

    /**
     * 現在の進捗状態を取得
     * @returns {Object} 進捗状態オブジェクト
     */
    getState() {
        return {
            totalArticles: this.totalArticles,
            completedArticles: this.completedArticles,
            currentArticleTitle: this.currentArticleTitle,
            isActive: this.isActive,
            percentage: this.getProgressPercentage(),
            estimatedTimeRemaining: this.estimatedTimeRemaining,
            averageTimePerArticle: this.averageTimePerArticle,
            elapsedTime: this.startTime ? Date.now() - this.startTime : 0
        };
    }

    /**
     * 進捗状態が有効かチェック
     * @returns {boolean} 有効な状態かどうか
     */
    isValid() {
        return this.totalArticles >= 0 &&
               this.completedArticles >= 0 &&
               this.completedArticles <= this.totalArticles &&
               typeof this.currentArticleTitle === 'string';
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            state: this.getState(),
            uiElements: {
                progressBar: !!this.progressBar,
                progressText: !!this.progressText,
                currentArticleElement: !!this.currentArticleElement,
                timeRemainingElement: !!this.timeRemainingElement
            },
            callbacks: {
                onProgressUpdate: typeof this.onProgressUpdate,
                onComplete: typeof this.onComplete,
                onError: typeof this.onError
            }
        };
    }
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressManager;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.ProgressManager = ProgressManager;
}
