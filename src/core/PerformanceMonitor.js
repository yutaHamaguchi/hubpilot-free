/**
 * PerformanceMonitor - パフォーマンス監視クラス
 *
 * 記事生成プロセスのパフォーマンス監視と最適化を担当します。
 * 処理時間の測定、メモリ使用量の監視、リソース管理を行います。
 */

class PerformanceMonitor {
    constructor() {
        // パフォーマンス指標を保存
        this.metrics = {
            operationTimes: new Map(),
            memoryUsage: [],
            concurrentOperations: 0,
            maxConcurrentOperations: 3, // 同時実行数制限
            timeouts: {
                aiApiCall: 30000,      // AI API呼び出しタイムアウト（30秒）
                edgeFunction: 45000,   // Edge Functionタイムアウト（45秒）
                dataOperation: 10000   // データ操作タイムアウト（10秒）
            }
        };

        // メモリ監視の開始
        this.startMemoryMonitoring();

        console.log('✅ PerformanceMonitor初期化完了');
    }

    /**
     * 操作のパフォーマンスを測定
     * @param {string} operationName - 操作名
     * @param {Function} operation - 実行する操作
     * @param {Object} options - オプション設定
     * @returns {Promise<any>} 操作結果
     */
    async trackOperation(operationName, operation, options = {}) {
        const startTime = performance.now();
        const startMemory = this.getCurrentMemoryUsage();

        try {
            // 同時実行数チェック
            if (this.metrics.concurrentOperations >= this.metrics.maxConcurrentOperations) {
                throw new Error(`同時実行数制限に達しました（最大${this.metrics.maxConcurrentOperations}）`);
            }

            this.metrics.concurrentOperations++;

            // タイムアウト設定
            const timeout = options.timeout || this.getDefaultTimeout(operationName);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`操作がタイムアウトしました: ${operationName}`)), timeout);
            });

            // 操作実行（タイムアウト
          const result = await Promise.race([
                operation(),
                timeoutPromise
            ]);

            // パフォーマンス指標を記録
            const endTime = performance.now();
            const duration = endTime - startTime;
            const endMemory = this.getCurrentMemoryUsage();
            const memoryDelta = endMemory - startMemory;

            this.recordMetrics(operationName, {
                duration,
                startTime,
                endTime,
                memoryUsage: endMemory,
                memoryDelta,
                success: true
            });

            console.log(`📊 [Performance] ${operationName}: ${duration.toFixed(2)}ms, メモリ: ${memoryDelta > 0 ? '+' : ''}${memoryDelta.toFixed(2)}MB`);

            return result;

        } catch (error) {
            // エラー時もメトリクスを記録
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.recordMetrics(operationName, {
                duration,
                startTime,
                endTime,
                success: false,
                error: error.message
            });

            console.error(`❌ [Performance] ${operationName}失敗: ${duration.toFixed(2)}ms, エラー: ${error.message}`);
            throw error;

        } finally {
            this.metrics.concurrentOperations--;
        }
    }

    /**
     * デフォルトタイムアウトを取得
     * @param {string} operationName - 操作名
     * @returns {number} タイムアウト時間（ミリ秒）
     */
    getDefaultTimeout(operationName) {
        if (operationName.includes('AI') || operationName.includes('api')) {
            return this.metrics.timeouts.aiApiCall;
        }
        if (operationName.includes('edge') || operationName.includes('function')) {
            return this.metrics.timeouts.edgeFunction;
        }
        if (operationName.includes('data') || operationName.includes('save')) {
            return this.metrics.timeouts.dataOperation;
        }
        return 15000; // デフォルト15秒
    }

    /**
     * 現在のメモリ使用量を取得
     * @returns {number} メモリ使用量（MB）
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1024 / 1024; // MB単位
        }
        return 0; // ブラウザがサポートしていない場合
    }

    /**
     * メトリクスを記録
     * @param {string} operationName - 操作名
     * @param {Object} metrics - メトリクス情報
     */
    recordMetrics(operationName, metrics) {
        if (!this.metrics.operationTimes.has(operationName)) {
            this.metrics.operationTimes.set(operationName, []);
        }

        const operationMetrics = this.metrics.operationTimes.get(operationName);
        operationMetrics.push({
            ...metrics,
            timestamp: new Date().toISOString()
        });

        // 最新100件のみ保持（メモリ使用量制限）
        if (operationMetrics.length > 100) {
            operationMetrics.splice(0, operationMetrics.length - 100);
        }
    }

    /**
     * メモリ監視を開始
     */
    startMemoryMonitoring() {
        setInterval(() => {
            const currentMemory = this.getCurrentMemoryUsage();
            this.metrics.memoryUsage.push({
                usage: currentMemory,
                timestamp: new Date().toISOString()
            });

            // 最新50件のみ保持
            if (this.metrics.memoryUsage.length > 50) {
                this.metrics.memoryUsage.splice(0, this.metrics.memoryUsage.length - 50);
            }

            // メモリ使用量が過大な場合の警告
            if (currentMemory > 100) { // 100MB以上
                console.warn(`⚠️ メモリ使用量が高くなっています: ${currentMemory.toFixed(2)}MB`);
                this.suggestCleanup();
            }

        }, 10000); // 10秒間隔
    }

    /**
     * クリーンアップを提案
     */
    suggestCleanup() {
        console.log('💡 パフォーマンス改善のため、以下を実行することをお勧めします:');
        console.log('   - 不要なデータの削除');
        console.log('   - ブラウザタブの整理');
        console.log('   - ページの再読み込み');
    }

    /**
     * 同時実行数制限を設定
     * @param {number} maxConcurrent - 最大同時実行数
     */
    setMaxConcurrentOperations(maxConcurrent) {
        this.metrics.maxConcurrentOperations = maxConcurrent;
        console.log(`📊 同時実行数制限を${maxConcurrent}に設定しました`);
    }

    /**
     * タイムアウト設定を更新
     * @param {Object} timeouts - タイムアウト設定
     */
    updateTimeouts(timeouts) {
        this.metrics.timeouts = { ...this.metrics.timeouts, ...timeouts };
        console.log('📊 タイムアウト設定を更新しました:', this.metrics.timeouts);
    }

    /**
     * パフォーマンス統計を取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        const stats = {
            totalOperations: 0,
            averageDuration: 0,
            successRate: 0,
            currentMemoryUsage: this.getCurrentMemoryUsage(),
            concurrentOperations: this.metrics.concurrentOperations,
            operationBreakdown: {}
        };

        let totalDuration = 0;
        let totalSuccess = 0;

        for (const [operationName, metrics] of this.metrics.operationTimes) {
            const operationStats = {
                count: metrics.length,
                averageDuration: 0,
                successRate: 0,
                lastExecution: metrics.length > 0 ? metrics[metrics.length - 1].timestamp : null
            };

            if (metrics.length > 0) {
                const durations = metrics.map(m => m.duration);
                const successes = metrics.filter(m => m.success).length;

                operationStats.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
                operationStats.successRate = (successes / metrics.length) * 100;

                totalDuration += durations.reduce((a, b) => a + b, 0);
                totalSuccess += successes;
                stats.totalOperations += metrics.length;
            }

            stats.operationBreakdown[operationName] = operationStats;
        }

        if (stats.totalOperations > 0) {
            stats.averageDuration = totalDuration / stats.totalOperations;
            stats.successRate = (totalSuccess / stats.totalOperations) * 100;
        }

        return stats;
    }

    /**
     * パフォーマンスレポートを表示
     */
    showPerformanceReport() {
        const stats = this.getPerformanceStats();

        console.log('📊 ========== パフォーマンスレポート ==========');
        console.log(`総操作数: ${stats.totalOperations}`);
        console.log(`平均実行時間: ${stats.averageDuration.toFixed(2)}ms`);
        console.log(`成功率: ${stats.successRate.toFixed(1)}%`);
        console.log(`現在のメモリ使用量: ${stats.currentMemoryUsage.toFixed(2)}MB`);
        console.log(`同時実行中の操作: ${stats.concurrentOperations}`);

        console.log('\n📈 操作別統計:');
        for (const [operationName, operationStats] of Object.entries(stats.operationBreakdown)) {
            console.log(`  ${operationName}:`);
            console.log(`    実行回数: ${operationStats.count}`);
            console.log(`    平均時間: ${operationStats.averageDuration.toFixed(2)}ms`);
            console.log(`    成功率: ${operationStats.successRate.toFixed(1)}%`);
            console.log(`    最終実行: ${operationStats.lastExecution || 'なし'}`);
        }

        console.log('===============================================');
    }

    /**
     * リソースクリーンアップ
     */
    cleanup() {
        // メトリクスデータをクリア
        this.metrics.operationTimes.clear();
        this.metrics.memoryUsage = [];
        this.metrics.concurrentOperations = 0;

        console.log('🧹 PerformanceMonitorのリソースをクリーンアップしました');
    }
}

// グローバルインスタンス
window.performanceMonitor = new PerformanceMonitor();

console.log('✅ PerformanceMonitorクラスが読み込まれました');
