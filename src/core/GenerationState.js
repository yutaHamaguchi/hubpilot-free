/**
 * GenerationState - 記事生成の状態管理を行うクラス
 */
class GenerationState {
    constructor() {
        this.notificationService = null;
        this.status = 'idle';
        this.progress = {
            current: 0,
            total: 0,
            percentage: 0
        };
        this.startTime = null;
        this.endTime = null;
        this.currentItem = null;
        this.errors = [];
    }

    /**
     * 依存関係を設定
     */
    setDependencies(notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * 生成を開始
     * @param {number} totalItems - 生成する総アイテム数
     */
    start(totalItems) {
        this.status = 'generating';
        this.progress = {
            current: 0,
            total: totalItems,
            percentage: 0
        };
        this.startTime = new Date();
        this.endTime = null;
        this.currentItem = null;
        this.errors = [];

        console.log(`Generation started: ${totalItems} items`);
    }

    /**
     * 進捗を更新
     * @param {number} current - 現在の進捗
     * @param {number} total - 総数
     * @param {string} currentItem - 現在処理中のアイテム
     */
    updateProgress(current, total, currentItem = null) {
        this.progress.current = current;
        this.progress.total = total;
        this.progress.percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        this.currentItem = currentItem;

        console.log(`Progress: ${current}/${total} (${this.progress.percentage}%)`);

        if (currentItem) {
            console.log(`Current item: ${currentItem}`);
        }
    }

    /**
     * 生成を完了
     */
    complete() {
        this.status = 'completed';
        this.endTime = new Date();
        this.progress.percentage = 100;

        const duration = this.getDuration();
        console.log(`Generation completed in ${duration}ms`);

        if (this.notificationService) {
            this.notificationService.success('生成が完了しました');
        }
    }

    /**
     * 生成を一時停止
     */
    pause() {
        if (this.status === 'generating') {
            this.status = 'paused';
            console.log('Generation paused');

            if (this.notificationService) {
                this.notificationService.info('生成を一時停止しました');
            }
        }
    }

    /**
     * 生成を再開
     */
    resume() {
        if (this.status === 'paused') {
            this.status = 'generating';
            console.log('Generation resumed');

            if (this.notificationService) {
                this.notificationService.info('生成を再開しました');
            }
        }
    }

    /**
     * 生成をキャンセル
     */
    cancel() {
        this.status = 'cancelled';
        this.endTime = new Date();
        console.log('Generation cancelled');

        if (this.notificationService) {
            this.notificationService.warning('生成をキャンセルしました');
        }
    }

    /**
     * エラーを記録
     * @param {string} message - エラーメッセージ
     * @param {Error} error - エラーオブジェクト
     */
    error(message, error = null) {
        this.status = 'error';
        this.endTime = new Date();

        const errorInfo = {
            message,
            error: error ? error.message : null,
            timestamp: new Date().toISOString(),
            currentItem: this.currentItem
        };

        this.errors.push(errorInfo);
        console.error('Generation error:', errorInfo);

        if (this.notificationService) {
            this.notificationService.error(message);
        }
    }

    /**
     * 現在の状態を取得
     * @returns {Object} - 状態情報
     */
    getStatus() {
        return {
            status: this.status,
            progress: { ...this.progress },
            currentItem: this.currentItem,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.getDuration(),
            errors: [...this.errors],
            isActive: this.isActive(),
            estimatedTimeRemaining: this.getEstimatedTimeRemaining()
        };
    }

    /**
     * 生成がアクティブかどうか
     * @returns {boolean} - アクティブな場合true
     */
    isActive() {
        return this.status === 'generating' || this.status === 'paused';
    }

    /**
     * 生成時間を取得
     * @returns {number} - 生成時間（ミリ秒）
     */
    getDuration() {
        if (!this.startTime) return 0;

        const endTime = this.endTime || new Date();
        return endTime.getTime() - this.startTime.getTime();
    }

    /**
     * 推定残り時間を取得
     * @returns {number} - 推定残り時間（ミリ秒）
     */
    getEstimatedTimeRemaining() {
        if (!this.isActive() || this.progress.current === 0) {
            return 0;
        }

        const elapsed = this.getDuration();
        const avgTimePerItem = elapsed / this.progress.current;
        const remainingItems = this.progress.total - this.progress.current;

        return Math.round(avgTimePerItem * remainingItems);
    }

    /**
     * 統計情報を取得
     * @returns {Object} - 統計情報
     */
    getStats() {
        const duration = this.getDuration();
        const itemsPerSecond = this.progress.current > 0 && duration > 0
            ? (this.progress.current / (duration / 1000))
            : 0;

        return {
            totalItems: this.progress.total,
            completedItems: this.progress.current,
            remainingItems: this.progress.total - this.progress.current,
            percentage: this.progress.percentage,
            duration: duration,
            itemsPerSecond: Math.round(itemsPerSecond * 100) / 100,
            errorCount: this.errors.length,
            status: this.status
        };
    }

    /**
     * 状態をリセット
     */
    reset() {
        this.status = 'idle';
        this.progress = {
            current: 0,
            total: 0,
            percentage: 0
        };
        this.startTime = null;
        this.endTime = null;
        this.currentItem = null;
        this.errors = [];

        console.log('Generation state reset');
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.GenerationState = GenerationState;
}
