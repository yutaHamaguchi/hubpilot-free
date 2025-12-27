/**
 * Constants - アプリケーション全体で使用する定数を定義
 */
const Constants = {
    // ストレージキー
    STORAGE_KEYS: {
        APP_DATA: 'hubpilot-data',
        BACKUPS: 'hubpilot-backups',
        SETTINGS: 'hubpilot-settings',
        AUTH_TOKEN: 'hubpilot-auth-token'
    },

    // ステップ定義
    STEPS: {
        THEME: 1,
        CLUSTER: 2,
        STRUCTURE: 3,
        WRITING: 4,
        SEO: 5,
        QUALITY: 6,
        IMAGES: 7,
        COMPLETE: 8
    },

    // ステップ名
    STEP_NAMES: {
        1: 'テーマ選択',
        2: 'クラスター生成',
        3: '構成作成',
        4: '記事執筆',
        5: 'SEO分析',
        6: '品質チェック',
        7: '画像生成',
        8: '完成'
    },

    // 品質レベル
    QUALITY_LEVELS: {
        PASSED: 'passed',
        WARNING: 'warning',
        FAILED: 'failed'
    },

    // 記事ステータス
    ARTICLE_STATUS: {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        ARCHIVED: 'archived'
    },

    // 通知タイプ
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },

    // デフォルト値
    DEFAULTS: {
        MAX_BACKUPS: 5,
        NOTIFICATION_DURATION: 3000,
        MAX_ERROR_LOG_SIZE: 100,
        AUTO_SAVE_DELAY: 1000,
        DEFAULT_ARTICLE_COUNT: 5
    },

    // API設定
    API: {
        TIMEOUT: 30000,
        RETRY_COUNT: 3,
        RETRY_DELAY: 1000
    },

    // 画像設定
    IMAGES: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        DEFAULT_WIDTH: 800,
        DEFAULT_HEIGHT: 600
    },

    // バリデーション
    VALIDATION: {
        MIN_THEME_LENGTH: 2,
        MAX_THEME_LENGTH: 100,
        MIN_TITLE_LENGTH: 5,
        MAX_TITLE_LENGTH: 200,
        MIN_CONTENT_LENGTH: 100,
        MAX_CONTENT_LENGTH: 50000
    },

    // UI設定
    UI: {
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300,
        SCROLL_OFFSET: 100
    },

    // エラーメッセージ
    ERROR_MESSAGES: {
        NETWORK: 'ネットワークエラーが発生しました',
        STORAGE_FULL: 'ストレージの容量が不足しています',
        INVALID_DATA: 'データが不正です',
        API_ERROR: 'APIエラーが発生しました',
        UNKNOWN: '予期しないエラーが発生しました'
    },

    // 成功メッセージ
    SUCCESS_MESSAGES: {
        SAVED: '保存しました',
        DELETED: '削除しました',
        UPDATED: '更新しました',
        IMPORTED: 'インポートしました',
        EXPORTED: 'エクスポートしました'
    },

    // 確認メッセージ
    CONFIRM_MESSAGES: {
        DELETE: '本当に削除してもよろしいですか？',
        CLEAR_ALL: 'すべてのデータを削除してもよろしいですか？',
        CANCEL_GENERATION: '生成をキャンセルしてもよろしいですか？',
        DISCARD_CHANGES: '変更を破棄してもよろしいですか？'
    },

    // 正規表現パターン
    PATTERNS: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        URL: /^https?:\/\/.+/,
        HASHTAG: /#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g
    },

    // 色設定
    COLORS: {
        SUCCESS: '#10b981',
        ERROR: '#ef4444',
        WARNING: '#f59e0b',
        INFO: '#3b82f6',
        PRIMARY: '#6366f1',
        SECONDARY: '#64748b'
    },

    // SEO設定
    SEO: {
        MIN_META_DESCRIPTION_LENGTH: 120,
        MAX_META_DESCRIPTION_LENGTH: 160,
        MIN_TITLE_LENGTH: 30,
        MAX_TITLE_LENGTH: 60,
        RECOMMENDED_HEADING_COUNT: 3,
        MIN_WORD_COUNT: 300
    },

    // WordPress設定
    WORDPRESS: {
        DEFAULT_STATUS: 'draft',
        POST_TYPES: ['post', 'page'],
        DEFAULT_POST_TYPE: 'post'
    }
};

// 読み取り専用にする
Object.freeze(Constants);
Object.freeze(Constants.STORAGE_KEYS);
Object.freeze(Constants.STEPS);
Object.freeze(Constants.STEP_NAMES);
Object.freeze(Constants.QUALITY_LEVELS);
Object.freeze(Constants.ARTICLE_STATUS);
Object.freeze(Constants.NOTIFICATION_TYPES);
Object.freeze(Constants.DEFAULTS);
Object.freeze(Constants.API);
Object.freeze(Constants.IMAGES);
Object.freeze(Constants.VALIDATION);
Object.freeze(Constants.UI);
Object.freeze(Constants.ERROR_MESSAGES);
Object.freeze(Constants.SUCCESS_MESSAGES);
Object.freeze(Constants.CONFIRM_MESSAGES);
Object.freeze(Constants.PATTERNS);
Object.freeze(Constants.COLORS);
Object.freeze(Constants.SEO);
Object.freeze(Constants.WORDPRESS);

// グローバルにエクスポート
if (typeof window !== 'undefined') {
    window.Constants = Constants;
}
