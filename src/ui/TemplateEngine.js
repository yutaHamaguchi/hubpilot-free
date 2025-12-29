/**
 * TemplateEngine - HTMLテンプレートの生成を担当するクラス
 */
class TemplateEngine {
    constructor() {
        this.templates = {};
    }

    /**
     * 記事モーダルを作成
     * @param {Object} article - 記事データ
     * @returns {HTMLElement} - モーダル要素
     */
    createArticleModal(article) {
        const modal = document.createElement('div');
        modal.className = 'article-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="article-modal-content" style="
                background: white;
                border-radius: 8px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                padding: 20px;
                margin: 20px;
            ">
                <div class="article-modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 15px;
                ">
                    <h2 style="margin: 0; color: #333;">${this.escapeHtml(article.title)}</h2>
                    <button class="close-modal" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">×</button>
                </div>
                <div class="article-modal-body">
                    <div class="article-meta" style="
                        display: flex;
                        gap: 20px;
                        margin-bottom: 20px;
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #666;
                    ">
                        <span>文字数: ${article.wordCount || 0}</span>
                        <span>品質: ${article.qualityStatus || '未チェック'}</span>
                        <span>生成日時: ${article.generatedAt ? new Date(article.generatedAt).toLocaleString() : '不明'}</span>
                    </div>
                    <div class="article-content" style="
                        line-height: 1.6;
                        color: #333;
                        white-space: pre-wrap;
                    ">${this.escapeHtml(article.content || 'コンテンツがありません')}</div>
                </div>
            </div>
        `;

        // 閉じるボタンのイベント
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // モーダル背景クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    /**
     * クラスターページカードを作成
     * @param {Object} page - ページデータ
     * @param {number} index - インデックス
     * @returns {string} - HTML文字列
     */
    createClusterPageCard(page, index) {
        return `
            <div class="cluster-page-card" data-page-id="${page.id}">
                <div class="cluster-page-header">
                    <div class="cluster-page-number">${index + 1}</div>
                    <div class="cluster-page-actions">
                        <button class="btn btn-small btn-secondary" onclick="editPage('${page.id}')">
                            <span class="btn-icon">✏️</span>
                            編集
                        </button>
                        <button class="btn btn-small btn-danger" onclick="removePage('${page.id}')">
                            <span class="btn-icon">🗑️</span>
                            削除
                        </button>
                    </div>
                </div>
                <div class="cluster-page-content">
                    <h4 class="cluster-page-title">${this.escapeHtml(page.title)}</h4>
                    <p class="cluster-page-summary">${this.escapeHtml(page.summary)}</p>
                    <div class="cluster-page-meta">
                        <span class="meta-item">
                            <span class="meta-icon">📝</span>
                            <span>${page.wordCount || 0}文字</span>
                        </span>
                        <span class="meta-item">
                            <span class="meta-icon">✅</span>
                            <span>${page.qualityStatus || '未生成'}</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 見出しアコーディオンアイテムを作成
     * @param {Object} page - ページデータ
     * @param {Array} headings - 見出しデータ
     * @param {number} index - インデックス
     * @returns {string} - HTML文字列
     */
    createHeadingAccordionItem(page, headings, index) {
        const headingsList = headings.map(heading => `
            <div class="heading-item" data-heading-id="${heading.id}">
                <div class="heading-content">
                    <span class="heading-level">H${heading.level}</span>
                    <span class="heading-text">${this.escapeHtml(heading.text)}</span>
                </div>
                <div class="heading-actions">
                    <button class="btn btn-small btn-secondary" onclick="editHeading('${page.id}', '${heading.id}')">
                        <span class="btn-icon">✏️</span>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="removeHeading('${page.id}', '${heading.id}')">
                        <span class="btn-icon">🗑️</span>
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="accordion-item">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <div class="accordion-title">
                        <span class="accordion-number">${index + 1}</span>
                        <span class="accordion-text">${this.escapeHtml(page.title)}</span>
                    </div>
                    <div class="accordion-meta">
                        <span class="meta-count">${headings.length}見出し</span>
                        <span class="accordion-icon">▼</span>
                    </div>
                </div>
                <div class="accordion-content">
                    <div class="headings-list">
                        ${headingsList}
                    </div>
                    <div class="accordion-actions">
                        <button class="btn btn-small btn-secondary" onclick="addHeading('${page.id}')">
                            <span class="btn-icon">➕</span>
                            見出しを追加
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 記事生成カードを作成
     * @param {Object} article - 記事データ
     * @param {number} index - インデックス
     * @returns {string} - HTML文字列
     */
    createArticleCard(article, index) {
        const statusClass = this.getStatusClass(article.qualityStatus);
        const statusIcon = this.getStatusIcon(article.qualityStatus);

        return `
            <div class="article-card ${statusClass}" data-article-id="${article.id}">
                <div class="article-card-header">
                    <div class="article-number">${index + 1}</div>
                    <div class="article-status">
                        <span class="status-icon">${statusIcon}</span>
                        <span class="status-text">${article.qualityStatus || '生成中'}</span>
                    </div>
                </div>
                <div class="article-card-content">
                    <h4 class="article-title">${this.escapeHtml(article.title)}</h4>
                    <div class="article-meta">
                        <span class="meta-item">
                            <span class="meta-icon">📝</span>
                            <span>${article.wordCount || 0}文字</span>
                        </span>
                        <span class="meta-item">
                            <span class="meta-icon">⏱️</span>
                            <span>${article.generatedAt ? this.formatDate(article.generatedAt) : '生成中'}</span>
                        </span>
                    </div>
                </div>
                <div class="article-card-actions">
                    <button class="btn btn-small btn-secondary" onclick="viewArticle('${article.id}')" ${!article.content ? 'disabled' : ''}>
                        <span class="btn-icon">👁️</span>
                        プレビュー
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="editArticle('${article.id}')" ${!article.content ? 'disabled' : ''}>
                        <span class="btn-icon">✏️</span>
                        編集
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 品質チェック結果アイテムを作成
     * @param {Object} qualityCheck - 品質チェック結果
     * @returns {string} - HTML文字列
     */
    createQualityCheckItem(qualityCheck) {
        const statusClass = qualityCheck.status === '良好' ? 'success' :
                           qualityCheck.status === '要注意' ? 'warning' : 'error';

        const checksHtml = qualityCheck.checks.map(check => `
            <div class="quality-check-detail">
                <span class="check-name">${check.name}</span>
                <span class="check-status ${check.status === 'OK' ? 'success' : 'warning'}">${check.status}</span>
                <span class="check-value">${check.value}</span>
            </div>
        `).join('');

        return `
            <div class="quality-result-item ${statusClass}">
                <div class="quality-result-header">
                    <h4 class="quality-result-title">${this.escapeHtml(qualityCheck.title)}</h4>
                    <div class="quality-result-score">
                        <span class="score-value">${qualityCheck.score || 0}</span>
                        <span class="score-label">点</span>
                    </div>
                </div>
                <div class="quality-result-status">
                    <span class="status-badge ${statusClass}">${qualityCheck.status}</span>
                    <span class="check-date">${this.formatDate(qualityCheck.checkedAt)}</span>
                </div>
                <div class="quality-checks">
                    ${checksHtml}
                </div>
                <div class="quality-actions">
                    <button class="btn btn-small btn-secondary" onclick="recheckArticle('${qualityCheck.articleId}')">
                        <span class="btn-icon">🔄</span>
                        再チェック
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="viewArticle('${qualityCheck.articleId}')">
                        <span class="btn-icon">👁️</span>
                        記事を表示
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * ステータスに応じたCSSクラスを取得
     * @param {string} status - ステータス
     * @returns {string} - CSSクラス
     */
    getStatusClass(status) {
        const statusMap = {
            '生成完了': 'success',
            'AI生成完了': 'success',
            'モック生成完了': 'success',
            '生成中': 'pending',
            '未生成': 'pending',
            'エラー': 'error'
        };
        return statusMap[status] || 'pending';
    }

    /**
     * ステータスに応じたアイコンを取得
     * @param {string} status - ステータス
     * @returns {string} - アイコン
     */
    getStatusIcon(status) {
        const iconMap = {
            '生成完了': '✅',
            'AI生成完了': '✅',
            'モック生成完了': '✅',
            '生成中': '⏳',
            '未生成': '⏳',
            'エラー': '❌'
        };
        return iconMap[status] || '⏳';
    }

    /**
     * 日付をフォーマット
     * @param {string} dateString - 日付文字列
     * @returns {string} - フォーマットされた日付
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '不明';
        }
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} - エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.TemplateEngine = TemplateEngine;
}
