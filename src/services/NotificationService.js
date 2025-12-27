/**
 * NotificationService - 通知管理を担当するサービス
 */
class NotificationService {
    constructor() {
        this.notificationContainer = null;
        this.defaultDuration = 3000;
        this.initialize();
    }

    /**
     * 初期化処理
     */
    initialize() {
        // 通知コンテナが存在しない場合は作成
        if (!this.notificationContainer) {
            this.createContainer();
        }
    }

    /**
     * 通知コンテナを作成
     */
    createContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(this.notificationContainer);
    }

    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知のタイプ ('success', 'error', 'warning', 'info')
     * @param {number} duration - 表示時間（ミリ秒）
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const notification = this.createNotificationElement(message, type);
        this.notificationContainer.appendChild(notification);

        // アニメーション
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * 通知要素を作成
     * @param {string} message - メッセージ
     * @param {string} type - タイプ
     * @returns {HTMLElement} - 通知要素
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = this.getIcon(type);
        const bgColor = this.getBackgroundColor(type);
        const textColor = this.getTextColor(type);

        notification.style.cssText = `
            background: ${bgColor};
            color: ${textColor};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            cursor: pointer;
            font-size: 14px;
            line-height: 1.5;
        `;

        notification.innerHTML = `
            <span style="font-size: 20px;">${icon}</span>
            <span style="flex: 1;">${this.escapeHtml(message)}</span>
            <span style="opacity: 0.7; font-size: 18px;">×</span>
        `;

        notification.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    /**
     * タイプに応じたアイコンを取得
     * @param {string} type - タイプ
     * @returns {string} - アイコン
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * タイプに応じた背景色を取得
     * @param {string} type - タイプ
     * @returns {string} - 背景色
     */
    getBackgroundColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    /**
     * タイプに応じたテキスト色を取得
     * @param {string} type - タイプ
     * @returns {string} - テキスト色
     */
    getTextColor(type) {
        return '#ffffff';
    }

    /**
     * 通知を削除
     * @param {HTMLElement} notification - 削除する通知要素
     */
    remove(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * すべての通知をクリア
     */
    clearAll() {
        const notifications = this.notificationContainer.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    /**
     * HTMLエスケープ処理
     * @param {string} text - エスケープするテキスト
     * @returns {string} - エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 成功通知を表示
     * @param {string} message - メッセージ
     * @param {number} duration - 表示時間
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    /**
     * エラー通知を表示
     * @param {string} message - メッセージ
     * @param {number} duration - 表示時間
     */
    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    /**
     * 警告通知を表示
     * @param {string} message - メッセージ
     * @param {number} duration - 表示時間
     */
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    /**
     * 情報通知を表示
     * @param {string} message - メッセージ
     * @param {number} duration - 表示時間
     */
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// グローバルインスタンスをエクスポート
if (typeof window !== 'undefined') {
    window.NotificationService = NotificationService;
}

// CSSスタイルの追加
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .notification.show {
            opacity: 1 !important;
            transform: translateX(0) !important;
        }
    `;
    document.head.appendChild(style);
}
