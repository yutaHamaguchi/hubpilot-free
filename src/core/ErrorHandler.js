/**
 * エラーハンドリングクラス
 * 統一されたエラーメッセージとエラーコード自動判定機能を提供
 *
 * 機能:
 * - 統一されたエラーメッセージマップ
 * - エラーコード自動判定
 * - ユーザーフレンドリーなメッセージ表示
 * - 詳細なログ記録
 *
 * 要件: 6.1, 6.2, 6.3, 6.4, 6.5
 */
class ErrorHandler {
    constructor() {
        // 統一されたエラーメッセージマップ
        this.errorMessages = {
            // API関連エラー
            'API_KEY_ERROR': 'APIキーの設定を確認してください',
            'API_KEY_INVALID': 'APIキーが無効です。設定を確認してください',
            'API_KEY_MISSING': 'APIキーが設定されていません',

            // ネットワーク関連エラー
            'NETWORK_ERROR': 'ネットワーク接続を確認してください',
            'CONNECTION_ERROR': 'サーバーに接続できません。ネットワーク接続を確認してください',
            'TIMEOUT_ERROR': 'タイムアウトが発生しました。しばらく時間をおいて再試行してください',

            // レート制限エラー
            'RATE_LIMIT_ERROR': 'API利用制限に達しました。しばらく時間をおいて再試行してください',
            'QUOTA_EXCEEDED': 'API利用制限を超過しました。プランの確認をお願いします',

            // バリデーションエラー
            'VALIDATION_ERROR': '入力データに問題があります。内容を確認してください',
            'INVALID_INPUT': '入力内容が無効です。正しい形式で入力してください',
            'REQUIRED_FIELD': '必須項目が入力されていません',
            'FIELD_TOO_LONG': '入力内容が長すぎます',
            'FIELD_TOO_SHORT': '入力内容が短すぎます',

            // データベース関連エラー
            'DATABASE_ERROR': 'データベース接続エラーです。管理者にお問い合わせください',
            'SUPABASE_ERROR': 'データベース接続エラーです。管理者にお問い合わせください',
            'DATA_SAVE_ERROR': 'データの保存に失敗しました',
            'DATA_LOAD_ERROR': 'データの読み込みに失敗しました',

            // 認証関連エラー
            'AUTH_ERROR': '認証に失敗しました。ログインし直してください',
            'UNAUTHORIZED': 'アクセス権限がありません',
            'SESSION_EXPIRED': 'セッションが期限切れです。ログインし直してください',

            // 記事生成関連エラー
            'GENERATION_ERROR': '記事の生成に失敗しました',
            'AI_SERVICE_ERROR': 'AI サービスでエラーが発生しました',
            'CONTENT_GENERATION_FAILED': 'コンテンツの生成に失敗しました',
            'STRUCTURE_GENERATION_FAILED': '構成の生成に失敗しました',
            'HEADING_GATION_FAILED': '見出しの生成に失敗しました',

            // ファイル関連エラー
            'FILE_ERROR': 'ファイル操作でエラーが発生しました',
            'FILE_NOT_FOUND': 'ファイルが見つかりません',
            'FILE_UPLOAD_ERROR': 'ファイルのアップロードに失敗しました',
            'FILE_SIZE_ERROR': 'ファイルサイズが制限を超えています',

            // 設定関連エラー
            'CONFIG_ERROR': '設定に問題があります',
            'MISSING_CONFIG': '必要な設定が不足しています',
            'INVALID_CONFIG': '設定内容が無効です',

            // 一般的なエラー
            'UNKNOWN_ERROR': '予期しないエラーが発生しました',
            'INTERNAL_ERROR': 'システム内部エラーが発生しました',
            'SERVICE_UNAVAILABLE': 'サービスが一時的に利用できません',
            'MAINTENANCE_MODE': 'メンテナンス中です。しばらく時間をおいて再試行してください'
        };

        // エラーコード判定パターン
        this.errorPatterns = [
            // API キー関連
            { pattern: /api.?key.*(invalid|unauthorized|missing|not.?found)/i, code: 'API_KEY_ERROR' },
            { pattern: /unauthorized/i, code: 'API_KEY_ERROR' },
            { pattern: /authentication.?failed/i, code: 'API_KEY_ERROR' },
            { pattern: /invalid.?credentials/i, code: 'API_KEY_ERROR' },

            // ネットワーク関連
            { pattern: /network.*(error|failed|timeout)/i, code: 'NETWORK_ERROR' },
            { pattern: /connection.*(error|failed|refused|timeout)/i, code: 'NETWORK_ERROR' },
            { pattern: /fetch.*(error|failed)/i, code: 'NETWORK_ERROR' },
            { pattern: /timeout/i, code: 'TIMEOUT_ERROR' },
            { pattern: /request.?timeout/i, code: 'TIMEOUT_ERROR' },

            // レート制限
            { pattern: /rate.?limit/i, code: 'RATE_LIMIT_ERROR' },
            { pattern: /quota.*(exceeded|limit)/i, code: 'RATE_LIMIT_ERROR' },
            { pattern: /too.?many.?requests/i, code: 'RATE_LIMIT_ERROR' },

            // バリデーション
            { pattern: /validation.*(error|failed)/i, code: 'VALIDATION_ERROR' },
            { pattern: /invalid.*(input|data|format)/i, code: 'VALIDATION_ERROR' },
            { pattern: /required.*(field|parameter)/i, code: 'VALIDATION_ERROR' },
            { pattern: /(missing|empty).*(field|parameter|value)/i, code: 'VALIDATION_ERROR' },

            // データベース
            { pattern: /supabase.*(error|failed)/i, code: 'SUPABASE_ERROR' },
            { pattern: /database.*(error|failed|connection)/i, code: 'DATABASE_ERROR' },
            { pattern: /sql.*(error|failed)/i, code: 'DATABASE_ERROR' },

            // 認証
            { pattern: /auth.*(error|failed)/i, code: 'AUTH_ERROR' },
            { pattern: /session.*(expired|invalid)/i, code: 'SESSION_EXPIRED' },
            { pattern: /access.?denied/i, code: 'UNAUTHORIZED' },

            // 記事生成
            { pattern: /generation.*(error|failed)/i, code: 'GENERATION_ERROR' },
            { pattern: /ai.*(service|api).*(error|failed)/i, code: 'AI_SERVICE_ERROR' },
            { pattern: /content.*(generation|create).*(error|failed)/i, code: 'CONTENT_GENERATION_FAILED' },

            // ファイル
            { pattern: /file.*(error|failed|not.?found)/i, code: 'FILE_ERROR' },
            { pattern: /upload.*(error|failed)/i, code: 'FILE_UPLOAD_ERROR' },
            { pattern: /file.?size.*(too.?large|exceeded)/i, code: 'FILE_SIZE_ERROR' },

            // 設定
            { pattern: /config.*(error|invalid|missing)/i, code: 'CONFIG_ERROR' },
            { pattern: /configuration.*(error|invalid|missing)/i, code: 'CONFIG_ERROR' },

            // サービス
            { pattern: /service.?unavailable/i, code: 'SERVICE_UNAVAILABLE' },
            { pattern: /maintenance/i, code: 'MAINTENANCE_MODE' },
            { pattern: /internal.?(server|system).?error/i, code: 'INTERNAL_ERROR' }
        ];

        // ログ記録用
        this.errorLog = [];
        this.maxLogEntries = 100;
    }

    /**
     * エラーコードを自動判定
     * @param {Error|string} error - エラーオブジェクトまたはメッセージ
     * @returns {string} エラーコード
     */
    getErrorCode(error) {
        try {
            const message = typeof error === 'string' ? error : (error?.message || '');

            // パターンマッチングでエラーコードを判定
            for (const { pattern, code } of this.errorPatterns) {
                if (pattern.test(message)) {
                    return code;
                }
            }

            // HTTPステータスコードによる判定
            if (error?.status || error?.statusCode) {
                const status = error.status || error.statusCode;
                return this.getErrorCodeFromStatus(status);
            }

            // エラーオブジェクトのcodeプロパティを確認
            if (error?.code && this.errorMessages[error.code]) {
                return error.code;
            }

            // デフォルトは不明なエラー
            return 'UNKNOWN_ERROR';

        } catch (err) {
            console.error('エラーコード判定中にエラー:', err);
            return 'UNKNOWN_ERROR';
        }
    }

    /**
     * HTTPステータスコードからエラーコードを判定
     * @param {number} status - HTTPステータスコード
     * @returns {string} エラーコード
     */
    getErrorCodeFromStatus(status) {
        const statusMappings = {
            400: 'VALIDATION_ERROR',
            401: 'API_KEY_ERROR',
            403: 'UNAUTHORIZED',
            404: 'FILE_NOT_FOUND',
            408: 'TIMEOUT_ERROR',
            429: 'RATE_LIMIT_ERROR',
            500: 'INTERNAL_ERROR',
            502: 'SERVICE_UNAVAILABLE',
            503: 'SERVICE_UNAVAILABLE',
            504: 'TIMEOUT_ERROR'
        };

        return statusMappings[status] || 'UNKNOWN_ERROR';
    }

    /**
     * ユーザーフレンドリーなエラーメッセージを取得
     * @param {string} errorCode - エラーコード
     * @returns {string} ユーザー向けメッセージ
     */
    getUserMessage(errorCode) {
        return this.errorMessages[errorCode] || this.errorMessages['UNKNOWN_ERROR'];
    }

    /**
     * エラーを処理し、適切なメッセージを返す
     * @param {Error|string} error - エラーオブジェクトまたはメッセージ
     * @param {string} context - エラーが発生したコンテキスト
     * @returns {Object} 処理されたエラー情報
     */
    handleError(error, context = '') {
        try {
            const errorCode = this.getErrorCode(error);
            const userMessage = this.getUserMessage(errorCode);
            const originalMessage = typeof error === 'string' ? error : (error?.message || '');

            // エラー情報オブジェクト
            const errorInfo = {
                code: errorCode,
                message: userMessage,
                originalMessage: originalMessage,
                context: context,
                timestamp: new Date().toISOString(),
                stack: error?.stack || null
            };

            // ログに記録
            this.logError(errorInfo);

            // 開発者用ログ出力
            console.error(`[${context}] エラー発生:`, {
                code: errorCode,
                userMessage: userMessage,
                originalMessage: originalMessage,
                error: error
            });

            return errorInfo;

        } catch (err) {
            console.error('エラーハンドリング中にエラー:', err);

            // フォールバック
            const fallbackError = {
                code: 'UNKNOWN_ERROR',
                message: this.errorMessages['UNKNOWN_ERROR'],
                originalMessage: typeof error === 'string' ? error : 'エラー情報の取得に失敗',
                context: context,
                timestamp: new Date().toISOString(),
                stack: null
            };

            this.logError(fallbackError);
            return fallbackError;
        }
    }

    /**
     * エラーをログに記録
     * @param {Object} errorInfo - エラー情報
     */
    logError(errorInfo) {
        try {
            // ログエントリを追加
            this.errorLog.unshift(errorInfo);

            // ログサイズ制限
            if (this.errorLog.length > this.maxLogEntries) {
                this.errorLog = this.errorLog.slice(0, this.maxLogEntries);
            }

            // 重要なエラーは別途記録
            if (this.isCriticalError(errorInfo.code)) {
                this.logCriticalError(errorInfo);
            }

        } catch (err) {
            console.error('エラーログ記録中にエラー:', err);
        }
    }

    /**
     * 重要なエラーかどうかを判定
     * @param {string} errorCode - エラーコード
     * @returns {boolean} 重要なエラーかどうか
     */
    isCriticalError(errorCode) {
        const criticalErrors = [
            'DATABASE_ERROR',
            'SUPABASE_ERROR',
            'INTERNAL_ERROR',
            'AUTH_ERROR',
            'CONFIG_ERROR'
        ];

        return criticalErrors.includes(errorCode);
    }

    /**
     * 重要なエラーを別途記録
     * @param {Object} errorInfo - エラー情報
     */
    logCriticalError(errorInfo) {
        try {
            // LocalStorageに重要なエラーを記録
            const criticalErrors = JSON.parse(localStorage.getItem('hubpilot_critical_errors') || '[]');
            criticalErrors.unshift(errorInfo);

            // 最新10件のみ保持
            const limitedErrors = criticalErrors.slice(0, 10);
            localStorage.setItem('hubpilot_critical_errors', JSON.stringify(limitedErrors));

            // コンソールに警告出力
            console.warn('🚨 重要なエラーが発生しました:', errorInfo);

        } catch (err) {
            console.error('重要エラーログ記録中にエラー:', err);
        }
    }

    /**
     * エラーログを取得
     * @param {number} limit - 取得件数制限
     * @returns {Array} エラーログ
     */
    getErrorLog(limit = 50) {
        return this.errorLog.slice(0, limit);
    }

    /**
     * 重要なエラーログを取得
     * @returns {Array} 重要なエラーログ
     */
    getCriticalErrorLog() {
        try {
            return JSON.parse(localStorage.getItem('hubpilot_critical_errors') || '[]');
        } catch (err) {
            console.error('重要エラーログ取得中にエラー:', err);
            return [];
        }
    }

    /**
     * エラーログをクリア
     */
    clearErrorLog() {
        try {
            this.errorLog = [];
            localStorage.removeItem('hubpilot_critical_errors');
            console.log('エラーログをクリアしました');
        } catch (err) {
            console.error('エラーログクリア中にエラー:', err);
        }
    }

    /**
     * エラー統計を取得
     * @returns {Object} エラー統計情報
     */
    getErrorStats() {
        try {
            const stats = {
                totalErrors: this.errorLog.length,
                errorsByCode: {},
                errorsByContext: {},
                recentErrors: this.errorLog.slice(0, 10),
                criticalErrorCount: this.getCriticalErrorLog().length
            };

            // エラーコード別集計
            this.errorLog.forEach(error => {
                stats.errorsByCode[error.code] = (stats.errorsByCode[error.code] || 0) + 1;
                stats.errorsByContext[error.context] = (stats.errorsByContext[error.context] || 0) + 1;
            });

            return stats;

        } catch (err) {
            console.error('エラー統計取得中にエラー:', err);
            return {
                totalErrors: 0,
                errorsByCode: {},
                errorsByContext: {},
                recentErrors: [],
                criticalErrorCount: 0
            };
        }
    }

    /**
     * エラーメッセージマップを取得
     * @returns {Object} エラーメッセージマップ
     */
    getErrorMessages() {
        return { ...this.errorMessages };
    }

    /**
     * カスタムエラーメッセージを追加
     * @param {string} errorCode - エラーコード
     * @param {string} message - エラーメッセージ
     */
    addErrorMessage(errorCode, message) {
        if (typeof errorCode === 'string' && typeof message === 'string') {
            this.errorMessages[errorCode] = message;
            console.log(`カスタムエラーメッセージを追加: ${errorCode}`);
        }
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            errorMessageCount: Object.keys(this.errorMessages).length,
            errorPatternCount: this.errorPatterns.length,
            errorLogCount: this.errorLog.length,
            criticalErrorCount: this.getCriticalErrorLog().length,
            maxLogEntries: this.maxLogEntries,
            stats: this.getErrorStats()
        };
    }
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}
