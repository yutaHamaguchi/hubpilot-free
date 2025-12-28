/**
 * UIRenderer - 各ステップのUI描画を担当
 */
class UIRenderer {
    constructor() {
        this.templateEngine = null;
        this.notationService = null;
        this.currentStep = 1;
        this.data = {};
    }

    /**
     * 依存関係を設定
     */
    setDependencies(templateEngine, notificationService) {
        this.templateEngine = templateEngine;
        this.notificationService = notificationService;
    }

    /**
     * 指定されたステップをレンダリング
     */
    renderStep(stepNumber, data) {
        this.currentStep = stepNumber;
        this.data = data || {};

        // 全てのステップコンテナを非表示
        this.hideAllSteps();

        // 指定されたステップを表示
        const stepContainer = document.getElementById(`step${stepNumber}`);
        if (stepContainer) {
            stepContainer.style.display = 'block';

            // ステップ固有のレンダリング
            switch (stepNumber) {
                case 1:
                    this.renderStep1();
                    break;
                case 2:
                    this.renderStep2();
                    break;
                case 3:
                    this.renderStep3();
                    break;
                case 4:
                    this.renderStep4();
                    break;
                case 5:
                    this.renderStep5();
                    break;
                case 6:
                    this.renderStep6();
                    break;
            }

            // ナビゲーションボタンの状態を更新
            this.updateNavigationButtons();

            // アニメーション効果
            this.animateStepTransition(stepContainer);
        }
    }

    /**
     * 全てのステップを非表示
     */
    hideAllSteps() {
        for (let i = 1; i <= 6; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.style.display = 'none';
            }
        }
    }

    /**
     * Step 1: テーマ入力の描画
     */
    renderStep1() {
        const themeInput = document.getElementById('theme-input');
        if (themeInput && this.data.theme) {
            themeInput.value = this.data.theme;
        }

        // テーマ例の表示
        this.renderThemeExamples();

        // 入力イベントの設定
        this.setupThemeInputEvents();
    }

    /**
     * Step 2: 構成案確認の描画
     */
    renderStep2() {
        const container = document.getElementById('structure-container');
        if (!container) return;

        if (this.data.pillarPage && this.data.clusterPages) {
            this.renderStructureContent(container);
        } else {
            this.renderStructureLoading(container);
        }

        // 編集機能の設定
        this.setupStructureEditEvents();
    }

    /**
     * Step 3: 見出し構成の描画
     */
    renderStep3() {
        const container = document.getElementById('headings-container');
        if (!container) return;

        if (this.data.headings && Object.keys(this.data.headings).length > 0) {
            this.renderHeadingsContent(container);
        } else {
            this.renderHeadingsLoading(container);
        }

        // 見出し編集機能の設定
        this.setupHeadingsEditEvents();
    }

    /**
     * Step 4: 記事執筆進捗の描画
     */
    renderStep4() {
        const container = document.getElementById('generation-container');
        if (!container) return;

        if (this.data.articles && this.data.articles.length > 0) {
            this.renderArticlesContent(container);
        } else {
            this.renderGenerationInterface(container);
        }

        // 生成制御の設定
        this.setupGenerationControls();
    }

    /**
     * Step 5: 品質チェックの描画
     */
    renderStep5() {
        const container = document.getElementById('quality-container');
        if (!container) return;

        if (this.data.qualityChecks && this.data.qualityChecks.length > 0) {
            this.renderQualityResults(container);
        } else {
            this.renderQualityInterface(container);
        }

        // 品質チェック制御の設定
        this.setupQualityControls();
    }

    /**
     * Step 6: 最終承認の描画
     */
    renderStep6() {
        const container = document.getElementById('final-container');
        if (!container) return;

        this.renderFinalApproval(container);
        this.setupFinalApprovalEvents();
    }

    /**
     * テーマ例を描画
     */
    renderThemeExamples() {
        const examplesContainer = document.getElementById('theme-examples');
        if (!examplesContainer) return;

        const examples = [
            'Instagramマーケティング',
            'リモートワーク効率化',
            'デジタルマーケティング戦略',
            'SEO対策',
            'コンテンツマーケティング'
        ];

        examplesContainer.innerHTML = examples.map(example =>
            `<button class="theme-example-btn" onclick="selectThemeExample('${example}')">${example}</button>`
        ).join('');
    }

    /**
     * 構造コンテンツを描画
     */
    renderStructureContent(container) {
        let html = '<div class="structure-content">';

        // ピラーページ
        html += '<div class="pillar-page-section">';
        html += '<h3>📄 ピラーページ</h3>';
        html += `<div class="pillar-page-card">`;
        html += `<h4 contenteditable="true" data-field="pillarPage.title">${this.data.pillarPage.title || ''}</h4>`;
        html += `<p contenteditable="true" data-field="pillarPage.summary">${this.data.pillarPage.summary || ''}</p>`;
        html += '</div>';
        html += '</div>';

        // クラスターページ
        html += '<div class="cluster-pages-section">';
        html += '<h3>📚 クラスターページ</h3>';
        html += '<div class="cluster-pages-grid">';

        if (this.data.clusterPages) {
            this.data.clusterPages.forEach((page, index) => {
                html += `<div class="cluster-page-card" data-page-id="${page.id}">`;
                html += `<div class="page-number">${index + 1}</div>`;
                html += `<h4 contenteditable="true" data-field="clusterPages.${index}.title">${page.title}</h4>`;
                html += `<p contenteditable="true" data-field="clusterPages.${index}.summary">${page.summary || ''}</p>`;
                html += `<button class="remove-page-btn" onclick="removePage('${page.id}')">削除</button>`;
                html += '</div>';
            });
        }

        html += '<div class="add-page-card">';
        html += '<button class="add-page-btn" onclick="addNewPage()">+ ページを追加</button>';
        html += '</div>';

        html += '</div>';
        html += '</div>';
        html += '</div>';

        container.innerHTML = html;
    }

    /**
     * 構造読み込み中を描画
     */
    renderStructureLoading(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>構成案を生成中...</p>
                <button class="generate-structure-btn" onclick="generateStructure()">構成案を生成</button>
            </div>
        `;
    }

    /**
     * 見出しコンテンツを描画
     */
    renderHeadingsContent(container) {
        let html = '<div class="headings-content">';

        if (this.data.clusterPages) {
            this.data.clusterPages.forEach((page, pageIndex) => {
                const headings = this.data.headings[page.id] || [];

                html += `<div class="page-headings-section" data-page-id="${page.id}">`;
                html += `<h3>${page.title}</h3>`;
                html += '<div class="headings-list">';

                headings.forEach((heading, headingIndex) => {
                    html += `<div class="heading-item" data-heading-id="${heading.id}">`;
                    html += `<input type="text" value="${heading.text}"
                             data-field="headings.${page.id}.${headingIndex}.text"
                             class="heading-input">`;
                    html += `<select data-field="headings.${page.id}.${headingIndex}.level" class="heading-level">`;
                    html += `<option value="2" ${heading.level === 2 ? 'selected' : ''}>H2</option>`;
                    html += `<option value="3" ${heading.level === 3 ? 'selected' : ''}>H3</option>`;
                    html += '</select>';
                    html += `<button class="remove-heading-btn" onclick="removeHeading('${page.id}', '${heading.id}')">削除</button>`;
                    html += '</div>';
                });

                html += `<button class="add-heading-btn" onclick="addHeading('${page.id}')">+ 見出しを追加</button>`;
                html += '</div>';
                html += '</div>';
            });
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 見出し読み込み中を描画
     */
    renderHeadingsLoading(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>見出し構成を生成中...</p>
                <button class="generate-headings-btn" onclick="generateHeadings()">見出しを生成</button>
            </div>
        `;
    }

    /**
     * 記事コンテンツを描画
     */
    renderArticlesContent(container) {
        let html = '<div class="articles-content">';
        html += '<h3>生成された記事</h3>';
        html += '<div class="articles-grid">';

        if (this.data.articles) {
            this.data.articles.forEach(article => {
                html += `<div class="article-card" data-article-id="${article.id}">`;
                html += `<h4>${article.title}</h4>`;
                html += `<div class="article-meta">`;
                html += `<span class="word-count">${article.wordCount}文字</span>`;
                html += `<span class="status ${article.qualityStatus}">${article.qualityStatus}</span>`;
                html += '</div>';
                html += `<div class="article-preview">${this.truncateText(article.content, 200)}</div>`;
                html += `<button class="view-article-btn" onclick="viewArticle('${article.id}')">詳細を見る</button>`;
                html += '</div>';
            });
        }

        html += '</div>';
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 生成インターフェースを描画
     */
    renderGenerationInterface(container) {
        container.innerHTML = `
            <div class="generation-interface">
                <h3>記事生成</h3>
                <div class="generation-status">
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="progress-text">0 / 0</div>
                    </div>
                    <div class="current-article"></div>
                </div>
                <div class="generation-controls">
                    <button class="start-generation-btn" onclick="startGeneration()">記事生成を開始</button>
                    <button class="pause-generation-btn" onclick="pauseGeneration()" style="display: none;">一時停止</button>
                    <button class="resume-generation-btn" onclick="resumeGeneration()" style="display: none;">再開</button>
                    <button class="cancel-generation-btn" onclick="cancelGeneration()" style="display: none;">キャンセル</button>
                </div>
            </div>
        `;
    }

    /**
     * 品質結果を描画
     */
    renderQualityResults(container) {
        let html = '<div class="quality-results">';
        html += '<h3>品質チェック結果</h3>';

        if (this.data.qualityChecks) {
            this.data.qualityChecks.forEach(check => {
                html += `<div class="quality-check-card" data-article-id="${check.articleId}">`;
                html += `<h4>${check.title}</h4>`;
                html += `<div class="quality-score">`;
                html += `<span class="score">${check.score}点</span>`;
                html += `<span class="status ${check.status}">${check.status}</span>`;
                html += '</div>';

                if (check.checks) {
                    html += '<div class="check-items">';
                    check.checks.forEach(item => {
                        html += `<div class="check-item">`;
                        html += `<span class="check-name">${item.name}</span>`;
                        html += `<span class="check-value">${item.value}</span>`;
                        html += `<span class="check-status ${item.status}">${item.status}</span>`;
                        html += '</div>';
                    });
                    html += '</div>';
                }

                html += '</div>';
            });
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 品質チェックインターフェースを描画
     */
    renderQualityInterface(container) {
        container.innerHTML = `
            <div class="quality-interface">
                <h3>品質チェック</h3>
                <p>生成された記事の品質をチェックします。</p>
                <button class="start-quality-check-btn" onclick="startQualityCheck()">品質チェックを開始</button>
            </div>
        `;
    }

    /**
     * 最終承認を描画
     */
    renderFinalApproval(container) {
        let html = '<div class="final-approval">';
        html += '<h3>最終承認</h3>';

        // ピラーページプレビュー
        if (this.data.pillarPage) {
            html += '<div class="pillar-preview">';
            html += '<h4>ピラーページプレビュー</h4>';
            html += `<div class="preview-content">${this.data.pillarPage.content || 'コンテンツを生成してください'}</div>`;
            html += '</div>';
        }

        // 統計情報
        html += '<div class="project-stats">';
        html += '<h4>プロジェクト統計</h4>';
        html += '<div class="stats-grid">';
        html += `<div class="stat-item">`;
        html += `<span class="stat-label">総記事数</span>`;
        html += `<span class="stat-value">${(this.data.articles || []).length + 1}</span>`;
        html += '</div>';
        html += `<div class="stat-item">`;
        html += `<span class="stat-label">総文字数</span>`;
        html += `<span class="stat-value">${this.calculateTotalWordCount()}</span>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';

        // アクションボタン
        html += '<div class="final-actions">';
        html += '<button class="download-btn" onclick="downloadProject()">プロジェクトをダウンロード</button>';
        html += '<button class="publish-btn" onclick="publishProject()">CMSに投稿</button>';
        html += '</div>';

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * ナビゲーションボタンの状態を更新
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }

        if (nextBtn) {
            const isLastStep = this.currentStep === 6;
            nextBtn.textContent = isLastStep ? '完了' : '次へ';
        }
    }

    /**
     * ステップ遷移アニメーション
     */
    animateStepTransition(container) {
        container.style.opacity = '0';
        container.style.transform = 'translateX(20px)';

        setTimeout(() => {
            container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            container.style.opacity = '1';
            container.style.transform = 'translateX(0)';
        }, 50);
    }

    /**
     * テーマ入力イベントを設定
     */
    setupThemeInputEvents() {
        const themeInput = document.getElementById('theme-input');
        if (themeInput) {
            themeInput.addEventListener('input', (e) => {
                // リアルタイムでデータを更新
                this.updateData({ theme: e.target.value });
            });
        }
    }

    /**
     * 構造編集イベントを設定
     */
    setupStructureEditEvents() {
        // contenteditable要素の変更を監視
        document.querySelectorAll('[contenteditable="true"]').forEach(element => {
            element.addEventListener('blur', (e) => {
                const field = e.target.getAttribute('data-field');
                if (field) {
                    this.updateDataByPath(field, e.target.textContent);
                }
            });
        });
    }

    /**
     * 見出し編集イベントを設定
     */
    setupHeadingsEditEvents() {
        // 見出し入力の変更を監視
        document.querySelectorAll('.heading-input, .heading-level').forEach(element => {
            element.addEventListener('change', (e) => {
                const field = e.target.getAttribute('data-field');
                if (field) {
                    this.updateDataByPath(field, e.target.value);
                }
            });
        });
    }

    /**
     * 生成制御を設定
     */
    setupGenerationControls() {
        // 生成制御ボタンのイベントリスナーは外部で設定
    }

    /**
     * 品質チェック制御を設定
     */
    setupQualityControls() {
        // 品質チェック制御ボタンのイベントリスナーは外部で設定
    }

    /**
     * 最終承認イベントを設定
     */
    setupFinalApprovalEvents() {
        // 最終承認ボタンのイベントリスナーは外部で設定
    }

    /**
     * データを更新
     */
    updateData(updates) {
        Object.assign(this.data, updates);
        // 外部のデータ更新コールバックを呼び出し
        if (window.hubpilot && window.hubpilot.updateData) {
            window.hubpilot.updateData(updates);
        }
    }

    /**
     * パス指定でデータを更新
     */
    updateDataByPath(path, value) {
        const keys = path.split('.');
        let current = this.data;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;

        // 外部のデータ更新コールバックを呼び出し
        if (window.hubpilot && window.hubpilot.saveData) {
            window.hubpilot.saveData(this.data);
        }
    }

    /**
     * テキストを切り詰め
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * 総文字数を計算
     */
    calculateTotalWordCount() {
        let total = 0;

        if (this.data.pillarPage && this.data.pillarPage.content) {
            total += this.data.pillarPage.content.length;
        }

        if (this.data.articles) {
            total += this.data.articles.reduce((sum, article) => sum + (article.wordCount || 0), 0);
        }

        return total.toLocaleString();
    }

    /**
     * ローディング表示
     */
    showLoading(message = '読み込み中...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.querySelector('.loading-text').textContent = message;
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * ローディング非表示
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * 進捗を更新
     */
    updateProgress(current, total, message = '') {
        const progressBar = document.querySelector('.generation-interface .progress-fill');
        const progressText = document.querySelector('.generation-interface .progress-text');
        const currentArticle = document.querySelector('.generation-interface .current-article');

        if (progressBar) {
            const percentage = (current / total) * 100;
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${current} / ${total}`;
        }

        if (currentArticle && message) {
            currentArticle.textContent = message;
        }
    }
}

// グローバルに公開
window.UIRenderer = UIRenderer;
