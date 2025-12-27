/**
 * ErrorHandler - エラーハンドリングを統一管理するクラス
 */
class ErrorHandler {
    constructor(notificationService = null) {
        this.notificationService = notificationService;
        this.errorLog = [];
        this.maxLogSize = 100;

        // エラータイプの定義
        this.errorTypes = {
            NETWORK: 'network',
            VALIDATION: 'validation',
            STORAGE: 'storage',
            API: 'api',
            PARSING: 'parsing',
            PERMISSION: 'permission',
            UNKNOWN: 'unknown'
        };

        this.setupGlobalHandlers();
    }

    /**
     * グローバルエラーハンドラーをセットアップ
     */
    setupGlobalHandlers() {
        // 未処理のエラーをキャッチ
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, event);
        });

        // 未処理のPromise拒否をキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, event);
        });
    }

    /**
     * グローバルエラーを処理
     * @param {Error} error - エラーオブジェクト
     * @param {Event} event - イベントオブジェクト
     */
    handleGlobalError(error, event) {
        console.error('Global error caught:', error);
        this.logError(error, 'global');

        // ユーザーに通知（開発環境のみ）
        if (this.isDevelopment()) {
            this.notify('予期しないエラーが発生しました', 'error');
        }
    }

    /**
     * エラーを処理
     * @param {Error} error - エラーオブジェクト
     * @param {string} context - コンテキスト
     * @param {Object} options - オプション
     */
    handle(error, context = 'unknown', options = {}) {
        const errorInfo = this.classifyError(error, context);
        this.logError(errorInfo, context);

        const userMessage = options.customMessage || this.getUserMessage(errorInfo);
        const shouldNotify = options.notify !== false;

        if (shouldNotify && this.notificationService) {
            this.notificationService.error(userMessage);
        }

        // デバッグモードの場合は詳細を表示
        if (this.isDevelopment() && options.showDetails) {
            console.group(`Error in ${context}`);
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Stack:', error.stack);
            console.groupEnd();
        }

        return errorInfo;
    }

    /**
     * エラーを分類
     * @param {Error} error - エラーオブジェクト
     * @param {string} context - コンテキスト
     * @returns {Object} - エラー情報
     */
    classifyError(error, context) {
        const errorInfo = {
            type: this.errorTypes.UNKNOWN,
            originalError: error,
            message: error.message || 'Unknown error',
            context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };

        // エラーメッセージからタイプを推定
        const message = error.message?.toLowerCase() || '';

        if (message.includes('network') || message.includes('fetch') || error.name === 'NetworkError') {
            errorInfo.type = this.errorTypes.NETWORK;
        } else if (message.includes('quota') || message.includes('storage')) {
            errorInfo.type = this.errorTypes.STORAGE;
        } else if (message.includes('json') || message.includes('parse')) {
            errorInfo.type = this.errorTypes.PARSING;
        } else if (message.includes('permission') || message.includes('denied')) {
            errorInfo.type = this.errorTypes.PERMISSION;
        } else if (error.name === 'ValidationError' || context.includes('validation')) {
            errorInfo.type = this.errorTypes.VALIDATION;
        } else if (context.includes('api') || message.includes('api')) {
            errorInfo.type = this.errorTypes.API;
        }

        return errorInfo;
    }

    /**
     * ユーザー向けメッセージを取得
     * @param {Object} errorInfo - エラー情報
     * @returns {string} - ユーザー向けメッセージ
     */
    getUserMessage(errorInfo) {
        const messages = {
            [this.errorTypes.NETWORK]: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
            [this.errorTypes.VALIDATION]: '入力内容に問題があります。入力内容を確認してください。',
            [this.errorTypes.STORAGE]: 'ストレージの容量が不足しています。不要なデータを削除してください。',
            [this.errorTypes.API]: 'APIエラーが発生しました。しばらくしてから再度お試しください。',
            [this.errorTypes.PARSING]: 'データの解析に失敗しました。データ形式を確認してください。',
            [this.errorTypes.PERMISSION]: '権限がありません。必要な権限を確認してください。',
            [this.errorTypes.UNKNOWN]: '予期しないエラーが発生しました。'
        };

        return messages[errorInfo.type] || messages[this.errorTypes.UNKNOWN];
    }

    /**
     * エラーをログに記録
     * @param {Object} errorInfo - エラー情報
     * @param {string} context - コンテキスト
     */
    logError(errorInfo, context) {
        const logEntry = {
            ...errorInfo,
            context,
            timestamp: new Date().toISOString()
        };

        this.errorLog.unshift(logEntry);

        // ログサイズを制限
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // コンソールにも出力
        console.error(`[${context}]`, errorInfo);
    }

    /**
     * エラーログを取得
     * @param {number} limit - 取得する件数
     * @returns {Array} - エラーログ
     */
    getErrorLog(limit = 10) {
        return this.errorLog.slice(0, limit);
    }

    /**
     * エラーログをクリア
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * エラーログをエクスポート
     * @returns {string} - JSON文字列
     */
    exportErrorLog() {
        return JSON.stringify(this.errorLog, null, 2);
    }

    /**
     * 通知を送信
     * @param {string} message - メッセージ
     * @param {string} type - タイプ
     */
    notify(message, type = 'error') {
        if (this.notificationService) {
            this.notificationService.show(message, type);
        } else {
            console.warn('NotificationService is not available');
        }
    }

    /**
     * 開発環境かどうかを判定
     * @returns {boolean} - 開発環境の場合true
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    /**
     * try-catchをラップするヘルパー
     * @param {Function} fn - 実行する関数
     * @param {string} context - コンテキスト
     * @param {Object} options - オプション
     * @returns {Promise|*} - 関数の戻り値
     */
    async wrap(fn, context = 'unknown', options = {}) {
        try {
            return await fn();
        } catch (error) {
            this.handle(error, context, options);

            if (options.rethrow) {
                throw error;
            }

            return options.fallback;
        }
    }

    /**
     * バリデーションエラーを作成
     * @param {string} message - エラーメッセージ
     * @param {Object} details - 詳細情報
     * @returns {Error} - エラーオブジェクト
     */
    static createValidationError(message, details = {}) {
        const error = new Error(message);
        error.name = 'ValidationError';
        error.details = details;
        return error;
    }

    /**
     * ネットワークエラーを作成
     * @param {string} message - エラーメッセージ
     * @param {Object} details - 詳細情報
     * @returns {Error} - エラーオブジェクト
     */
    static createNetworkError(message, details = {}) {
        const error = new Error(message);
        error.name = 'NetworkError';
        error.details = details;
        return error;
    }

    /**
     * APIエラーを作成
     * @param {string} message - エラーメッセージ
     * @param {number} statusCode - ステータスコード
     * @param {Object} details - 詳細情報
     * @returns {Error} - エラーオブジェクト
     */
    static createApiError(message, statusCode, details = {}) {
        const error = new Error(message);
        error.name = 'ApiError';
        error.statusCode = statusCode;
        error.details = details;
        return error;
    }
}

// グローバルインスタンスをエクスポート
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}
