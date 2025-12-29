/**
 * Constants - アプリケーション全体で使用する定数
 */
class Constants {
    // ストレージキー
    static STORAGE_KEYS = {
        APP_DATA: 'hubpilot_app_data',
        USER_PREFERENCES: 'hubpilot_user_preferences',
        WIZARD_STATE: 'hubpilot_wizard_state',
        GENERATION_STATE: 'hubpilot_generation_state'
    };

    // ステップ定義
    static STEPS = {
        THEME_INPUT: 1,
        STRUCTURE_REVIEW: 2,
        HEADINGS_REVIEW: 3,
        ARTICLE_GENERATION: 4,
        QUALITY_CHECK: 5,
        FINAL_APPROVAL: 6
    };

    // 通知タイプ
    static NOTIFICATION_TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    };

    // 生成状態
    static GENERATION_STATUS = {
        IDLE: 'idle',
        GENERATING: 'generating',
        PAUSED: 'paused',
        COMPLETED: 'completed',
        ERROR: 'error',
        CANCELLED: 'cancelled'
    };

    // デフォルト設定
    static DEFAULTS = {
        CLUSTER_PAGE_COUNT: 10,
        MIN_WORD_COUNT: 1800,
        MAX_WORD_COUNT: 2200,
        NOTIFICATION_DURATION: 3000,
        AUTO_SAVE_INTERVAL: 30000
    };

    // API設定
    static API = {
        TIMEOUT: 30000,
        RETRY_COUNT: 3,
        RETRY_DELAY: 1000
    };
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.Constants = Constants;
}
