/**
 * ログ機能クラス
 * 詳細なログ記録、パフォーマンス情報、デバッグ情報を管理
 *
 * 機能:
 * - 詳細なログ記録
 * - パフォーマンス情報の記録
 * - デバッグ情報の充実
 * - ログレベル管理
 *
 * 要件: 10.1, 10.2, 10.3, 10.4, 10.5
 */
class Logger {
    constructor() {
        // ログレベル定義
        this.LOG_LEVELS = {
            ERROR: { value: 0, name: 'エラー', color: '#ff4444' },
            WARN: { value: 1, name: '警告', color: '#ffaa00' },
            INFO: { value: 2, name: '情報', color: '#0088ff' },
            DEBUG: { value: 3, name: 'デバッグ', color: '#888888' },
            TRACE: { value: 4, name: 'トレース', color: '#666666' }
        };

        // 現在のログレベル（本番環境では INFO、開発環境では DEBUG）
        this.currentLogLevel = this.isProduction() ? this.LOG_LEVELS.INFO.value : this.LOG_LEVELS.DEBUG.value;

        // ログストレージ
        this.logs = [];
        this.performanceLogs = [];
        this.maxLogEntries = 1000;
        this.maxPerformanceEntries = 500;

        // パフォーマンス測定用
        this.performanceMarks = new Map();
        this.performanceTimers = new Map();

        // 統計情報
        this.stats = {
            totalLogs: 0,
            logsByLevel: {},
            logsByCategory: {},
            performanceMetrics: {},
            startTime: Date.now()
        };

        // 初期化
        this.initializeStats();
    }

    /**
     * 統計情報を初期化
     */
    initializeStats() {
        Object.keys(this.LOG_LEVELS).forEach(level => {
            this.stats.logsByLevel[level] = 0;
        });
    }

    /**
     * 本番環境かどうかを判定
     * @returns {boolean} 本番環境かどうか
     */
    isProduction() {
        return typeof window !== 'undefined' &&
               (window.location.hostname !== 'localhost' &&
                window.location.hostname !== '127.0.0.1' &&
                !window.location.hostname.includes('dev'));
    }

    /**
     * ログレベルを設定
     * @param {string} level - ログレベル（ERROR, WARN, INFO, DEBUG, TRACE）
     */
    setLogLevel(level) {
        if (this.LOG_LEVELS[level]) {
            this.currentLogLevel = this.LOG_LEVELS[level].value;
            this.info('Logger', `ログレベルを ${this.LOG_LEVELS[level].name} に設定しました`);
        } else {
            this.warn('Logger', `無効なログレベル: ${level}`);
        }
    }

    /**
     *録
     * @param {string} level - ログレベル
     * @param {string} category - カテゴリ
     * @param {string} message - メッセージ
     * @param {*} data - 追加データ
     */
    log(level, category, message, data = null) {
        try {
            const logLevel = this.LOG_LEVELS[level];

            if (!logLevel || logLevel.value > this.currentLogLevel) {
                return; // ログレベルが低い場合は記録しない
            }

            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                category,
                message,
                data,
                id: this.generateLogId()
            };

            // ログストレージに追加
            this.logs.unshift(logEntry);

            // ログサイズ制限
            if (this.logs.length > this.maxLogEntries) {
                this.logs = this.logs.slice(0, this.maxLogEntries);
            }

            // 統計更新
            this.updateStats(level, category);

            // コンソール出力
            this.outputToConsole(logEntry);

            // 重要なログはLocalStorageに保存
            if (level === 'ERROR' || level === 'WARN') {
                this.saveImportantLog(logEntry);
            }

        } catch (err) {
            console.error('ログ記録中にエラー:', err);
        }
    }

    /**
     * エラーログ
     * @param {string} category - カテゴリ
     * @param {string} message - メッセージ
     * @param {*} data - 追加データ
     */
    error(category, message, data = null) {
        this.log('ERROR', category, message, data);
    }

    /**
     * 警告ログ
     * @param {string} category - カテゴリ
     * @param {string} message - メッセージ
     * @param {*} data - 追加データ
     */
    warn(category, message, data = null) {
        this.log('WARN', category, message, data);
    }

    /**
     * 情報ログ
     * @param {string} category - カテゴリ
     * @param {string} message - メッセージ
     * @param {*} data - 追加データ
     */
    info(category, message, data = null) {
        this.log('INFO', category, message, data);
    }

    /**
     * デバッグログ
     * @param {string} category - カテゴリ
     * @param {string} message - メッセージ
     * @param {*} data - 追加データ
     */
    debug(category, message, data = null) {
        this.log('DEBUG', category, message, data);
    }

    /**
     * トレースログ
     * @param {string} category - カテゴリ
     * @param {string} message - メッセージ
     * @param {*} data - 追加データ
     */
    trace(category, message, data = null) {
        this.log('TRACE', category, message, data);
    }

    /**
     * パフォーマンス測定開始
     * @param {string} name - 測定名
     * @param {string} category - カテゴリ
     */
    startPerformance(name, category = 'Performance') {
        try {
            const startTime = performance.now();
            this.performanceTimers.set(name, {
                startTime,
                category,
                timestamp: new Date().toISOString()
            });

            this.debug(category, `パフォーマンス測定開始: ${name}`);

        } catch (err) {
            this.error('Logger', 'パフォーマンス測定開始エラー', err);
        }
    }

    /**
     * パフォーマンス測定終了
     * @param {string} name - 測定名
     * @param {Object} additionalData - 追加データ
     */
    endPerformance(name, additionalData = {}) {
        try {
            const timer = this.performanceTimers.get(name);
            if (!timer) {
                this.warn('Logger', `パフォーマンス測定が見つかりません: ${name}`);
                return null;
            }

            const endTime = performance.now();
            const duration = endTime - timer.startTime;

            const performanceEntry = {
                name,
                category: timer.category,
                duration: Math.round(duration * 100) / 100, // 小数点2桁まで
                startTime: timer.startTime,
                endTime,
                timestamp: timer.timestamp,
                additionalData,
                id: this.generateLogId()
            };

            // パフォーマンスログに追加
            this.performanceLogs.unshift(performanceEntry);

            // ログサイズ制限
            if (this.performanceLogs.length > this.maxPerformanceEntries) {
                this.performanceLogs = this.performanceLogs.slice(0, this.maxPerformanceEntries);
            }

            // タイマーを削除
            this.performanceTimers.delete(name);

            // 統計更新
            this.updatePerformanceStats(name, duration);

            // ログ出力
            this.info(timer.category, `パフォーマンス測定完了: ${name} (${duration.toFixed(2)}ms)`, additionalData);

            return performanceEntry;

        } catch (err) {
            this.error('Logger', 'パフォーマンス測定終了エラー', err);
            return null;
        }
    }

    /**
     * 操作をパフォーマンス測定付きで実行
     * @param {string} name - 測定名
     * @param {Function} operation - 実行する操作
     * @param {string} category - カテゴリ
     * @returns {*} 操作の結果
     */
    async measurePerformance(name, operation, category = 'Performance') {
        this.startPerformance(name, category);

        try {
            const result = await operation();
            this.endPerformance(name, { success: true });
            return result;
        } catch (error) {
            this.endPerformance(name, { success: false, error: error.message });
            throw error;
        }
    }

    /**
     * ログIDを生成
     * @returns {string} ログID
     */
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 統計情報を更新
     * @param {string} level - ログレベル
     * @param {string} category - カテゴリ
     */
    updateStats(level, category) {
        this.stats.totalLogs++;
        this.stats.logsByLevel[level] = (this.stats.logsByLevel[level] || 0) + 1;
        this.stats.logsByCategory[category] = (this.stats.logsByCategory[category] || 0) + 1;
    }

    /**
     * パフォーマンス統計を更新
     * @param {string} name - 測定名
     * @param {number} duration - 実行時間
     */
    updatePerformanceStats(name, duration) {
        if (!this.stats.performanceMetrics[name]) {
            this.stats.performanceMetrics[name] = {
                count: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0
            };
        }

        const metric = this.stats.performanceMetrics[name];
        metric.count++;
        metric.totalTime += duration;
        metric.averageTime = metric.totalTime / metric.count;
        metric.minTime = Math.min(metric.minTime, duration);
        metric.maxTime = Math.max(metric.maxTime, duration);
    }

    /**
     * コンソールに出力
     * @param {Object} logEntry - ログエントリ
     */
    outputToConsole(logEntry) {
        try {
            const { timestamp, level, category, message, data } = logEntry;
            const logLevel = this.LOG_LEVELS[level];
            const timeStr = new Date(timestamp).toLocaleTimeString('ja-JP');

            const prefix = `[${timeStr}] ${logLevel.name}[${category}]:`;

            // ブラウザ環境でのカラー出力
            if (typeof window !== 'undefined' && window.console) {
                const style = `color: ${logLevel.color}; font-weight: bold;`;

                if (data !== null && data !== undefined) {
                    console.log(`%c${prefix}`, style, message, data);
                } else {
                    console.log(`%c${prefix}`, style, message);
                }
            } else {
                // Node.js環境での出力
                if (data !== null && data !== undefined) {
                    console.log(prefix, message, data);
                } else {
                    console.log(prefix, message);
                }
            }

        } catch (err) {
            console.error('コンソール出力エラー:', err);
        }
    }

    /**
     * 重要なログをLocalStorageに保存
     * @param {Object} logEntry - ログエントリ
     */
    saveImportantLog(logEntry) {
        try {
            if (typeof localStorage === 'undefined') return;

            const key = 'hubpilot_important_logs';
            const importantLogs = JSON.parse(localStorage.getItem(key) || '[]');

            importantLogs.unshift(logEntry);

            // 最新50件のみ保持
            const limitedLogs = importantLogs.slice(0, 50);
            localStorage.setItem(key, JSON.stringify(limitedLogs));

        } catch (err) {
            console.error('重要ログ保存エラー:', err);
        }
    }

    /**
     * ログを取得
     * @param {Object} options - 取得オプション
     * @returns {Array} ログ配列
     */
    getLogs(options = {}) {
        const {
            level = null,
            category = null,
            limit = 100,
            startTime = null,
            endTime = null
        } = options;

        let filteredLogs = [...this.logs];

        // レベルフィルタ
        if (level) {
            filteredLogs = filteredLogs.filter(log => log.level === level);
        }

        // カテゴリフィルタ
        if (category) {
            filteredLogs = filteredLogs.filter(log => log.category === category);
        }

        // 時間範囲フィルタ
        if (startTime) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startTime));
        }
        if (endTime) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endTime));
        }

        return filteredLogs.slice(0, limit);
    }

    /**
     * パフォーマンスログを取得
     * @param {Object} options - 取得オプション
     * @returns {Array} パフォーマンスログ配列
     */
    getPerformanceLogs(options = {}) {
        const {
            name = null,
            category = null,
            limit = 100,
            minDuration = null,
            maxDuration = null
        } = options;

        let filteredLogs = [...this.performanceLogs];

        // 名前フィルタ
        if (name) {
            filteredLogs = filteredLogs.filter(log => log.name === name);
        }

        // カテゴリフィルタ
        if (category) {
            filteredLogs = filteredLogs.filter(log => log.category === category);
        }

        // 実行時間フィルタ
        if (minDuration !== null) {
            filteredLogs = filteredLogs.filter(log => log.duration >= minDuration);
        }
        if (maxDuration !== null) {
            filteredLogs = filteredLogs.filter(log => log.duration <= maxDuration);
        }

        return filteredLogs.slice(0, limit);
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;

        return {
            ...this.stats,
            uptime: uptime,
            uptimeFormatted: this.formatDuration(uptime),
            currentLogLevel: Object.keys(this.LOG_LEVELS).find(
                key => this.LOG_LEVELS[key].value === this.currentLogLevel
            ),
            memoryUsage: this.getMemoryUsage(),
            activeTimers: this.performanceTimers.size
        };
    }

    /**
     * メモリ使用量を取得
     * @returns {Object} メモリ使用量情報
     */
    getMemoryUsage() {
        try {
            if (typeof performance !== 'undefined' && performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
                    unit: 'MB'
                };
            }
        } catch (err) {
            // メモリ情報が取得できない場合は無視
        }

        return null;
    }

    /**
     * 時間を人間が読みやすい形式にフォーマット
     * @param {number} milliseconds - ミリ秒
     * @returns {string} フォーマットされた時間
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}日 ${hours % 24}時間 ${minutes % 60}分`;
        } else if (hours > 0) {
            return `${hours}時間 ${minutes % 60}分`;
        } else if (minutes > 0) {
            return `${minutes}分 ${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    /**
     * ログをクリア
     * @param {string} type - クリアするログタイプ（'all', 'logs', 'performance'）
     */
    clearLogs(type = 'all') {
        try {
            if (type === 'all' || type === 'logs') {
                this.logs = [];
                this.stats.totalLogs = 0;
                this.stats.logsByLevel = {};
                this.stats.logsByCategory = {};
                this.initializeStats();
            }

            if (type === 'all' || type === 'performance') {
                this.performanceLogs = [];
                this.stats.performanceMetrics = {};
                this.performanceTimers.clear();
            }

            if (type === 'all') {
                localStorage.removeItem('hubpilot_important_logs');
            }

            this.info('Logger', `ログをクリアしました: ${type}`);

        } catch (err) {
            this.error('Logger', 'ログクリアエラー', err);
        }
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            logCount: this.logs.length,
            performanceLogCount: this.performanceLogs.length,
            activeTimers: this.performanceTimers.size,
            currentLogLevel: this.currentLogLevel,
            maxLogEntries: this.maxLogEntries,
            maxPerformanceEntries: this.maxPerformanceEntries,
            stats: this.getStats(),
            memoryUsage: this.getMemoryUsage()
        };
    }
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}
