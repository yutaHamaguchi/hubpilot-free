/**
 * ResourceManager - リソース管理クラス
 *
 * メモリリーク防止、適切なクリーンアップ処理、同時実行数制限を管理します。
 * パフォーマンス最適化の一環として、システムリソースを効率的に管理します。
 */

class ResourceManager {
    constructor() {
        // リソース管理設定
        this.config = {
            maxMemoryUsage: 150,        // 最大メモリ使用量（MB）
            maxConcurrentOperations: 3, // 最大同時実行数
            cleanupInterval: 30000,     // クリーンアップ間隔（30秒）
            memoryCheckInterval: 10000, // メモリチェック間隔（10秒）
            maxCacheSize: 50,          // 最大キャッシュサイズ
            maxLogEntries: 100         // 最大ログエントリ数
        };

        // 管理対象リソース
        this.resources = {
            activeOperations: new Map(),
            timers: new Set(),
            eventListeners: new Map(),
            caches: new Map(),
            temporaryData: new Map()
        };

        // 統計情報
        this.stats = {
            totalOperations: 0,
            cleanupCount: 0,
            memoryWarnings: 0,
            resourceLeaks: 0
        };

        // 自動クリーンアップの開始
        this.startAutoCleanup();

        console.log('✅ ResourceManager初期化完了');
    }

    /**
     * 操作リソースを登録
     * @param {string} operationId - 操作ID
     * @param {Object} resource - リソース情報
     */
    registerOperation(operationId, resource) {
        // 同時実行数チェック
        if (this.resources.activeOperations.size >= this.config.maxConcurrentOperations) {
            // 優先度に基づく操作の強制終了を試行
            if (!this.tryForceTerminateOperation()) {
                throw new Error(`同時実行数制限に達しました（最大${this.config.maxConcurrentOperations}）`);
            }
        }

        // 操作の優先度を設定（デフォルトは中）
        const priority = resource.priority || 'medium';

        this.resources.activeOperations.set(operationId, {
            ...resource,
            priority,
            startTime: Date.now(),
            memoryAtStart: this.getCurrentMemoryUsage()
        });

        this.stats.totalOperations++;

        console.log(`📝 操作を登録しました: ${operationId} (優先度: ${priority}, アクティブ: ${this.resources.activeOperations.size})`);
    }

    /**
     * 低優先度の操作を強制終了して空きを作る
     * @returns {boolean} 終了に成功したかどうか
     */
    tryForceTerminateOperation() {
        // 優先度の低い操作を探す
        let lowestPriorityOperation = null;
        let lowestPriorityScore = Infinity;

        const priorityScores = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };

        for (const [operationId, operation] of this.resources.activeOperations) {
            const score = priorityScores[operation.priority] || 2;
            const age = Date.now() - operation.startTime;

            // 優先度が低く、実行時間が長い操作を対象とする
            if (score < lowestPriorityScore || (score === lowestPriorityScore && age > 60000)) {
                lowestPriorityScore = score;
                lowestPriorityOperation = { id: operationId, ...operation };
            }
        }

        // 低優先度の操作が見つかった場合は強制終了
        if (lowestPriorityOperation && lowestPriorityScore <= 2) { // medium以下
            console.warn(`⚠️ 同時実行数制限のため低優先度操作を強制終了: ${lowestPriorityOperation.id}`);

            // AbortControllerで操作を中止
            if (lowestPriorityOperation.abortController) {
                lowestPriorityOperation.abortController.abort();
            }

            this.unregisterOperation(lowestPriorityOperation.id);
            return true;
        }

        return false;
    }

    /**
     * 操作リソースを解放
     * @param {string} operationId - 操作ID
     */
    unregisterOperation(operationId) {
        const resource = this.resources.activeOperations.get(operationId);

        if (resource) {
            // リソースのクリーンアップ
            this.cleanupOperationResource(resource);

            this.resources.activeOperations.delete(operationId);

            const duration = Date.now() - resource.startTime;
            console.log(`🗑️ 操作を解放しました: ${operationId} (実行時間: ${duration}ms)`);
        }
    }

    /**
     * 操作リソースのクリーンアップ
     * @param {Object} resource - リソース情報
     */
    cleanupOperationResource(resource) {
        try {
            // タイマーのクリア
            if (resource.timers) {
                resource.timers.forEach(timerId => {
                    clearTimeout(timerId);
                    clearInterval(timerId);
                });
            }

            // イベントリスナーの削除
            if (resource.eventListeners) {
                resource.eventListeners.forEach(({ element, event, handler }) => {
                    element.removeEventListener(event, handler);
                });
            }

            // 一時データの削除
            if (resource.temporaryData) {
                resource.temporaryData.clear();
            }

            // AbortControllerの中止
            if (resource.abortController) {
                resource.abortController.abort();
            }

        } catch (error) {
            console.error('❌ リソースクリーンアップ中にエラーが発生:', error);
            this.stats.resourceLeaks++;
        }
    }

    /**
     * タイマーを登録
     * @param {number} timerId - タイマーID
     * @param {string} operationId - 関連する操作ID
     */
    registerTimer(timerId, operationId = null) {
        this.resources.timers.add(timerId);

        if (operationId && this.resources.activeOperations.has(operationId)) {
            const operation = this.resources.activeOperations.get(operationId);
            if (!operation.timers) operation.timers = [];
            operation.timers.push(timerId);
        }
    }

    /**
     * タイマーを解放
     * @param {number} timerId - タイマーID
     */
    unregisterTimer(timerId) {
        clearTimeout(timerId);
        clearInterval(timerId);
        this.resources.timers.delete(timerId);
    }

    /**
     * イベントリスナーを登録
     * @param {Element} element - DOM要素
     * @param {string} event - イベント名
     * @param {Function} handler - ハンドラー関数
     * @param {string} operationId - 関連する操作ID
     */
    registerEventListener(element, event, handler, operationId = null) {
        const listenerId = `${element.id || 'unknown'}_${event}_${Date.now()}`;

        this.resources.eventListeners.set(listenerId, {
            element,
            event,
            handler
        });

        if (operationId && this.resources.activeOperations.has(operationId)) {
            const operation = this.resources.activeOperations.get(operationId);
            if (!operation.eventListeners) operation.eventListeners = [];
            operation.eventListeners.push({ element, event, handler });
        }

        element.addEventListener(event, handler);
        return listenerId;
    }

    /**
     * イベントリスナーを解放
     * @param {string} listenerId - リスナーID
     */
    unregisterEventListener(listenerId) {
        const listener = this.resources.eventListeners.get(listenerId);

        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            this.resources.eventListeners.delete(listenerId);
        }
    }

    /**
     * キャッシュデータを設定
     * @param {string} key - キー
     * @param {any} value - 値
     * @param {number} ttl - 生存時間（ミリ秒）
     */
    setCache(key, value, ttl = 300000) { // デフォルト5分
        // キャッシュサイズ制限チェック
        if (this.resources.caches.size >= this.config.maxCacheSize) {
            this.cleanupOldestCache();
        }

        this.resources.caches.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * キャッシュデータを取得
     * @param {string} key - キー
     * @returns {any} キャッシュされた値（期限切れの場合はnull）
     */
    getCache(key) {
        const cached = this.resources.caches.get(key);

        if (!cached) return null;

        // TTLチェック
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.resources.caches.delete(key);
            return null;
        }

        return cached.value;
    }

    /**
     * 最も古いキャッシュを削除
     */
    cleanupOldestCache() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, cached] of this.resources.caches) {
            if (cached.timestamp < oldestTime) {
                oldestTime = cached.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.resources.caches.delete(oldestKey);
        }
    }

    /**
     * 一時データを設定
     * @param {string} key - キー
     * @param {any} value - 値
     */
    setTemporaryData(key, value) {
        this.resources.temporaryData.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * 一時データを取得
     * @param {string} key - キー
     * @returns {any} 一時データ
     */
    getTemporaryData(key) {
        const data = this.resources.temporaryData.get(key);
        return data ? data.value : null;
    }

    /**
     * 現在のメモリ使用量を取得
     * @returns {number} メモリ使用量（MB）
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
    }

    /**
     * メモリ使用量をチェック
     */
    checkMemoryUsage() {
        const currentMemory = this.getCurrentMemoryUsage();

        if (currentMemory > this.config.maxMemoryUsage) {
            this.stats.memoryWarnings++;

            console.warn(`⚠️ メモリ使用量が制限を超えています: ${currentMemory.toFixed(2)}MB / ${this.config.maxMemoryUsage}MB`);

            // 緊急クリーンアップを実行
            this.performEmergencyCleanup();
        }
    }

    /**
     * 緊急クリーンアップを実行
     */
    performEmergencyCleanup() {
        console.log('🚨 緊急クリーンアップを実行中...');

        // 期限切れキャッシュを削除
        this.cleanupExpiredCaches();

        // 古い一時データを削除
        this.cleanupOldTemporaryData();

        // 長時間実行中の操作を警告
        this.warnLongRunningOperations();

        // メモリリーク検出と修復
        this.detectAndFixMemoryLeaks();

        // 不要なイベントリスナーを削除
        this.cleanupOrphanedEventListeners();

        console.log('✅ 緊急クリーンアップ完了');
    }

    /**
     * 期限切れキャッシュを削除
     */
    cleanupExpiredCaches() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, cached] of this.resources.caches) {
            if (now - cached.timestamp > cached.ttl) {
                this.resources.caches.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🗑️ 期限切れキャッシュを${cleanedCount}件削除しました`);
        }
    }

    /**
     * 古い一時データを削除
     */
    cleanupOldTemporaryData() {
        const now = Date.now();
        const maxAge = 600000; // 10分
        let cleanedCount = 0;

        for (const [key, data] of this.resources.temporaryData) {
            if (now - data.timestamp > maxAge) {
                this.resources.temporaryData.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🗑️ 古い一時データを${cleanedCount}件削除しました`);
        }
    }

    /**
     * 長時間実行中の操作を警告
     */
    warnLongRunningOperations() {
        const now = Date.now();
        const maxDuration = 300000; // 5分

        for (const [operationId, operation] of this.resources.activeOperations) {
            if (now - operation.startTime > maxDuration) {
                console.warn(`⚠️ 長時間実行中の操作: ${operationId} (${((now - operation.startTime) / 1000).toFixed(1)}秒)`);
            }
        }
    }

    /**
     * メモリリーク検出と修復
     */
    detectAndFixMemoryLeaks() {
        console.log('🔍 メモリリーク検出を実行中...');

        let leaksDetected = 0;

        // 1. 孤立したタイマーの検出と削除
        const orphanedTimers = [];
        for (const timerId of this.resources.timers) {
            // タイマーが実際に存在するかチェック（簡易的）
            try {
                clearTimeout(timerId);
                clearInterval(timerId);
                orphanedTimers.push(timerId);
            } catch (error) {
                // タイマーが既に無効な場合
                orphanedTimers.push(timerId);
            }
        }

        orphanedTimers.forEach(timerId => {
            this.resources.timers.delete(timerId);
            leaksDetected++;
        });

        // 2. 孤立したイベントリスナーの検出
        const orphanedListeners = [];
        for (const [listenerId, listener] of this.resources.eventListeners) {
            // DOM要素が存在するかチェック
            if (!document.contains(listener.element)) {
                orphanedListeners.push(listenerId);
            }
        }

        orphanedListeners.forEach(listenerId => {
            this.unregisterEventListener(listenerId);
            leaksDetected++;
        });

        // 3. 古いキャッシュエントリの強制削除
        const now = Date.now();
        const maxCacheAge = 3600000; // 1時間
        const oldCaches = [];

        for (const [key, cached] of this.resources.caches) {
            if (now - cached.timestamp > maxCacheAge) {
                oldCaches.push(key);
            }
        }

        oldCaches.forEach(key => {
            this.resources.caches.delete(key);
            leaksDetected++;
        });

        // 4. 大きすぎる一時データの削除
        const largeTempData = [];
        for (const [key, data] of this.resources.temporaryData) {
            const dataSize = JSON.stringify(data.value).length;
            if (dataSize > 1024 * 1024) { // 1MB以上
                largeTempData.push(key);
            }
        }

        largeTempData.forEach(key => {
            this.resources.temporaryData.delete(key);
            leaksDetected++;
        });

        if (leaksDetected > 0) {
            console.log(`🧹 メモリリーク修復完了: ${leaksDetected}件のリークを修復`);
            this.stats.resourceLeaks += leaksDetected;
        } else {
            console.log('✅ メモリリークは検出されませんでした');
        }
    }

    /**
     * 孤立したイベントリスナーをクリーンアップ
     */
    cleanupOrphanedEventListeners() {
        const orphanedListeners = [];

        for (const [listenerId, listener] of this.resources.eventListeners) {
            // DOM要素が存在しない、または親要素から切り離されている場合
            if (!listener.element ||
                !document.contains(listener.element) ||
                listener.element.parentNode === null) {
                orphanedListeners.push(listenerId);
            }
        }

        orphanedListeners.forEach(listenerId => {
            this.unregisterEventListener(listenerId);
        });

        if (orphanedListeners.length > 0) {
            console.log(`🧹 孤立したイベントリスナーを${orphanedListeners.length}件削除しました`);
        }
    }

    /**
     * 自動クリーンアップを開始
     */
    startAutoCleanup() {
        // 定期的なクリーンアップ
        const cleanupTimer = setInterval(() => {
            this.performRoutineCleanup();
        }, this.config.cleanupInterval);

        // メモリチェック
        const memoryTimer = setInterval(() => {
            this.checkMemoryUsage();
        }, this.config.memoryCheckInterval);

        this.registerTimer(cleanupTimer);
        this.registerTimer(memoryTimer);
    }

    /**
     * 定期クリーンアップを実行
     */
    performRoutineCleanup() {
        this.stats.cleanupCount++;

        this.cleanupExpiredCaches();
        this.cleanupOldTemporaryData();

        // 統計情報をログ出力
        if (this.stats.cleanupCount % 10 === 0) { // 10回に1回
            this.logResourceStats();
        }
    }

    /**
     * リソース統計をログ出力
     */
    logResourceStats() {
        console.log('📊 ========== リソース統計 ==========');
        console.log(`アクティブ操作: ${this.resources.activeOperations.size}`);
        console.log(`登録タイマー: ${this.resources.timers.size}`);
        console.log(`イベントリスナー: ${this.resources.eventListeners.size}`);
        console.log(`キャッシュエントリ: ${this.resources.caches.size}`);
        console.log(`一時データ: ${this.resources.temporaryData.size}`);
        console.log(`現在のメモリ使用量: ${this.getCurrentMemoryUsage().toFixed(2)}MB`);
        console.log(`総操作数: ${this.stats.totalOperations}`);
        console.log(`クリーンアップ回数: ${this.stats.cleanupCount}`);
        console.log(`メモリ警告回数: ${this.stats.memoryWarnings}`);
        console.log(`リソースリーク: ${this.stats.resourceLeaks}`);
        console.log('=====================================');
    }

    /**
     * 全リソースをクリーンアップ
     */
    cleanup() {
        console.log('🧹 ResourceManagerの全リソースをクリーンアップ中...');

        // アクティブ操作をすべて終了
        for (const [operationId] of this.resources.activeOperations) {
            this.unregisterOperation(operationId);
        }

        // タイマーをすべてクリア
        for (const timerId of this.resources.timers) {
            this.unregisterTimer(timerId);
        }

        // イベントリスナーをすべて削除
        for (const [listenerId] of this.resources.eventListeners) {
            this.unregisterEventListener(listenerId);
        }

        // キャッシュと一時データをクリア
        this.resources.caches.clear();
        this.resources.temporaryData.clear();

        console.log('✅ ResourceManagerのクリーンアップ完了');
    }
}

// グローバルインスタンス
window.resourceManager = new ResourceManager();

console.log('✅ ResourceManagerクラスが読み込まれました');
