/**
 * 進捗UI管理クラス
 * 進捗表示のUI要素を管理し、視覚的な更新を行う
 *
 * 機能:
 * - 進捗バー、パーセンテージ、テキスト表示の改善
 * - 現在処理中記事の表示
 * - 推定残り時間の表示
 *
 * 要件: 5.2, 5.3, 5.4
 */
class ProgressUI {
    constructor() {
        this.elements = {};
        this.animations = {};
        this.isInitialized = false;

        this.initializeElements();
    }

    /**
     * UI要素を初期化
     */
    initializeElements() {
        try {
            // 進捗表示要素を取得または作成
            this.elements = {
                container: this.getOrCreateElement('generation-progress-container', 'div'),
                progressBar: this.getOrCreateElement('generation-progress-bar', 'div'),
                progressBarFill: this.getOrCreateElement('generation-progress-fill', 'div'),
                progressText: this.getOrCreateElement('generation-progress-text', 'div'),
                currentArticle: this.getOrCreateElement('current-article-title', 'div'),
                timeRemaining: this.getOrCreateElement('time-remaining', 'div'),
                articleCount: this.getOrCreateElement('article-count', 'div'),
                statusMessage: this.getOrCreateElement('generation-status', 'div')
            };

            // CSS クラスを設定
            this.setupStyles();

            // 初期状態を設定
            this.resetDisplay();

            this.isInitialized = true;
            console捗UI初期化完了');

        } catch (error) {
            console.error('進捗UI初期化エラー:', error);
            this.isInitialized = false;
        }
    }

    /**
     * 要素を取得または作成
     * @param {string} id - 要素ID
     * @param {string} tagName - タグ名
     * @returns {HTMLElement} HTML要素
     */
    getOrCreateElement(id, tagName) {
        let element = document.getElementById(id);

        if (!element) {
            element = document.createElement(tagName);
            element.id = id;

            // コンテナに追加
            const container = document.getElementById('generation-progress-container') ||
                            document.querySelector('.wizard-step[data-step="4"]') ||
                            document.body;

            if (container) {
                container.appendChild(element);
            }
        }

        return element;
    }

    /**
     * スタイルを設定
     */
    setupStyles() {
        try {
            // 進捗コンテナ
            if (this.elements.container) {
                this.elements.container.className = 'progress-container';
            }

            // 進捗バー
            if (this.elements.progressBar) {
                this.elements.progressBar.className = 'progress-bar';
                this.elements.progressBar.setAttribute('role', 'progressbar');
                this.elements.progressBar.setAttribute('aria-valuemin', '0');
                this.elements.progressBar.setAttribute('aria-valuemax', '100');
                this.elements.progressBar.setAttribute('aria-valuenow', '0');
            }

            // 進捗バー塗りつぶし
            if (this.elements.progressBarFill) {
                this.elements.progressBarFill.className = 'progress-bar-fill';
                if (this.elements.progressBar) {
                    this.elements.progressBar.appendChild(this.elements.progressBarFill);
                }
            }

            // 進捗テキスト
            if (this.elements.progressText) {
                this.elements.progressText.className = 'progress-text';
            }

            // 現在の記事
            if (this.elements.currentArticle) {
                this.elements.currentArticle.className = 'current-article';
            }

            // 残り時間
            if (this.elements.timeRemaining) {
                this.elements.timeRemaining.className = 'time-remaining';
            }

            // 記事数
            if (this.elements.articleCount) {
                this.elements.articleCount.className = 'article-count';
            }

            // ステータスメッセージ
            if (this.elements.statusMessage) {
                this.elements.statusMessage.className = 'status-message';
            }

        } catch (error) {
            console.error('スタイル設定エラー:', error);
        }
    }

    /**
     * 進捗を更新
     * @param {Object} progressData - 進捗データ
     */
    updateProgress(progressData) {
        if (!this.isInitialized) {
            console.warn('進捗UIが初期化されていません');
            return;
        }

        try {
            const {
                completed = 0,
                total = 0,
                percentage = 0,
                currentTitle = '',
                estimatedTimeRemaining = 0
            } = progressData;

            // 進捗バー更新（アニメーション付き）
            this.updateProgressBar(percentage);

            // 進捗テキスト更新
            this.updateProgressText(completed, total, percentage);

            // 現在の記事更新
            this.updateCurrentArticle(currentTitle);

            // 推定残り時間更新
            this.updateTimeRemaining(estimatedTimeRemaining);

            // 記事数更新
            this.updateArticleCount(completed, total);

            // ステータスメッセージ更新
            this.updateStatusMessage(completed, total);

        } catch (error) {
            console.error('進捗UI更新エラー:', error);
        }
    }

    /**
     * 進捗バーを更新
     * @param {number} percentage - 進捗パーセンテージ
     */
    updateProgressBar(percentage) {
        try {
            if (!this.elements.progressBar || !this.elements.progressBarFill) return;

            // アニメーション付きで幅を更新
            const targetWidth = Math.max(0, Math.min(100, percentage));

            // 既存のアニメーションをキャンセル
            if (this.animations.progressBar) {
                this.animations.progressBar.cancel();
            }

            // 新しいアニメーションを開始
            this.animations.progressBar = this.elements.progressBarFill.animate([
                { width: this.elements.progressBarFill.style.width || '0%' },
                { width: `${targetWidth}%` }
            ], {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            });

            // ARIA属性更新
            this.elements.progressBar.setAttribute('aria-valuenow', targetWidth);

            // 色の変更（進捗に応じて）
            let colorClass = 'progress-low';
            if (targetWidth >= 75) {
                colorClass = 'progress-high';
            } else if (targetWidth >= 50) {
                colorClass = 'progress-medium';
            }

            this.elements.progressBarFill.className = `progress-bar-fill ${colorClass}`;

        } catch (error) {
            console.error('進捗バー更新エラー:', error);
        }
    }

    /**
     * 進捗テキストを更新
     * @param {number} completed - 完了数
     * @param {number} total - 総数
     * @param {number} percentage - パーセンテージ
     */
    updateProgressText(completed, total, percentage) {
        try {
            if (!this.elements.progressText) return;

            const text = `${completed}/${total} 記事完了 (${percentage}%)`;

            // テキストが変更された場合のみ更新
            if (this.elements.progressText.textContent !== text) {
                this.elements.progressText.textContent = text;

                // フェードイン効果
                this.elements.progressText.style.opacity = '0.7';
                setTimeout(() => {
                    if (this.elements.progressText) {
                        this.elements.progressText.style.opacity = '1';
                    }
                }, 100);
            }

        } catch (error) {
            console.error('進捗テキスト更新エラー:', error);
        }
    }

    /**
     * 現在の記事を更新
     * @param {string} currentTitle - 現在の記事タイトル
     */
    updateCurrentArticle(currentTitle) {
        try {
            if (!this.elements.currentArticle) return;

            if (currentTitle && currentTitle.trim()) {
                const displayTitle = currentTitle.length > 50 ?
                    currentTitle.substring(0, 47) + '...' :
                    currentTitle;

                this.elements.currentArticle.innerHTML = `
                    <span class="current-article-label">生成中:</span>
                    <span class="current-article-title">${this.escapeHtml(displayTitle)}</span>
                `;
                this.elements.currentArticle.style.display = 'block';

                // パルス効果
                this.elements.currentArticle.classList.add('pulse');
                setTimeout(() => {
                    if (this.elements.currentArticle) {
                        this.elements.currentArticle.classList.remove('pulse');
                    }
                }, 1000);

            } else {
                this.elements.currentArticle.style.display = 'none';
            }

        } catch (error) {
            console.error('現在記事更新エラー:', error);
        }
    }

    /**
     * 推定残り時間を更新
     * @param {number} estimatedTimeRemaining - 推定残り時間（ミリ秒）
     */
    updateTimeRemaining(estimatedTimeRemaining) {
        try {
            if (!this.elements.timeRemaining) return;

            if (estimatedTimeRemaining > 0) {
                const minutes = Math.floor(estimatedTimeRemaining / 60000);
                const seconds = Math.floor((estimatedTimeRemaining % 60000) / 1000);

                let timeText = '';
                if (minutes > 0) {
                    timeText = `推定残り時間: ${minutes}分${seconds}秒`;
                } else {
                    timeText = `推定残り時間: ${seconds}秒`;
                }

                this.elements.timeRemaining.innerHTML = `
                    <span class="time-icon">⏱️</span>
                    <span class="time-text">${timeText}</span>
                `;
                this.elements.timeRemaining.style.display = 'block';

            } else {
                this.elements.timeRemaining.style.display = 'none';
            }

        } catch (error) {
            console.error('残り時間更新エラー:', error);
        }
    }

    /**
     * 記事数を更新
     * @param {number} completed - 完了数
     * @param {number} total - 総数
     */
    updateArticleCount(completed, total) {
        try {
            if (!this.elements.articleCount) return;

            const remaining = total - completed;

            this.elements.articleCount.innerHTML = `
                <div class="count-item">
                    <span class="count-label">完了:</span>
                    <span class="count-value completed">${completed}</span>
                </div>
                <div class="count-item">
                    <span class="count-label">残り:</span>
                    <span class="count-value remaining">${remaining}</span>
                </div>
                <div class="count-item">
                    <span class="count-label">合計:</span>
                    <span class="count-value total">${total}</span>
                </div>
            `;

        } catch (error) {
            console.error('記事数更新エラー:', error);
        }
    }

    /**
     * ステータスメッセージを更新
     * @param {number} completed - 完了数
     * @param {number} total - 総数
     */
    updateStatusMessage(completed, total) {
        try {
            if (!this.elements.statusMessage) return;

            let message = '';
            let messageClass = '';

            if (completed === 0) {
                message = '記事生成を開始しています...';
                messageClass = 'status-starting';
            } else if (completed < total) {
                message = '記事を生成中です...';
                messageClass = 'status-generating';
            } else {
                message = '記事生成が完了しました！';
                messageClass = 'status-completed';
            }

            this.elements.statusMessage.textContent = message;
            this.elements.statusMessage.className = `status-message ${messageClass}`;

        } catch (error) {
            console.error('ステータスメッセージ更新エラー:', error);
        }
    }

    /**
     * 完了状態を表示
     * @param {Object} completionData - 完了データ
     */
    showCompletion(completionData) {
        try {
            const { totalArticles, totalTime, averageTimePerArticle } = completionData;

            // 進捗バーを100%に設定
            this.updateProgressBar(100);

            // 完了メッセージを表示
            if (this.elements.statusMessage) {
                this.elements.statusMessage.innerHTML = `
                    <span class="completion-icon">✅</span>
                    <span class="completion-text">記事生成完了！</span>
                `;
                this.elements.statusMessage.className = 'status-message status-completed';
            }

            // 現在の記事表示を非表示
            if (this.elements.currentArticle) {
                this.elements.currentArticle.style.display = 'none';
            }

            // 残り時間表示を非表示
            if (this.elements.timeRemaining) {
                this.elements.timeRemaining.style.display = 'none';
            }

            // 統計情報を表示
            this.showStatistics(totalArticles, totalTime, averageTimePerArticle);

        } catch (error) {
            console.error('完了表示エラー:', error);
        }
    }

    /**
     * エラー状態を表示
     * @param {Object} errorData - エラーデータ
     */
    showError(errorData) {
        try {
            const { message, completed, total } = errorData;

            // エラーメッセージを表示
            if (this.elements.statusMessage) {
                this.elements.statusMessage.innerHTML = `
                    <span class="error-icon">❌</span>
                    <span class="error-text">${this.escapeHtml(message)}</span>
                `;
                this.elements.statusMessage.className = 'status-message status-error';
            }

            // 現在の記事表示を非表示
            if (this.elements.currentArticle) {
                this.elements.currentArticle.style.display = 'none';
            }

            // 残り時間表示を非表示
            if (this.elements.timeRemaining) {
                this.elements.timeRemaining.style.display = 'none';
            }

        } catch (error) {
            console.error('エラー表示エラー:', error);
        }
    }

    /**
     * 統計情報を表示
     * @param {number} totalArticles - 総記事数
     * @param {number} totalTime - 総時間
     * @param {number} averageTimePerArticle - 記事あたり平均時間
     */
    showStatistics(totalArticles, totalTime, averageTimePerArticle) {
        try {
            // 統計情報要素を作成または取得
            let statsElement = document.getElementById('generation-statistics');
            if (!statsElement) {
                statsElement = document.createElement('div');
                statsElement.id = 'generation-statistics';
                statsElement.className = 'generation-statistics';

                if (this.elements.container) {
                    this.elements.container.appendChild(statsElement);
                }
            }

            const totalMinutes = Math.floor(totalTime / 60000);
            const totalSeconds = Math.floor((totalTime % 60000) / 1000);
            const avgMinutes = Math.floor(averageTimePerArticle / 60000);
            const avgSeconds = Math.floor((averageTimePerArticle % 60000) / 1000);

            statsElement.innerHTML = `
                <h4>生成統計</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">生成記事数:</span>
                        <span class="stat-value">${totalArticles}記事</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">総時間:</span>
                        <span class="stat-value">${totalMinutes}分${totalSeconds}秒</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均時間:</span>
                        <span class="stat-value">${avgMinutes}分${avgSeconds}秒/記事</span>
                    </div>
                </div>
            `;

            // フェードイン効果
            statsElement.style.opacity = '0';
            statsElement.style.display = 'block';
            setTimeout(() => {
                statsElement.style.opacity = '1';
            }, 100);

        } catch (error) {
            console.error('統計情報表示エラー:', error);
        }
    }

    /**
     * 表示をリセット
     */
    resetDisplay() {
        try {
            // 進捗バーリセット
            if (this.elements.progressBarFill) {
                this.elements.progressBarFill.style.width = '0%';
            }

            if (this.elements.progressBar) {
                this.elements.progressBar.setAttribute('aria-valuenow', '0');
            }

            // テキストリセット
            if (this.elements.progressText) {
                this.elements.progressText.textContent = '0/0 記事完了 (0%)';
            }

            // 要素を非表示
            const elementsToHide = [
                'currentArticle',
                'timeRemaining'
            ];

            elementsToHide.forEach(elementKey => {
                if (this.elements[elementKey]) {
                    this.elements[elementKey].style.display = 'none';
                }
            });

            // ステータスメッセージリセット
            if (this.elements.statusMessage) {
                this.elements.statusMessage.textContent = '';
                this.elements.statusMessage.className = 'status-message';
            }

            // 統計情報を非表示
            const statsElement = document.getElementById('generation-statistics');
            if (statsElement) {
                statsElement.style.display = 'none';
            }

        } catch (error) {
            console.error('表示リセットエラー:', error);
        }
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 初期化状態を取得
     * @returns {boolean} 初期化されているかどうか
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            elements: Object.keys(this.elements).reduce((acc, key) => {
                acc[key] = !!this.elements[key];
                return acc;
            }, {}),
            animations: Object.keys(this.animations).length
        };
    }
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressUI;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.ProgressUI = ProgressUI;
}
