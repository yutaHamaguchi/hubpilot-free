/**
 * UIRenderer - UI要素のレンダリングを担当するクラス
 */
class UIRenderer {
    constructor() {
        this.templateEngine = null;
        this.notificationService = null;
        this.wizardController = null;
    }

    /**
     * 依存関係を設定
     */
    setDependencies(templateEngine, notificationService, wizardController) {
        this.templateEngine = templateEngine;
        this.notificationService = notificationService;
        this.wizardController = wizardController;
    }

    /**
     * 指定されたステップをレンダリング
     * @param {number} step - ステップ番号
     * @param {Object} data - データ
     */
    renderStep(step, data) {
        switch (step) {
            case 1:
                this.renderStep1(data);
                break;
            case 2:
                this.renderStep2(data);
                break;
            case 3:
                this.renderStep3(data);
                break;
            case 4:
                this.renderStep4(data);
                break;
            case 5:
                this.renderStep5(data);
                break;
            case 6:
                this.renderStep6(data);
                break;
            default:
                console.warn(`Unknown step: ${step}`);
        }

        this.showStep(step);
    }

    /**
     * Step 1をレンダリング（テーマ入力）
     * @param {Object} data - データ
     */
    renderStep1(data) {
        const themeInput = document.getElementById('theme-input');
        if (themeInput && data.theme) {
            themeInput.value = data.theme;
        }

        // 文字数カウントを更新
        this.updateCharCount();

        // ボタンの状態を更新
        this.updateGenerateButton();
    }

    /**
     * Step 2をレンダリング（構造確認）
     * @param {Object} data - データ
     */
    renderStep2(data) {
        // ピラーページタイトルを表示
        const pillarTitleEl = document.getElementById('pillar-page-title');
        if (pillarTitleEl) {
            const title = data?.pillarPage?.title || 'ピラーページタイトル未設定';
            pillarTitleEl.textContent = title;
        }

        // クラスターページリストを表示
        const clusterPages = data?.clusterPages || [];
        this.renderClusterPagesList(clusterPages);

        // 統計を更新
        this.updateStructureStats(data);
    }

    /**
     * Step 3をレンダリング（見出し構成）
     * @param {Object} data - データ
     */
    renderStep3(data) {
        // 見出し統計を更新
        this.updateHeadingsStats(data || {});

        // 見出しアコーディオンを表示
        this.renderHeadingsAccordion(data || {});
    }

    /**
     * Step 4をレンダリング（記事生成）
     * @param {Object} data - データ
     */
    renderStep4(data) {
        // 記事カードグリッドを表示
        this.renderArticlesGrid(data.articles || []);

        // 進捗を更新
        this.updateGenerationProgress(data);
    }

    /**
     * Step 5をレンダリング（品質チェック）
     * @param {Object} data - データ
     */
    renderStep5(data) {
        // 品質チェック結果を表示
        this.renderQualityResults(data.qualityChecks || []);

        // 品質統計を更新
        this.updateQualityStats(data);
    }

    /**
     * Step 6をレンダリング（最終承認）
     * @param {Object} data - データ
     */
    renderStep6(data) {
        // 完成統計を表示
        this.updateFinalStats(data);

        // ピラーページプレビューを表示
        this.renderPillarPreview(data);
    }

    /**
     * 指定されたステップを表示
     * @param {number} step - ステップ番号
     */
    showStep(step) {
        // すべてのステップを非表示
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.remove('active');
        });

        // 指定されたステップを表示
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            stepEl.classList.add('active');
        }

        // ナビゲーションボタンを更新
        this.updateNavigationButtons(step);
    }

    /**
     * ナビゲーションボタンの表示/非表示を更新
     * @param {number} step - ステップ番号
     */
    updateNavigationButtons(step) {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');

        if (nextBtn) {
            // ステップ1では「次へ」ボタンを非表示
            if (step === 1) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = '';
            }
        }

        if (prevBtn) {
            // ステップ1では「戻る」ボタンを非表示
            if (step === 1) {
                prevBtn.style.display = 'none';
            } else {
                prevBtn.style.display = '';
            }
        }
    }

    /**
     * クラスターページリストをレンダリング
     * @param {Array} clusterPages - クラスターページ配列
     */
    renderClusterPagesList(clusterPages) {
        const listEl = document.getElementById('cluster-pages-list');
        if (!listEl || !this.templateEngine) return;

        const html = clusterPages.map((page, index) =>
            this.templateEngine.createClusterPageCard(page, index)
        ).join('');

        listEl.innerHTML = html;
    }

    /**
     * 見出しアコーディオンをレンダリング
     * @param {Object} data - データ
     */
    renderHeadingsAccordion(data) {
        const accordionEl = document.getElementById('headings-accordion');
        if (!accordionEl || !this.templateEngine) return;

        const clusterPages = data?.clusterPages || [];
        const headings = data?.headings || {};

        const html = clusterPages.map((page, index) => {
            const pageHeadings = headings[page.id] || [];
            return this.templateEngine.createHeadingAccordionItem(page, pageHeadings, index);
        }).join('');

        accordionEl.innerHTML = html;
    }

    /**
     * 記事カードグリッドをレンダリング
     * @param {Array} articles - 記事配列
     */
    renderArticlesGrid(articles) {
        const gridEl = document.getElementById('articles-grid');
        if (!gridEl || !this.templateEngine) return;

        const html = articles.map((article, index) =>
            this.templateEngine.createArticleCard(article, index)
        ).join('');

        gridEl.innerHTML = html;
    }

    /**
     * 品質チェック結果をレンダリング
     * @param {Array} qualityChecks - 品質チェック結果配列
     */
    renderQualityResults(qualityChecks) {
        const resultsEl = document.getElementById('quality-results');
        if (!resultsEl || !this.templateEngine) return;

        const html = qualityChecks.map(check =>
            this.templateEngine.createQualityCheckItem(check)
        ).join('');

        resultsEl.innerHTML = html;
    }

    /**
     * 文字数カウントを更新
     */
    updateCharCount() {
        const themeInput = document.getElementById('theme-input');
        const charCountEl = document.getElementById('char-count');

        if (themeInput && charCountEl) {
            charCountEl.textContent = themeInput.value.length;
        }
    }

    /**
     * 生成ボタンの状態を更新
     */
    updateGenerateButton() {
        const themeInput = document.getElementById('theme-input');
        const generateBtn = document.getElementById('generate-structure-btn');

        if (themeInput && generateBtn) {
            generateBtn.disabled = !themeInput.value.trim();
        }
    }

    /**
     * 構造統計を更新
     * @param {Object} data - データ
     */
    updateStructureStats(data) {
        const clusterCount = (data.clusterPages || []).length;
        const totalCount = clusterCount + 1; // ピラーページ + クラスターページ

        this.updateElement('cluster-count', clusterCount);
        this.updateElement('summary-cluster-count', clusterCount);
        this.updateElement('summary-total-count', totalCount);
    }

    /**
     * 見出し統計を更新
     * @param {Object} data - データ
     */
    updateHeadingsStats(data) {
        const clusterPages = data?.clusterPages || [];
        const headings = data?.headings || {};

        const totalArticles = clusterPages.length;
        const totalHeadings = Object.values(headings).reduce((sum, pageHeadings) =>
            sum + (pageHeadings || []).length, 0
        );
        const avgHeadings = totalArticles > 0 ? (totalHeadings / totalArticles).toFixed(1) : 0;
        const estimatedTime = Math.ceil(totalArticles * 2.5); // 2.5分/記事

        this.updateElement('total-articles', totalArticles);
        this.updateElement('total-headings', totalHeadings);
        this.updateElement('avg-headings', avgHeadings);
        this.updateElement('estimated-time', estimatedTime);
    }

    /**
     * 生成進捗を更新
     * @param {Object} data - データ
     */
    updateGenerationProgress(data) {
        const articles = data.articles || [];
        const completed = articles.filter(a => a.content).length;
        const total = articles.length;

        this.updateElement('completed-count', completed);
        this.updateElement('remaining-count', total - completed);

        // 進捗バーを更新
        this.updateProgress(completed, total);
    }

    /**
     * 進捗バーを更新
     * @param {number} current - 現在の進捗
     * @param {number} total - 総数
     * @param {string} message - メッセージ
     */
    updateProgress(current, total, message = '') {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

        this.updateElement('progress-fill', null, (el) => {
            el.style.width = `${percentage}%`;
        });

        this.updateElement('progress-percentage', `${percentage}%`);

        if (message) {
            this.updateElement('progress-text', message);
        }
    }

    /**
     * 品質統計を更新
     * @param {Object} data - データ
     */
    updateQualityStats(data) {
        const qualityChecks = data.qualityChecks || [];

        const passed = qualityChecks.filter(q => q.status === '良好').length;
        const warning = qualityChecks.filter(q => q.status === '要注意').length;
        const failed = qualityChecks.filter(q => q.status === '要修正').length;

        this.updateElement('passed-count', passed);
        this.updateElement('warning-count', warning);
        this.updateElement('failed-count', failed);

        // 平均品質スコアを計算
        const avgScore = qualityChecks.length > 0
            ? Math.round(qualityChecks.reduce((sum, q) => sum + (q.score || 0), 0) / qualityChecks.length)
            : 0;

        this.updateElement('avg-quality-score', `${avgScore}%`);
    }

    /**
     * 最終統計を更新
     * @param {Object} data - データ
     */
    updateFinalStats(data) {
        const articles = data.articles || [];
        const totalArticles = articles.length + 1; // クラスター + ピラー
        const totalWords = articles.reduce((sum, a) => sum + (a.wordCount || 0), 0);
        const avgQuality = data.qualityChecks && data.qualityChecks.length > 0
            ? Math.round(data.qualityChecks.reduce((sum, q) => sum + (q.score || 0), 0) / data.qualityChecks.length)
            : 0;

        this.updateElement('final-total-articles', totalArticles);
        this.updateElement('final-total-words', totalWords.toLocaleString());
        this.updateElement('final-avg-quality', `${avgQuality}点`);
        this.updateElement('final-seo-score', '92%'); // 固定値
    }

    /**
     * ピラーページプレビューをレンダリング
     * @param {Object} data - データ
     */
    renderPillarPreview(data) {
        const previewEl = document.getElementById('pillar-preview');
        if (!previewEl) return;

        if (data.pillarPage && data.pillarPage.content) {
            previewEl.innerHTML = `
                <div class="pillar-content">
                    <h1>${this.escapeHtml(data.pillarPage.title || '')}</h1>
                    <div class="pillar-body">${this.formatContent(data.pillarPage.content)}</div>
                </div>
            `;
        } else {
            previewEl.innerHTML = '<p>ピラーページが生成されていません</p>';
        }
    }

    /**
     * 要素を更新
     * @param {string} id - 要素ID
     * @param {string} content - コンテンツ
     * @param {Function} callback - コールバック関数
     */
    updateElement(id, content, callback = null) {
        const el = document.getElementById(id);
        if (el) {
            if (callback) {
                callback(el);
            } else if (content !== null) {
                el.textContent = content;
            }
        }
    }

    /**
     * コンテンツをフォーマット
     * @param {string} content - コンテンツ
     * @returns {string} - フォーマットされたコンテンツ
     */
    formatContent(content) {
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
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
    window.UIRenderer = UIRenderer;
}
