/**
 * GenerationState - 記事生成の状態管理を担当するクラス
 */
class GenerationState {
    constructor() {
        // 状態の種類: 'idle', 'generating', 'paused', 'cancelled', 'completed'
        this.status = 'idle';
        this.currentIndex = 0;
        this.totalCount = 0;
        this.startTime = null;
        this.endTime = null;
        this.errors = [];
        this.listeners = new Map();
    }

    /**
     * 状態をリセット
     */
    reset() {
        this.status = 'idle';
        this.currentIndex = 0;
        this.totalCount = 0;
        this.startTime = null;
        this.endTime = null;
        this.errors = [];
        this.notifyListeners('reset');
    }

    /**
     * 生成を開始
     * @param {number} totalCount - 生成する記事の総数
     */
    start(totalCount) {
        this.status = 'generating';
        this.currentIndex = 0;
        this.totalCount = totalCount;
        this.startTime = new Date();
        this.endTime = null;
        this.errors = [];
        this.notifyListeners('start');
    }

    /**
     * 生成を一時停止
     */
    pause() {
        if (this.status === 'generating') {
            this.status = 'paused';
            this.notifyListeners('pause');
        }
    }

    /**
     * 生成を再開
     */
    resume() {
        if (this.status === 'paused') {
            this.status = 'generating';
            this.notifyListeners('resume');
        }
    }

    /**
     * 生成をキャンセル
     */
    cancel() {
        if (this.status === 'generating' || this.status === 'paused') {
            this.status = 'cancelled';
            this.endTime = new Date();
            this.notifyListeners('cancel');
        }
    }

    /**
     * 生成を完了
     */
    complete() {
        this.status = 'completed';
        this.endTime = new Date();
        this.notifyListeners('complete');
    }

    /**
     * 次の項目に進む
     */
    next() {
        if (this.currentIndex < this.totalCount) {
            this.currentIndex++;
            this.notifyListeners('progress');
        }

        if (this.currentIndex >= this.totalCount) {
            this.complete();
        }
    }

    /**
     * エラーを追加
     * @param {number} index - エラーが発生したインデックス
     * @param {Error} error - エラーオブジェクト
     */
    addError(index, error) {
        this.errors.push({
            index,
            error,
            timestamp: new Date()
        });
        this.notifyListeners('error');
    }

    /**
     * 状態チェックメソッド
     */
    isIdle() {
        return this.status === 'idle';
    }

    isGenerating() {
        return this.status === 'generating';
    }

    isPaused() {
        return this.status === 'paused';
    }

    isCancelled() {
        return this.status === 'cancelled';
    }

    isCompleted() {
        return this.status === 'completed';
    }

    isActive() {
        return this.status === 'generating' || this.status === 'paused';
    }

    /**
     * 進捗情報を取得
     * @returns {Object} - 進捗情報
     */
    getProgress() {
        return {
            current: this.currentIndex,
            total: this.totalCount,
            percentage: this.totalCount > 0 ? Math.round((this.currentIndex / this.totalCount) * 100) : 0
        };
    }

    /**
     * 経過時間を取得（ミリ秒）
     * @returns {number} - 経過時間
     */
    getElapsedTime() {
        if (!this.startTime) return 0;

        const endTime = this.endTime || new Date();
        return endTime - this.startTime;
    }

    /**
     * 経過時間を読みやすい形式で取得
     * @returns {string} - フォーマットされた経過時間
     */
    getFormattedElapsedTime() {
        const elapsed = this.getElapsedTime();
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}時間${minutes % 60}分${seconds % 60}秒`;
        } else if (minutes > 0) {
            return `${minutes}分${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    /**
     * 残り時間を推定（ミリ秒）
     * @returns {number} - 推定残り時間
     */
    getEstimatedTimeRemaining() {
        if (this.currentIndex === 0) return 0;

        const elapsed = this.getElapsedTime();
        const averageTimePerItem = elapsed / this.currentIndex;
        const remainingItems = this.totalCount - this.currentIndex;

        return Math.round(averageTimePerItem * remainingItems);
    }

    /**
     * 残り時間を読みやすい形式で取得
     * @returns {string} - フォーマットされた残り時間
     */
    getFormattedTimeRemaining() {
        const remaining = this.getEstimatedTimeRemaining();
        const seconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `残り約${hours}時間${minutes % 60}分`;
        } else if (minutes > 0) {
            return `残り約${minutes}分`;
        } else {
            return `残り約${seconds}秒`;
        }
    }

    /**
     * 状態情報を取得
     * @returns {Object} - 状態情報
     */
    getState() {
        return {
            status: this.status,
            progress: this.getProgress(),
            elapsedTime: this.getElapsedTime(),
            formattedElapsedTime: this.getFormattedElapsedTime(),
            estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
            formattedTimeRemaining: this.getFormattedTimeRemaining(),
            errorCount: this.errors.length,
            errors: [...this.errors]
        };
    }

    /**
     * イベントリスナーを追加
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * イベントリスナーを削除
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * リスナーに通知
     * @param {string} event - イベント名
     */
    notifyListeners(event) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const state = this.getState();

            callbacks.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }
}

// グローバルインスタンスをエクスポート
if (typeof window !== 'undefined') {
    window.GenerationState = GenerationState;
}
