/**
 * TemplateEngine - HTMLテンプレートの生成を統一管理するクラス
 */
class TemplateEngine {
    /**
     * HTMLをエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} - エスケープされたテキスト
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 日付をフォーマット
     * @param {string|Date} date - フォーマットする日付
     * @returns {string} - フォーマットされた日付
     */
    static formatDate(date) {
        const d = new Date(date);
        return d.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * バックアップモーダルのテンプレート
     * @param {Array} backups - バックアップの配列
     * @returns {string} - HTMLテンプレート
     */
    static createBackupModal(backups) {
        const backupItems = backups.map((backup, index) => `
            <div class="backup-item" data-index="${index}">
                <div class="backup-info">
                    <div class="backup-date">${this.formatDate(backup.timestamp)}</div>
                    <div class="backup-size">${this.getBackupSize(backup)}</div>
                </div>
                <div class="backup-actions">
                    <button class="btn-restore" data-index="${index}">復元</button>
                    <button class="btn-delete" data-index="${index}">削除</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="backup-modal-content">
                <div class="backup-modal-header">
                    <h3>🔄 バックアップ管理</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="backup-modal-body">
                    ${backups.length > 0 ? `
                        <div class="backup-list">
                            ${backupItems}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>バックアップがありません</p>
                        </div>
                    `}
                </div>
                <div class="backup-modal-footer">
                    <button class="btn-clear-all ${backups.length === 0 ? 'disabled' : ''}">
                        すべて削除
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * ストレージ情報モーダルのテンプレート
     * @param {Object} usage - ストレージ使用状況
     * @returns {string} - HTMLテンプレート
     */
    static createStorageModal(usage) {
        const itemsList = Object.entries(usage.items || {})
            .sort((a, b) => b[1] - a[1])
            .map(([key, size]) => `
                <div class="storage-item">
                    <span class="storage-key">${this.escapeHtml(key)}</span>
                    <span class="storage-size">${this.formatBytes(size)}</span>
                </div>
            `).join('');

        return `
            <div class="backup-modal-content">
                <div class="backup-modal-header">
                    <h3>💾 ストレージ情報</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="backup-modal-body">
                    <div class="storage-summary">
                        <div class="storage-stat">
                            <div class="stat-label">合計使用量</div>
                            <div class="stat-value">${usage.formattedSize || '0 B'}</div>
                        </div>
                        <div class="storage-stat">
                            <div class="stat-label">アイテム数</div>
                            <div class="stat-value">${usage.itemCount || 0}</div>
                        </div>
                    </div>
                    ${itemsList ? `
                        <div class="storage-details">
                            <h4>詳細</h4>
                            <div class="storage-list">
                                ${itemsList}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * エラーモーダルのテンプレート
     * @param {string} title - タイトル
     * @param {string} message - メッセージ
     * @param {string} details - 詳細情報
     * @returns {string} - HTMLテンプレート
     */
    static createErrorModal(title, message, details = null) {
        return `
            <div class="backup-modal-content error-modal">
                <div class="backup-modal-header">
                    <h3>❌ ${this.escapeHtml(title)}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="backup-modal-body">
                    <p class="error-message">${this.escapeHtml(message)}</p>
                    ${details ? `
                        <details class="error-details">
                            <summary>詳細情報</summary>
                            <pre>${this.escapeHtml(details)}</pre>
                        </details>
                    ` : ''}
                </div>
                <div class="backup-modal-footer">
                    <button class="modal-close btn-primary">閉じる</button>
                </div>
            </div>
        `;
    }

    /**
     * 確認モーダルのテンプレート
     * @param {string} title - タイトル
     * @param {string} message - メッセージ
     * @param {string} confirmText - 確認ボタンのテキスト
     * @param {string} cancelText - キャンセルボタンのテキスト
     * @returns {string} - HTMLテンプレート
     */
    static createConfirmModal(title, message, confirmText = 'OK', cancelText = 'キャンセル') {
        return `
            <div class="backup-modal-content confirm-modal">
                <div class="backup-modal-header">
                    <h3>${this.escapeHtml(title)}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="backup-modal-body">
                    <p>${this.escapeHtml(message)}</p>
                </div>
                <div class="backup-modal-footer">
                    <button class="btn-cancel">${this.escapeHtml(cancelText)}</button>
                    <button class="btn-confirm">${this.escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;
    }

    /**
     * 記事カードのテンプレート
     * @param {Object} article - 記事データ
     * @param {number} index - インデックス
     * @returns {string} - HTMLテンプレート
     */
    static createArticleCard(article, index) {
        return `
            <div class="article-card" data-index="${index}">
                <div class="article-header">
                    <h3>${this.escapeHtml(article.title || 'タイトルなし')}</h3>
                    <div class="article-actions">
                        <button class="btn-edit" data-index="${index}">編集</button>
                        <button class="btn-delete" data-index="${index}">削除</button>
                    </div>
                </div>
                <div class="article-content">
                    ${article.content ? this.truncateHtml(article.content, 200) : '<p class="empty">内容がありません</p>'}
                </div>
                <div class="article-footer">
                    <span class="article-date">${article.createdAt ? this.formatDate(article.createdAt) : ''}</span>
                    <span class="article-status ${article.status || 'draft'}">${this.getStatusLabel(article.status)}</span>
                </div>
            </div>
        `;
    }

    /**
     * 品質チェック項目のテンプレート
     * @param {Object} check - チェック項目
     * @returns {string} - HTMLテンプレート
     */
    static createQualityCheckItem(check) {
        const levelClass = check.qualityLevel || 'warning';
        const icon = this.getQualityIcon(levelClass);

        return `
            <div class="quality-item quality-${levelClass}">
                <div class="quality-header">
                    <span class="quality-icon">${icon}</span>
                    <h4>${this.escapeHtml(check.title || '')}</h4>
                    <span class="quality-badge badge-${levelClass}">${this.getQualityLabel(levelClass)}</span>
                </div>
                <div class="quality-body">
                    <p>${this.escapeHtml(check.description || '')}</p>
                    ${check.suggestion ? `
                        <div class="quality-suggestion">
                            <strong>改善案:</strong>
                            <p>${this.escapeHtml(check.suggestion)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * ローディングスピナーのテンプレート
     * @param {string} message - メッセージ
     * @returns {string} - HTMLテンプレート
     */
    static createLoadingSpinner(message = '読み込み中...') {
        return `
            <div class="loading-container">
                <div class="spinner"></div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    /**
     * ヘルパー関数: バックアップサイズを取得
     */
    static getBackupSize(backup) {
        try {
            const size = new Blob([JSON.stringify(backup.data)]).size;
            return this.formatBytes(size);
        } catch {
            return '不明';
        }
    }

    /**
     * ヘルパー関数: バイトサイズをフォーマット
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * ヘルパー関数: HTMLを切り詰め
     */
    static truncateHtml(html, maxLength) {
        const text = html.replace(/<[^>]*>/g, '');
        if (text.length <= maxLength) return html;
        return this.escapeHtml(text.substring(0, maxLength) + '...');
    }

    /**
     * ヘルパー関数: ステータスラベルを取得
     */
    static getStatusLabel(status) {
        const labels = {
            'draft': '下書き',
            'published': '公開済み',
            'archived': 'アーカイブ'
        };
        return labels[status] || '下書き';
    }

    /**
     * ヘルパー関数: 品質レベルのアイコンを取得
     */
    static getQualityIcon(level) {
        const icons = {
            'passed': '✓',
            'warning': '⚠',
            'failed': '✕'
        };
        return icons[level] || '?';
    }

    /**
     * ヘルパー関数: 品質レベルのラベルを取得
     */
    static getQualityLabel(level) {
        const labels = {
            'passed': '合格',
            'warning': '要注意',
            'failed': '要修正'
        };
        return labels[level] || '不明';
    }
}

// グローバルインスタンスをエクスポート
if (typeof window !== 'undefined') {
    window.TemplateEngine = TemplateEngine;
}
