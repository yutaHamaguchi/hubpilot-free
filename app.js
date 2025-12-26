// HubPilot Free - SEO記事作成エージェント
// メインアプリケーションクラス

class HubPilotApp {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.data = {
            theme: '',
            pillarPage: {},
            clusterPages: [],
            headings: {},
            articles: [],
            qualityChecks: []
        };
        
        this.init();
    }
    
    init() {
        this.loadStepFromURL();
        this.loadData();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.setupBrowserNavigation();
        this.updateUI();
    }
    
    // イベントリスナーの設定
    bindEvents() {
        // Step 1: テーマ入力
        const themeInput = document.getElementById('theme-input');
        const generateBtn = document.getElementById('generate-structure-btn');
        
        if (themeInput) {
            themeInput.addEventListener('input', () => this.handleThemeInput());
            themeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !generateBtn.disabled) {
                    this.generateStructure();
                }
            });
            themeInput.addEventListener('focus', () => this.onThemeInputFocus());
            themeInput.addEventListener('blur', () => this.onThemeInputBlur());
        }
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateStructure());
        }
        
        // テーマ例ボタン
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.selectThemeExample(theme);
            });
        });
        
        // Step 2: 構成案確認の強化
        const proceedToHeadingsBtn = document.getElementById('proceed-to-headings-btn');
        const editPillarBtn = document.getElementById('edit-pillar-btn');
        const addClusterBtn = document.getElementById('add-cluster-btn');
        const regenerateClusterBtn = document.getElementById('regenerate-cluster-btn');
        
        if (proceedToHeadingsBtn) {
            proceedToHeadingsBtn.addEventListener('click', () => this.proceedToHeadings());
        }
        
        if (editPillarBtn) {
            editPillarBtn.addEventListener('click', () => this.editPillarPage());
        }
        
        if (addClusterBtn) {
            addClusterBtn.addEventListener('click', () => this.addClusterPage());
        }
        
        if (regenerateClusterBtn) {
            regenerateClusterBtn.addEventListener('click', () => this.regenerateClusterPages());
        }
        
        // Step 3: 見出し構成の強化
        const startWritingBtn = document.getElementById('start-writing-btn');
        const expandAllBtn = document.getElementById('expand-all-btn');
        const collapseAllBtn = document.getElementById('collapse-all-btn');
        const regenerateHeadingsBtn = document.getElementById('regenerate-headings-btn');
        
        if (startWritingBtn) {
            startWritingBtn.addEventListener('click', () => this.startWriting());
        }
        
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => this.expandAllAccordions());
        }
        
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => this.collapseAllAccordions());
        }
        
        if (regenerateHeadingsBtn) {
            regenerateHeadingsBtn.addEventListener('click', () => this.regenerateAllHeadings());
        }
        
        // ビュー切り替え
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchHeadingsView(view);
            });
        });
        
        // Step 4: 記事執筆進捗の強化
        const proceedToQualityBtn = document.getElementById('proceed-to-quality-btn');
        const pauseGenerationBtn = document.getElementById('pause-generation-btn');
        const resumeGenerationBtn = document.getElementById('resume-generation-btn');
        const cancelGenerationBtn = document.getElementById('cancel-generation-btn');
        
        if (proceedToQualityBtn) {
            proceedToQualityBtn.addEventListener('click', () => this.proceedToQuality());
        }
        
        if (pauseGenerationBtn) {
            pauseGenerationBtn.addEventListener('click', () => this.pauseGeneration());
        }
        
        if (resumeGenerationBtn) {
            resumeGenerationBtn.addEventListener('click', () => this.resumeGeneration());
        }
        
        if (cancelGenerationBtn) {
            cancelGenerationBtn.addEventListener('click', () => this.cancelGeneration());
        }
        
        // Step 5: 品質チェックの強化
        const createPillarBtn = document.getElementById('create-pillar-btn');
        const recheckAllBtn = document.getElementById('recheck-all-btn');
        const autoFixBtn = document.getElementById('auto-fix-btn');
        const exportReportBtn = document.getElementById('export-report-btn');
        
        if (createPillarBtn) {
            createPillarBtn.addEventListener('click', () => this.createPillarPage());
        }
        
        if (recheckAllBtn) {
            recheckAllBtn.addEventListener('click', () => this.recheckAllArticles());
        }
        
        if (autoFixBtn) {
            autoFixBtn.addEventListener('click', () => this.autoFixArticles());
        }
        
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => this.exportQualityReport());
        }
        
        // フィルターボタン
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.filterQualityResults(filter);
            });
        });
        
        // Step 6: 最終承認
        const downloadBtn = document.getElementById('download-all-btn');
        const publishBtn = document.getElementById('publish-cms-btn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadAll());
        }
        
        if (publishBtn) {
            publishBtn.addEventListener('click', () => this.publishToCMS());
        }
        
        // ナビゲーションボタン
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        // ステップクリック
        document.querySelectorAll('.step-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const step = parseInt(e.currentTarget.dataset.step);
                if (step <= this.currentStep || this.canNavigateToStep(step)) {
                    this.goToStep(step);
                }
            });
        });
    }
    
    // テーマ入力の処理
    handleThemeInput() {
        const input = document.getElementById('theme-input');
        const error = document.getElementById('theme-error');
        const btn = document.getElementById('generate-structure-btn');
        const charCount = document.getElementById('char-count');
        
        if (!input || !error || !btn || !charCount) return;
        
        const value = input.value.trim();
        const length = input.value.length;
        
        // 文字数カウント更新
        charCount.textContent = length;
        
        // バリデーション
        const validation = this.validateTheme(value);
        
        // UI更新
        input.classList.remove('valid', 'invalid');
        if (value.length > 0) {
            input.classList.add(validation.isValid ? 'valid' : 'invalid');
        }
        
        error.textContent = validation.message;
        btn.disabled = !validation.isValid;
        
        // データ保存
        if (validation.isValid) {
            this.data.theme = value;
            this.saveData();
        }
        
        return validation.isValid;
    }
    
    // テーマバリデーション
    validateTheme(theme) {
        if (!theme || theme.length === 0) {
            return { isValid: false, message: 'テーマを入力してください' };
        }
        
        if (theme.length < 2) {
            return { isValid: false, message: 'テーマは2文字以上で入力してください' };
        }
        
        if (theme.length > 100) {
            return { isValid: false, message: 'テーマは100文字以内で入力してください' };
        }
        
        // 特殊文字のチェック
        const invalidChars = /[<>{}[\]\\\/]/;
        if (invalidChars.test(theme)) {
            return { isValid: false, message: '使用できない文字が含まれています' };
        }
        
        // 数字のみのチェック
        if (/^\d+$/.test(theme)) {
            return { isValid: false, message: '数字のみのテーマは使用できません' };
        }
        
        return { isValid: true, message: '' };
    }
    
    // テーマ入力フォーカス時
    onThemeInputFocus() {
        const container = document.querySelector('.theme-input-container');
        if (container) {
            container.classList.add('focused');
        }
        
        // ヘルプテキストの表示
        this.showInputHelp();
    }
    
    // テーマ入力ブラー時
    onThemeInputBlur() {
        const container = document.querySelector('.theme-input-container');
        if (container) {
            container.classList.remove('focused');
        }
    }
    
    // 入力ヘルプの表示
    showInputHelp() {
        // 将来的にツールチップやヘルプテキストを表示
        console.log('Input help shown');
    }
    
    // テーマ例の選択
    selectThemeExample(theme) {
        const input = document.getElementById('theme-input');
        if (input) {
            input.value = theme;
            input.focus();
            
            // アニメーション効果
            input.style.transform = 'scale(1.02)';
            setTimeout(() => {
                input.style.transform = 'scale(1)';
            }, 200);
            
            // バリデーション実行
            this.handleThemeInput();
            
            // 成功通知
            this.showNotification(`テーマ「${theme}」を選択しました`, 'success', 2000);
        }
    }
    
    // 旧メソッドとの互換性維持
    validateThemeInput() {
        return this.handleThemeInput();
    }
    
    // 構成案生成（Step 1 → Step 2）
    async generateStructure() {
        const validation = this.validateTheme(this.data.theme);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }
        
        const themeInput = document.getElementById('theme-input');
        const theme = themeInput.value.trim();
        
        this.data.theme = theme;
        this.saveData();
        
        this.showLoading('構成案を生成中...');
        
        // 2-3秒の遅延をシミュレート
        await this.delay(2500);
        
        // モックデータ生成
        this.data.pillarPage = {
            title: `${theme}完全ガイド - 初心者から上級者まで`
        };
        
        this.data.clusterPages = [
            `${theme}の基本概念と重要性`,
            `${theme}を始めるための準備と必要なツール`,
            `${theme}の効果的な戦略立案方法`,
            `${theme}のベストプラクティス10選`,
            `${theme}でよくある失敗とその対策`,
            `${theme}の成功事例とケーススタディ`,
            `${theme}の最新トレンドと将来展望`,
            `${theme}のROI測定と効果分析`,
            `${theme}に役立つツールとリソース`,
            `${theme}のエキスパートが教える上級テクニック`
        ];
        
        this.saveData();
        this.hideLoading();
        
        // 成功通知
        this.showNotification('構成案の生成が完了しました！', 'success');
        
        this.goToStep(2);
        this.renderStructure();
    }
    
    // 構成案の表示（強化版）
    renderStructure() {
        const pillarTitle = document.getElementById('pillar-page-title');
        const clusterList = document.getElementById('cluster-pages-list');
        
        if (pillarTitle) {
            pillarTitle.textContent = this.data.pillarPage.title;
        }
        
        if (clusterList) {
            clusterList.innerHTML = '';
            this.data.clusterPages.forEach((title, index) => {
                const item = document.createElement('div');
                item.className = 'cluster-page-item';
                item.setAttribute('data-index', index + 1);
                item.innerHTML = `
                    <div class="cluster-page-content">
                        <div class="cluster-page-title">${title}</div>
                        <div class="cluster-page-meta">
                            <span>📝 約2000文字</span>
                            <span>🎯 SEO最適化</span>
                        </div>
                    </div>
                    <div class="cluster-page-actions">
                        <button class="btn btn-small btn-secondary" onclick="app.editClusterPage(${index})">
                            <span class="btn-icon">✏️</span>
                            編集
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="app.deleteClusterPage(${index})">
                            <span class="btn-icon">🗑️</span>
                            削除
                        </button>
                    </div>
                `;
                clusterList.appendChild(item);
            });
        }
        
        // カウンターの更新
        this.updateStructureCounts();
    }
    
    // 構成カウンターの更新
    updateStructureCounts() {
        const clusterCount = this.data.clusterPages.length;
        const totalCount = clusterCount + 1; // ピラーページ + クラスターページ
        
        const elements = {
            'cluster-count': clusterCount,
            'summary-cluster-count': clusterCount,
            'summary-total-count': totalCount
        };
        
        Object.entries(elements).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
            }
        });
    }
    
    // ピラーページの編集
    editPillarPage() {
        const currentTitle = this.data.pillarPage.title;
        const newTitle = prompt('ピラーページのタイトルを編集してください:', currentTitle);
        
        if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
            this.data.pillarPage.title = newTitle.trim();
            this.saveData();
            this.renderStructure();
            this.showNotification('ピラーページタイトルを更新しました', 'success');
        }
    }
    
    // クラスターページの追加
    addClusterPage() {
        const newTitle = prompt('新しいクラスターページのタイトルを入力してください:');
        
        if (newTitle && newTitle.trim()) {
            this.data.clusterPages.push(newTitle.trim());
            this.saveData();
            this.renderStructure();
            this.showNotification('クラスターページを追加しました', 'success');
        }
    }
    
    // クラスターページの再生成
    async regenerateClusterPages() {
        if (!confirm('クラスターページを再生成しますか？現在の内容は失われます。')) {
            return;
        }
        
        this.showLoading('クラスターページを再生成中...');
        
        await this.delay(2000);
        
        const theme = this.data.theme;
        const variations = [
            '基本概念と重要性',
            '始めるための準備と必要なツール',
            '効果的な戦略立案方法',
            'ベストプラクティス10選',
            'よくある失敗とその対策',
            '成功事例とケーススタディ',
            '最新トレンドと将来展望',
            'ROI測定と効果分析',
            '役立つツールとリソース',
            'エキスパートが教える上級テクニック',
            '初心者向け完全ガイド',
            '実践的な活用方法'
        ];
        
        // ランダムに10個選択
        const shuffled = variations.sort(() => 0.5 - Math.random());
        this.data.clusterPages = shuffled.slice(0, 10).map(variation => `${theme}の${variation}`);
        
        this.saveData();
        this.hideLoading();
        this.renderStructure();
        this.showNotification('クラスターページを再生成しました', 'success');
    }
    
    // 見出し構成へ進む（Step 2 → Step 3）
    async proceedToHeadings() {
        this.showLoading('見出し構成を生成中...');
        
        await this.delay(2000);
        
        // 各クラスターページの見出しを生成
        this.data.headings = {};
        this.data.clusterPages.forEach((title, index) => {
            this.data.headings[index] = [
                `${title.replace(/の.*/, '')}の基本的な考え方`,
                `実践的なアプローチと手法`,
                `成功のためのポイントと注意点`,
                `まとめと次のステップ`
            ];
        });
        
        this.saveData();
        this.hideLoading();
        this.goToStep(3);
        this.renderHeadings();
    }
    
    // 見出し構成の表示（強化版）
    renderHeadings() {
        const accordion = document.getElementById('headings-accordion');
        const listView = document.getElementById('headings-list-view');
        
        if (!accordion) return;
        
        accordion.innerHTML = '';
        
        this.data.clusterPages.forEach((title, index) => {
            const item = document.createElement('div');
            item.className = 'accordion-item';
            
            const headings = this.data.headings[index] || [];
            const headingsHTML = headings.map((heading, hIndex) => 
                `<div class="heading-item">
                    <div class="heading-content">
                        <div class="heading-level">H2</div>
                        <div class="heading-text">${heading}</div>
                    </div>
                    <div class="heading-actions">
                        <button class="btn btn-small btn-secondary" onclick="app.editHeading(${index}, ${hIndex})">
                            <span class="btn-icon">✏️</span>
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="app.deleteHeading(${index}, ${hIndex})">
                            <span class="btn-icon">🗑️</span>
                        </button>
                    </div>
                </div>`
            ).join('');
            
            item.innerHTML = `
                <div class="accordion-header" onclick="app.toggleAccordion(${index})" data-index="${index + 1}">
                    <div class="accordion-title">${title}</div>
                    <div class="accordion-meta">
                        <span>📝 ${headings.length}見出し</span>
                        <span>⏱️ 約${Math.ceil(headings.length * 0.5)}分</span>
                    </div>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content" id="accordion-content-${index}">
                    <div class="headings-list">
                        ${headingsHTML}
                        <button class="btn btn-small btn-secondary" onclick="app.addHeading(${index})" style="margin-top: 1rem;">
                            <span class="btn-icon">➕</span>
                            見出しを追加
                        </button>
                    </div>
                </div>
            `;
            
            accordion.appendChild(item);
        });
        
        // リストビューも更新
        this.renderHeadingsListView();
        
        // 統計を更新
        this.updateHeadingsStats();
    }
    
    // リストビューの表示
    renderHeadingsListView() {
        const listView = document.getElementById('headings-list-view');
        if (!listView) return;
        
        listView.innerHTML = '';
        
        this.data.clusterPages.forEach((title, index) => {
            const headings = this.data.headings[index] || [];
            
            const article = document.createElement('div');
            article.className = 'list-view-article';
            
            const headingsHTML = headings.map(heading => 
                `<div class="list-view-heading">H2: ${heading}</div>`
            ).join('');
            
            article.innerHTML = `
                <div class="list-view-title">
                    <span>${index + 1}.</span>
                    ${title}
                </div>
                <div class="list-view-headings">
                    ${headingsHTML}
                </div>
            `;
            
            listView.appendChild(article);
        });
    }
    
    // 見出し統計の更新
    updateHeadingsStats() {
        const totalArticles = this.data.clusterPages.length;
        const totalHeadings = Object.values(this.data.headings).reduce((sum, headings) => sum + headings.length, 0);
        const avgHeadings = totalHeadings / totalArticles;
        const estimatedTime = Math.ceil(totalHeadings * 0.6); // 見出し1つあたり約0.6分
        const estimatedWords = totalHeadings * 500; // 見出し1つあたり約500文字
        const internalLinks = Math.ceil(totalHeadings * 1.1); // 見出し1つあたり約1.1個のリンク
        
        const updates = {
            'total-articles': totalArticles,
            'total-headings': totalHeadings,
            'estimated-time': estimatedTime,
            'avg-headings': avgHeadings.toFixed(1),
            'estimated-words': estimatedWords.toLocaleString(),
            'internal-links': internalLinks
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // アコーディオンの開閉（強化版）
    toggleAccordion(index) {
        const content = document.getElementById(`accordion-content-${index}`);
        const header = content.previousElementSibling;
        const icon = header.querySelector('.accordion-icon');
        const item = header.parentElement;
        
        const isActive = content.classList.contains('active');
        
        if (isActive) {
            content.classList.remove('active');
            header.classList.remove('active');
            item.classList.remove('active');
            icon.textContent = '▼';
        } else {
            content.classList.add('active');
            header.classList.add('active');
            item.classList.add('active');
            icon.textContent = '▲';
        }
    }
    
    // すべてのアコーディオンを展開
    expandAllAccordions() {
        document.querySelectorAll('.accordion-content').forEach((content, index) => {
            const header = content.previousElementSibling;
            const icon = header.querySelector('.accordion-icon');
            const item = header.parentElement;
            
            content.classList.add('active');
            header.classList.add('active');
            item.classList.add('active');
            icon.textContent = '▲';
        });
        
        this.showNotification('すべての記事を展開しました', 'success', 2000);
    }
    
    // すべてのアコーディオンを折りたたみ
    collapseAllAccordions() {
        document.querySelectorAll('.accordion-content').forEach((content, index) => {
            const header = content.previousElementSibling;
            const icon = header.querySelector('.accordion-icon');
            const item = header.parentElement;
            
            content.classList.remove('active');
            header.classList.remove('active');
            item.classList.remove('active');
            icon.textContent = '▼';
        });
        
        this.showNotification('すべての記事を折りたたみました', 'success', 2000);
    }
    
    // ビュー切り替え
    switchHeadingsView(view) {
        const accordionView = document.getElementById('headings-accordion');
        const listView = document.getElementById('headings-list-view');
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        
        // ボタンの状態更新
        toggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // ビューの切り替え
        if (view === 'accordion') {
            accordionView.style.display = 'flex';
            listView.style.display = 'none';
        } else {
            accordionView.style.display = 'none';
            listView.style.display = 'block';
        }
        
        this.showNotification(`${view === 'accordion' ? 'アコーディオン' : 'リスト'}ビューに切り替えました`, 'info', 2000);
    }
    
    // 見出しの編集
    editHeading(articleIndex, headingIndex) {
        const currentHeading = this.data.headings[articleIndex][headingIndex];
        const newHeading = prompt('見出しを編集してください:', currentHeading);
        
        if (newHeading && newHeading.trim() && newHeading.trim() !== currentHeading) {
            this.data.headings[articleIndex][headingIndex] = newHeading.trim();
            this.saveData();
            this.renderHeadings();
            this.showNotification('見出しを更新しました', 'success');
        }
    }
    
    // 見出しの削除
    deleteHeading(articleIndex, headingIndex) {
        const heading = this.data.headings[articleIndex][headingIndex];
        const shortHeading = heading.length > 30 ? heading.substring(0, 30) + '...' : heading;
        
        if (confirm(`見出し「${shortHeading}」を削除しますか？`)) {
            this.data.headings[articleIndex].splice(headingIndex, 1);
            this.saveData();
            this.renderHeadings();
            this.showNotification('見出しを削除しました', 'success');
        }
    }
    
    // 見出しの追加
    addHeading(articleIndex) {
        const newHeading = prompt('新しい見出しを入力してください:');
        
        if (newHeading && newHeading.trim()) {
            this.data.headings[articleIndex].push(newHeading.trim());
            this.saveData();
            this.renderHeadings();
            this.showNotification('見出しを追加しました', 'success');
        }
    }
    
    // すべての見出しを再生成
    async regenerateAllHeadings() {
        if (!confirm('すべての見出しを再生成しますか？現在の見出しは失われます。')) {
            return;
        }
        
        this.showLoading('見出しを再生成中...');
        
        await this.delay(2500);
        
        // 見出しのバリエーション
        const headingTemplates = [
            '基本的な考え方と重要性',
            '実践的なアプローチと手法',
            '成功のためのポイントと注意点',
            'よくある課題と解決策',
            '効果的な活用方法',
            '最新のトレンドと動向',
            '具体的な事例と実績',
            'まとめと次のステップ'
        ];
        
        // 各クラスターページの見出しを再生成
        this.data.headings = {};
        this.data.clusterPages.forEach((title, index) => {
            const baseTheme = title.replace(/の.*/, '');
            const shuffled = headingTemplates.sort(() => 0.5 - Math.random());
            const selectedTemplates = shuffled.slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4個
            
            this.data.headings[index] = selectedTemplates.map(template => 
                `${baseTheme}の${template}`
            );
        });
        
        this.saveData();
        this.hideLoading();
        this.renderHeadings();
        this.showNotification('すべての見出しを再生成しました', 'success');
    }
    
    // 記事執筆開始（Step 3 → Step 4）強化版
    async startWriting() {
        this.goToStep(4);
        this.renderArticlesGrid();
        this.initializeGenerationControls();
        
        // 生成開始時刻を記録
        this.generationStartTime = Date.now();
        this.generationPaused = false;
        this.generationCancelled = false;
        
        // 記事を順次生成
        for (let i = 0; i < this.data.clusterPages.length; i++) {
            if (this.generationCancelled) break;
            
            // 一時停止中は待機
            while (this.generationPaused && !this.generationCancelled) {
                await this.delay(500);
            }
            
            if (!this.generationCancelled) {
                await this.generateArticle(i);
            }
        }
        
        if (!this.generationCancelled) {
            this.showCompletionSection();
        }
    }
    
    // 生成コントロールの初期化
    initializeGenerationControls() {
        const pauseBtn = document.getElementById('pause-generation-btn');
        const resumeBtn = document.getElementById('resume-generation-btn');
        const cancelBtn = document.getElementById('cancel-generation-btn');
        const progressStatus = document.getElementById('progress-status');
        
        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (progressStatus) progressStatus.textContent = '生成中...';
    }
    
    // 記事グリッドの表示（強化版）
    renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.data.clusterPages.forEach((title, index) => {
            const card = document.createElement('div');
            card.className = 'article-card pending';
            card.id = `article-card-${index}`;
            
            card.innerHTML = `
                <div class="article-header">
                    <div class="article-number">${index + 1}</div>
                    <div class="article-title">${title}</div>
                    <div class="article-status status-pending" id="status-${index}">待機中</div>
                </div>
                <div class="article-meta">
                    <span>📝 推定2000文字</span>
                    <span>⏱️ 約2.5分</span>
                </div>
                <div class="article-progress">
                    <div class="article-progress-fill" id="progress-${index}"></div>
                </div>
                <div class="article-preview" id="preview-${index}">
                    記事生成待機中...
                </div>
                <div class="article-actions">
                    <button class="btn btn-small btn-secondary" onclick="app.previewArticle(${index})">
                        <span class="btn-icon">👁️</span>
                        プレビュー
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.editArticle(${index})">
                        <span class="btn-icon">✏️</span>
                        編集
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        // 統計を初期化
        this.updateProgressStats();
    }
    
    // 個別記事の生成（強化版）
    async generateArticle(index) {
        const card = document.getElementById(`article-card-${index}`);
        const status = document.getElementById(`status-${index}`);
        const preview = document.getElementById(`preview-${index}`);
        const progressFill = document.getElementById(`progress-${index}`);
        const overallProgressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        
        // 進行中状態に更新
        card.className = 'article-card in-progress';
        status.className = 'article-status status-in-progress';
        status.textContent = '生成中';
        preview.textContent = 'AIが記事を生成しています...';
        
        // プログレスバー更新
        progressText.textContent = `記事 ${index + 1}/10 を作成中...`;
        
        // 段階的な進捗表示
        const progressSteps = [20, 40, 60, 80, 100];
        for (const step of progressSteps) {
            if (this.generationCancelled || this.generationPaused) break;
            
            progressFill.style.width = `${step}%`;
            await this.delay(400 + Math.random() * 400);
        }
        
        // 最終的な生成時間（2-4秒）
        const finalDelay = 1000 + Math.random() * 2000;
        await this.delay(finalDelay);
        
        if (this.generationCancelled) return;
        
        // 完了状態に更新
        card.className = 'article-card completed';
        status.className = 'article-status status-completed';
        status.textContent = '完了';
        progressFill.className = 'article-progress-fill completed';
        
        // モック記事内容
        const mockContent = this.generateMockArticleContent(this.data.clusterPages[index]);
        preview.textContent = mockContent.substring(0, 120) + '...';
        preview.classList.add('has-content');
        
        // 記事データを保存
        this.data.articles[index] = {
            title: this.data.clusterPages[index],
            content: mockContent,
            wordCount: 1800 + Math.floor(Math.random() * 400), // 1800-2200文字
            status: 'completed',
            generatedAt: new Date().toISOString()
        };
        
        // 全体プログレスバー更新
        const progress = ((index + 1) / this.data.clusterPages.length) * 100;
        overallProgressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${Math.round(progress)}%`;
        
        // 統計更新
        this.updateProgressStats();
        this.updateGenerationSpeed();
        
        if (index === this.data.clusterPages.length - 1) {
            progressText.textContent = '全記事の生成が完了しました！';
            const progressStatus = document.getElementById('progress-status');
            if (progressStatus) progressStatus.textContent = '完了';
        }
        
        this.saveData();
    }
    
    // モック記事コンテンツの生成
    generateMockArticleContent(title) {
        const templates = [
            `${title}について詳しく解説します。この記事では、基本的な概念から実践的な手法まで、幅広くカバーしています。`,
            `${title}は現代のビジネスにおいて重要な要素です。効果的な活用方法を具体例とともに紹介します。`,
            `${title}を成功させるためには、戦略的なアプローチが必要です。専門家の視点から詳しく説明します。`,
            `${title}の最新動向と実践的なノウハウを、豊富な事例とともにお伝えします。`
        ];
        
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        const additionalContent = `

## 主要なポイント

1. **基本理解**: ${title}の基礎知識を身につける
2. **実践応用**: 具体的な活用方法を学ぶ
3. **効果測定**: 成果を適切に評価する
4. **継続改善**: 長期的な成功を目指す

## まとめ

${title}を効果的に活用することで、ビジネスの成長を加速させることができます。継続的な学習と実践を通じて、より良い結果を目指しましょう。`;
        
        return randomTemplate + additionalContent;
    }
    
    // 進捗統計の更新
    updateProgressStats() {
        const completedCount = this.data.articles.filter(a => a && a.status === 'completed').length;
        const remainingCount = this.data.clusterPages.length - completedCount;
        const estimatedRemaining = Math.max(0, remainingCount * 2.5); // 記事1つあたり2.5分
        
        const elements = {
            'completed-count': completedCount,
            'remaining-count': remainingCount,
            'estimated-remaining': `${Math.ceil(estimatedRemaining)}分`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // 生成速度の更新
    updateGenerationSpeed() {
        if (!this.generationStartTime) return;
        
        const completedCount = this.data.articles.filter(a => a && a.status === 'completed').length;
        const elapsedMinutes = (Date.now() - this.generationStartTime) / (1000 * 60);
        const speed = completedCount / Math.max(elapsedMinutes, 0.1);
        
        const speedElement = document.getElementById('generation-speed');
        if (speedElement) {
            speedElement.textContent = `${speed.toFixed(1)}記事/分`;
        }
    }
    
    // 完了セクションの表示
    showCompletionSection() {
        const completionSection = document.getElementById('completion-section');
        const totalWords = this.data.articles.reduce((sum, article) => sum + (article?.wordCount || 0), 0);
        const totalTime = Math.ceil((Date.now() - this.generationStartTime) / (1000 * 60));
        
        // 統計を更新
        const elements = {
            'total-generated': this.data.articles.length,
            'total-words': totalWords.toLocaleString(),
            'total-time': `${totalTime}分`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        if (completionSection) {
            completionSection.style.display = 'block';
            
            // アニメーション効果
            setTimeout(() => {
                completionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
        
        // コントロールボタンを非表示
        const controlBtns = ['pause-generation-btn', 'resume-generation-btn', 'cancel-generation-btn'];
        controlBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
    }
    
    // 生成の一時停止
    pauseGeneration() {
        this.generationPaused = true;
        
        const pauseBtn = document.getElementById('pause-generation-btn');
        const resumeBtn = document.getElementById('resume-generation-btn');
        const progressStatus = document.getElementById('progress-status');
        
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'inline-flex';
        if (progressStatus) progressStatus.textContent = '一時停止中...';
        
        this.showNotification('記事生成を一時停止しました', 'info');
    }
    
    // 生成の再開
    resumeGeneration() {
        this.generationPaused = false;
        
        const pauseBtn = document.getElementById('pause-generation-btn');
        const resumeBtn = document.getElementById('resume-generation-btn');
        const progressStatus = document.getElementById('progress-status');
        
        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (progressStatus) progressStatus.textContent = '生成中...';
        
        this.showNotification('記事生成を再開しました', 'success');
    }
    
    // 生成のキャンセル
    cancelGeneration() {
        if (!confirm('記事生成をキャンセルしますか？進行中の作業は失われます。')) {
            return;
        }
        
        this.generationCancelled = true;
        this.generationPaused = false;
        
        const progressStatus = document.getElementById('progress-status');
        if (progressStatus) progressStatus.textContent = 'キャンセル済み';
        
        // コントロールボタンを非表示
        const controlBtns = ['pause-generation-btn', 'resume-generation-btn', 'cancel-generation-btn'];
        controlBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
        
        this.showNotification('記事生成をキャンセルしました', 'warning');
    }
    
    // 記事プレビュー
    previewArticle(index) {
        const article = this.data.articles[index];
        if (!article) {
            this.showNotification('記事がまだ生成されていません', 'warning');
            return;
        }
        
        // モーダルまたは新しいウィンドウでプレビュー表示
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>${article.title} - プレビュー</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                               max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
                        h1 { color: #2d3748; border-bottom: 2px solid #ff7a59; padding-bottom: 1rem; }
                        h2 { color: #4a5568; margin-top: 2rem; }
                        p { color: #718096; }
                    </style>
                </head>
                <body>
                    <h1>${article.title}</h1>
                    <p><strong>文字数:</strong> ${article.wordCount}文字</p>
                    <div>${article.content.replace(/\n/g, '<br>')}</div>
                </body>
            </html>
        `);
        previewWindow.document.close();
    }
    
    // 記事編集
    editArticle(index) {
        const article = this.data.articles[index];
        if (!article) {
            this.showNotification('記事がまだ生成されていません', 'warning');
            return;
        }
        
        this.showNotification('記事編集機能は実装予定です（フェーズ2）', 'info');
    }
    
    // 品質チェックへ進む（Step 4 → Step 5）強化版
    async proceedToQuality() {
        this.goToStep(5);
        
        // 品質チェック進捗の初期化
        const checkStatus = document.getElementById('check-status');
        const qualityProgressFill = document.getElementById('quality-progress-fill');
        const qualityProgressText = document.getElementById('quality-progress-text');
        
        if (checkStatus) checkStatus.textContent = 'チェック中...';
        if (qualityProgressFill) qualityProgressFill.style.width = '0%';
        if (qualityProgressText) qualityProgressText.textContent = '品質チェック 0/10 完了';
        
        this.showLoading('品質チェック中...');
        
        // 品質チェック開始時刻を記録
        this.qualityCheckStartTime = Date.now();
        
        await this.delay(1500);
        
        // 品質チェック結果を生成
        this.data.qualityChecks = this.data.articles.map((article, index) => {
            const wordCount = article.wordCount;
            const score = 70 + Math.random() * 25; // 70-95点のランダムスコア
            
            // スコアに基づいて品質レベルを決定
            let qualityLevel, issues = [], suggestions = [];
            
            if (score >= 85) {
                qualityLevel = 'passed';
                suggestions = [
                    '素晴らしい品質です。そのまま公開できます。',
                    'SEO最適化も適切に行われています。'
                ];
            } else if (score >= 70) {
                qualityLevel = 'warning';
                issues = [
                    '一部のセクションでより詳細な説明が必要です',
                    'キーワード密度を調整することを推奨します'
                ];
                suggestions = [
                    '具体例を追加して内容を充実させてください',
                    'メタディスクリプションを最適化してください'
                ];
            } else {
                qualityLevel = 'failed';
                issues = [
                    '文字数が推奨範囲を下回っています',
                    'SEOキーワードの使用頻度が不適切です',
                    '読みやすさの改善が必要です'
                ];
                suggestions = [
                    '内容をより詳しく展開してください',
                    'キーワードを自然に組み込んでください',
                    '段落構成を見直してください'
                ];
            }
            
            return {
                articleIndex: index,
                score: Math.round(score),
                qualityLevel: qualityLevel,
                wordCount: { 
                    status: wordCount >= 1800 && wordCount <= 2200 ? 'passed' : 'warning', 
                    value: wordCount 
                },
                seoCheck: { 
                    status: score >= 80 ? 'passed' : 'warning',
                    score: Math.round(score * 0.9)
                },
                readability: { 
                    status: score >= 75 ? 'passed' : 'warning',
                    score: Math.round(score * 1.1)
                },
                factCheck: { 
                    status: Math.random() > 0.3 ? 'passed' : 'warning',
                    issues: Math.random() > 0.3 ? [] : ['統計データの確認が必要']
                },
                issues: issues,
                suggestions: suggestions
            };
        });
        
        this.saveData();
        this.hideLoading();
        this.renderQualityResults();
        this.updateQualityStats();
        
        // 成功通知
        this.showNotification('品質チェックが完了しました', 'success');
    }
    
    // 品質チェック結果の表示（強化版）
    renderQualityResults() {
        const results = document.getElementById('quality-results');
        if (!results) return;
        
        // 品質チェックデータが存在しない場合の処理
        if (!this.data.qualityChecks || this.data.qualityChecks.length === 0) {
            results.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--dark-gray);">
                    <p>品質チェックデータがありません。</p>
                    <button class="btn btn-primary" onclick="app.proceedToQuality()">品質チェックを開始</button>
                </div>
            `;
            return;
        }
        
        results.innerHTML = '';
        
        this.data.qualityChecks.forEach((check, index) => {
            const article = this.data.articles[index];
            const item = document.createElement('div');
            item.className = `quality-item ${check.qualityLevel}`;
            item.setAttribute('data-filter', check.qualityLevel);
            
            // チェック項目の生成
            const checksHTML = [
                { name: '文字数', status: check.wordCount.status, value: `${check.wordCount.value}文字` },
                { name: 'SEO最適化', status: check.seoCheck.status, value: `${check.seoCheck.score}点` },
                { name: '読みやすさ', status: check.readability.status, value: `${check.readability.score}点` },
                { name: 'ファクトチェック', status: check.factCheck.status, value: check.factCheck.issues.length === 0 ? '問題なし' : '要確認' }
            ].map(checkItem => `
                <div class="check-item ${checkItem.status}">
                    <span class="check-icon">${checkItem.status === 'passed' ? '✅' : checkItem.status === 'warning' ? '⚠️' : '❌'}</span>
                    <div>
                        <div>${checkItem.name}</div>
                        <div style="font-size: 0.75rem; color: var(--dark-gray);">${checkItem.value}</div>
                    </div>
                </div>
            `).join('');
            
            const issuesHTML = check.issues.length > 0 ? `
                <div class="quality-issues">
                    <h5>🚨 検出された問題</h5>
                    <ul>
                        ${check.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            ` : '';
            
            const suggestionsHTML = check.suggestions.length > 0 ? `
                <div class="quality-suggestions">
                    <h5>💡 改善提案</h5>
                    <ul>
                        ${check.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            ` : '';
            
            const badgeClass = check.qualityLevel === 'passed' ? 'badge-passed' : 
                              check.qualityLevel === 'warning' ? 'badge-warning' : 'badge-failed';
            const badgeText = check.qualityLevel === 'passed' ? '合格' : 
                             check.qualityLevel === 'warning' ? '要注意' : '要修正';
            
            item.innerHTML = `
                <div class="quality-score ${check.qualityLevel}" style="--score: ${check.score}">
                    ${check.score}
                </div>
                <div class="quality-header">
                    <div class="quality-article-info">
                        <div class="quality-article-number">${index + 1}</div>
                        <div class="quality-article-title">${article.title}</div>
                        <div class="quality-article-meta">
                            <span>📝 ${article.wordCount}文字</span>
                            <span>⏱️ 生成済み</span>
                            <span>🎯 品質スコア: ${check.score}点</span>
                        </div>
                    </div>
                    <div class="quality-badge ${badgeClass}">
                        ${badgeText}
                    </div>
                </div>
                <div class="quality-details">
                    <div class="quality-checks">
                        ${checksHTML}
                    </div>
                    ${issuesHTML}
                    ${suggestionsHTML}
                </div>
                <div class="quality-actions">
                    <button class="btn btn-small btn-secondary" onclick="app.previewArticle(${index})">
                        <span class="btn-icon">👁️</span>
                        プレビュー
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.fixArticle(${index})">
                        <span class="btn-icon">🛠️</span>
                        修正
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.recheckArticle(${index})">
                        <span class="btn-icon">🔄</span>
                        再チェック
                    </button>
                </div>
            `;
            
            results.appendChild(item);
        });
    }
    
    // 品質統計の更新
    updateQualityStats() {
        // 品質チェックデータが存在しない場合の処理
        if (!this.data.qualityChecks || this.data.qualityChecks.length === 0) {
            const updates = {
                'passed-count': 0,
                'warning-count': 0,
                'failed-count': 0,
                'quality-progress-fill': '0%',
                'quality-progress-text': '品質チェック 0/0 完了',
                'avg-quality-score': '0%',
                'seo-optimization': '0%',
                'readability-score': '未実施',
                'improvement-time': '0分',
                'check-status': '未実施'
            };
            
            Object.entries(updates).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (id === 'quality-progress-fill') {
                        element.style.width = value;
                    } else {
                        element.textContent = value;
                    }
                }
            });
            return;
        }
        
        const passedCount = this.data.qualityChecks.filter(c => c.qualityLevel === 'passed').length;
        const warningCount = this.data.qualityChecks.filter(c => c.qualityLevel === 'warning').length;
        const failedCount = this.data.qualityChecks.filter(c => c.qualityLevel === 'failed').length;
        
        const avgScore = this.data.qualityChecks.reduce((sum, c) => sum + c.score, 0) / this.data.qualityChecks.length;
        const seoOptimization = this.data.qualityChecks.reduce((sum, c) => sum + c.seoCheck.score, 0) / this.data.qualityChecks.length;
        const readabilityGood = this.data.qualityChecks.filter(c => c.readability.status === 'passed').length;
        const improvementTime = failedCount * 5 + warningCount * 3; // 修正時間の推定
        
        const updates = {
            'passed-count': passedCount,
            'warning-count': warningCount,
            'failed-count': failedCount,
            'quality-progress-fill': `${(passedCount / this.data.qualityChecks.length) * 100}%`,
            'quality-progress-text': `品質チェック ${this.data.qualityChecks.length}/${this.data.qualityChecks.length} 完了`,
            'avg-quality-score': `${Math.round(avgScore)}%`,
            'seo-optimization': `${Math.round(seoOptimization)}%`,
            'readability-score': readabilityGood >= this.data.qualityChecks.length * 0.8 ? '良好' : '要改善',
            'improvement-time': `${improvementTime}分`,
            'check-status': '完了'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'quality-progress-fill') {
                    element.style.width = value;
                } else {
                    element.textContent = value;
                }
            }
        });
    }
    
    // 品質結果のフィルタリング
    filterQualityResults(filter) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const qualityItems = document.querySelectorAll('.quality-item');
        
        // ボタンの状態更新
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // アイテムの表示/非表示
        qualityItems.forEach(item => {
            if (filter === 'all') {
                item.style.display = 'block';
            } else {
                item.style.display = item.dataset.filter === filter ? 'block' : 'none';
            }
        });
        
        this.showNotification(`${filter === 'all' ? 'すべて' : filter === 'passed' ? '合格' : filter === 'warning' ? '要注意' : '要修正'}の記事を表示中`, 'info', 2000);
    }
    
    // 全記事の再チェック
    async recheckAllArticles() {
        if (!confirm('すべての記事を再チェックしますか？')) return;
        
        this.showLoading('全記事を再チェック中...');
        await this.delay(3000);
        
        // 品質チェック結果を再生成（少し改善された結果）
        this.data.qualityChecks = this.data.qualityChecks.map(check => ({
            ...check,
            score: Math.min(95, check.score + Math.random() * 10),
            qualityLevel: check.score >= 85 ? 'passed' : check.score >= 70 ? 'warning' : 'failed'
        }));
        
        this.saveData();
        this.hideLoading();
        this.renderQualityResults();
        this.updateQualityStats();
        this.showNotification('全記事の再チェックが完了しました', 'success');
    }
    
    // 自動修正
    async autoFixArticles() {
        const failedArticles = this.data.qualityChecks.filter(c => c.qualityLevel === 'failed').length;
        const warningArticles = this.data.qualityChecks.filter(c => c.qualityLevel === 'warning').length;
        
        if (failedArticles === 0 && warningArticles === 0) {
            this.showNotification('修正が必要な記事はありません', 'info');
            return;
        }
        
        if (!confirm(`${failedArticles + warningArticles}記事の自動修正を実行しますか？`)) return;
        
        this.showLoading('記事を自動修正中...');
        await this.delay(4000);
        
        // 品質スコアを改善
        this.data.qualityChecks = this.data.qualityChecks.map(check => {
            if (check.qualityLevel !== 'passed') {
                const improvedScore = Math.min(95, check.score + 15 + Math.random() * 10);
                return {
                    ...check,
                    score: Math.round(improvedScore),
                    qualityLevel: improvedScore >= 85 ? 'passed' : 'warning',
                    issues: improvedScore >= 85 ? [] : check.issues.slice(0, 1),
                    suggestions: improvedScore >= 85 ? ['自動修正により品質が改善されました'] : check.suggestions
                };
            }
            return check;
        });
        
        this.saveData();
        this.hideLoading();
        this.renderQualityResults();
        this.updateQualityStats();
        this.showNotification('自動修正が完了しました', 'success');
    }
    
    // 品質レポートの出力
    exportQualityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            theme: this.data.theme,
            totalArticles: this.data.qualityChecks.length,
            summary: {
                passed: this.data.qualityChecks.filter(c => c.qualityLevel === 'passed').length,
                warning: this.data.qualityChecks.filter(c => c.qualityLevel === 'warning').length,
                failed: this.data.qualityChecks.filter(c => c.qualityLevel === 'failed').length,
                averageScore: Math.round(this.data.qualityChecks.reduce((sum, c) => sum + c.score, 0) / this.data.qualityChecks.length)
            },
            details: this.data.qualityChecks.map((check, index) => ({
                articleTitle: this.data.articles[index].title,
                score: check.score,
                qualityLevel: check.qualityLevel,
                issues: check.issues,
                suggestions: check.suggestions
            }))
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quality-report-${this.data.theme}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('品質レポートをダウンロードしました', 'success');
    }
    
    // 個別記事の修正
    fixArticle(index) {
        this.showNotification('記事修正機能は実装予定です（フェーズ2）', 'info');
    }
    
    // 個別記事の再チェック
    async recheckArticle(index) {
        this.showLoading('記事を再チェック中...');
        await this.delay(1500);
        
        // 該当記事の品質スコアを改善
        const check = this.data.qualityChecks[index];
        const improvedScore = Math.min(95, check.score + 5 + Math.random() * 10);
        
        this.data.qualityChecks[index] = {
            ...check,
            score: Math.round(improvedScore),
            qualityLevel: improvedScore >= 85 ? 'passed' : improvedScore >= 70 ? 'warning' : 'failed'
        };
        
        this.saveData();
        this.hideLoading();
        this.renderQualityResults();
        this.updateQualityStats();
        this.showNotification('記事の再チェックが完了しました', 'success');
    }
    
    // ピラーページ作成（Step 5 → Step 6）
    async createPillarPage() {
        this.showLoading('ピラーページを作成中...');
        
        await this.delay(3000);
        
        // ピラーページコンテンツを生成
        this.data.pillarPage.content = `
            <h1>${this.data.pillarPage.title}</h1>
            
            <p>${this.data.theme}について包括的に解説する完全ガイドです。この記事では、基本的な概念から上級テクニックまで、${this.data.theme}に関するすべての情報をカバーしています。</p>
            
            <h2>目次</h2>
            <ul>
                ${this.data.clusterPages.map((title, index) => 
                    `<li><a href="#section-${index + 1}">${title}</a></li>`
                ).join('')}
            </ul>
            
            ${this.data.clusterPages.map((title, index) => `
                <h2 id="section-${index + 1}">${index + 1}. ${title}</h2>
                <p>${this.data.articles[index].content.substring(0, 200)}...</p>
                <p><a href="./articles/${index + 1}.html">続きを読む →</a></p>
            `).join('')}
            
            <h2>まとめ</h2>
            <p>この${this.data.theme}完全ガイドでは、${this.data.clusterPages.length}の重要なトピックについて詳しく解説しました。各記事を参考に、効果的な${this.data.theme}戦略を構築してください。</p>
        `;
        
        this.saveData();
        this.hideLoading();
        this.goToStep(6);
        this.renderPillarPreview();
    }
    
    // ピラーページプレビューの表示
    renderPillarPreview() {
        const preview = document.getElementById('pillar-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <h3>ピラーページプレビュー</h3>
            <div class="pillar-content">
                ${this.data.pillarPage.content}
            </div>
        `;
    }
    
    // 全記事ダウンロード
    downloadAll() {
        alert('全記事のダウンロード機能は実装予定です（フェーズ2）');
    }
    
    // CMSへ投稿
    publishToCMS() {
        alert('CMS投稿機能は実装予定です（フェーズ2）');
    }
    
    // クラスターページ編集（強化版）
    editClusterPage(index) {
        const currentTitle = this.data.clusterPages[index];
        const newTitle = prompt('クラスターページのタイトルを編集してください:', currentTitle);
        
        if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
            this.data.clusterPages[index] = newTitle.trim();
            this.saveData();
            this.renderStructure();
            this.showNotification('クラスターページを更新しました', 'success');
        }
    }
    
    // クラスターページ削除（強化版）
    deleteClusterPage(index) {
        const title = this.data.clusterPages[index];
        const shortTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
        
        if (confirm(`「${shortTitle}」を削除しますか？`)) {
            this.data.clusterPages.splice(index, 1);
            this.saveData();
            this.renderStructure();
            this.showNotification('クラスターページを削除しました', 'success');
        }
    }
    
    // ステップ移動時にURLも更新
    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;
        
        // ステップ移動の検証
        if (!this.canNavigateToStep(step)) {
            this.showNavigationWarning(step);
            return;
        }
        
        // 現在のステップからの離脱確認
        if (!this.confirmStepExit()) {
            return;
        }
        
        const previousStep = this.currentStep;
        this.currentStep = step;
        
        // ステップ変更のアニメーション
        this.animateStepTransition(previousStep, step);
        
        this.updateUI();
        this.updateURL(); // URL更新を追加
        this.saveData();
        
        // ステップ変更イベントを発火
        this.onStepChanged(previousStep, step);
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }
    
    // ステップ移動可能性の検証
    canNavigateToStep(targetStep) {
        // 前のステップには常に戻れる
        if (targetStep <= this.currentStep) {
            return true;
        }
        
        // 次のステップに進む場合の検証
        switch (this.currentStep) {
            case 1:
                // テーマが入力されている場合のみStep2に進める
                return this.data.theme && this.data.theme.trim().length > 0;
            case 2:
                // 構成案が生成されている場合のみStep3に進める
                return this.data.pillarPage.title && this.data.clusterPages.length > 0;
            case 3:
                // 見出しが生成されている場合のみStep4に進める
                return Object.keys(this.data.headings).length > 0;
            case 4:
                // 記事が生成されている場合のみStep5に進める
                return this.data.articles.length > 0 && 
                       this.data.articles.every(article => article.status === 'completed');
            case 5:
                // 品質チェックが完了している場合のみStep6に進める
                return this.data.qualityChecks.length > 0;
            default:
                return true;
        }
    }
    
    // ナビゲーション警告の表示
    showNavigationWarning(targetStep) {
        let message = '';
        
        switch (this.currentStep) {
            case 1:
                message = 'テーマを入力してから次のステップに進んでください。';
                break;
            case 2:
                message = '構成案を生成してから次のステップに進んでください。';
                break;
            case 3:
                message = '見出し構成を確認してから次のステップに進んでください。';
                break;
            case 4:
                message = '記事の生成を完了してから次のステップに進んでください。';
                break;
            case 5:
                message = '品質チェックを完了してから次のステップに進んでください。';
                break;
        }
        
        this.showNotification(message, 'warning');
    }
    
    // ステップ離脱確認
    confirmStepExit() {
        // 現在のステップで未保存の変更がある場合の確認
        if (this.hasUnsavedChanges()) {
            return confirm('未保存の変更があります。このステップを離れますか？');
        }
        return true;
    }
    
    // 未保存変更の検出
    hasUnsavedChanges() {
        // 実装では、各ステップでの変更状態を追跡
        // 現在はシンプルにfalseを返す
        return false;
    }
    
    // ステップ遷移アニメーション
    animateStepTransition(fromStep, toStep) {
        const fromContent = document.getElementById(`step-${fromStep}`);
        const toContent = document.getElementById(`step-${toStep}`);
        
        if (fromContent && toContent) {
            // フェードアウト → フェードイン効果
            fromContent.style.opacity = '0';
            
            setTimeout(() => {
                fromContent.classList.remove('active');
                toContent.classList.add('active');
                toContent.style.opacity = '0';
                
                // フェードイン
                setTimeout(() => {
                    toContent.style.opacity = '1';
                }, 50);
            }, 150);
        }
    }
    
    // ステップ変更イベント
    onStepChanged(fromStep, toStep) {
        // ステップ変更時の追加処理
        console.log(`Step changed: ${fromStep} → ${toStep}`);
        
        // 特定のステップに入った時の処理
        switch (toStep) {
            case 1:
                this.focusThemeInput();
                break;
            case 4:
                this.prepareArticleGeneration();
                break;
            case 6:
                this.prepareFinalReview();
                break;
        }
    }
    
    // テーマ入力にフォーカス
    focusThemeInput() {
        setTimeout(() => {
            const themeInput = document.getElementById('theme-input');
            if (themeInput) {
                themeInput.focus();
            }
        }, 200);
    }
    
    // 記事生成の準備
    prepareArticleGeneration() {
        // 記事生成画面の初期化
        if (this.data.articles.length === 0) {
            this.renderArticlesGrid();
        }
    }
    
    // 最終レビューの準備
    prepareFinalReview() {
        // Step6の最終レビュー画面の準備
        if (this.data.pillarPage.content) {
            this.renderPillarPreview();
        }
        
        // 最終統計の更新
        this.updateFinalStats();
    }
    
    // 最終統計の更新
    updateFinalStats() {
        const totalArticles = this.data.articles.length;
        const totalWords = this.data.articles.reduce((sum, article) => sum + (article?.wordCount || 0), 0);
        const avgQualityScore = this.data.qualityChecks.length > 0 ? 
            Math.round(this.data.qualityChecks.reduce((sum, c) => sum + c.score, 0) / this.data.qualityChecks.length) : 0;
        
        // 最終統計をページに反映（Step6で使用）
        const elements = {
            'final-total-articles': totalArticles,
            'final-total-words': totalWords.toLocaleString(),
            'final-avg-quality': `${avgQualityScore}点`,
            'final-pillar-words': this.data.pillarPage.content ? this.data.pillarPage.content.length : 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // データ読み込み
    loadData() {
        try {
            const saved = localStorage.getItem('hubpilot-data');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.currentStep = parsed.currentStep || 1;
                this.data = { ...this.data, ...parsed.data };
            }
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
        }
    }
    
    // UI更新
    updateUI() {
        // ステップコンテンツの表示/非表示
        document.querySelectorAll('.step-content').forEach((content, index) => {
            content.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        // サイドバーのステップ表示更新
        this.updateStepIndicators();
        
        // ナビゲーションボタンの表示制御
        this.updateNavigationButtons();
        
        // データの復元
        this.restoreStepData();
        
        // プログレス表示の更新
        this.updateProgressDisplay();
    }
    
    // ステップインジケーターの更新
    updateStepIndicators() {
        document.querySelectorAll('.step-item').forEach((item, index) => {
            const stepNumber = index + 1;
            const stepNumberElement = item.querySelector('.step-number');
            
            // 現在のステップ
            item.classList.toggle('active', stepNumber === this.currentStep);
            
            // 完了したステップ
            const isCompleted = this.isStepCompleted(stepNumber);
            item.classList.toggle('completed', isCompleted);
            
            // アクセス可能なステップ
            const isAccessible = this.canNavigateToStep(stepNumber);
            item.classList.toggle('accessible', isAccessible);
            item.style.cursor = isAccessible ? 'pointer' : 'not-allowed';
            
            // ステップ番号の表示（完了したステップにはチェックマーク）
            if (isCompleted && stepNumber < this.currentStep) {
                stepNumberElement.innerHTML = '✓';
            } else {
                stepNumberElement.textContent = stepNumber;
            }
        });
    }
    
    // ステップ完了状態の判定
    isStepCompleted(stepNumber) {
        switch (stepNumber) {
            case 1:
                return this.data.theme && this.data.theme.trim().length > 0;
            case 2:
                return this.data.pillarPage.title && this.data.clusterPages.length > 0;
            case 3:
                return Object.keys(this.data.headings).length > 0;
            case 4:
                return this.data.articles.length > 0 && 
                       this.data.articles.every(article => article.status === 'completed');
            case 5:
                return this.data.qualityChecks.length > 0;
            case 6:
                return this.data.pillarPage.content && this.data.pillarPage.content.length > 0;
            default:
                return false;
        }
    }
    
    // ナビゲーションボタンの更新
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
            prevBtn.disabled = this.currentStep <= 1;
        }
        
        if (nextBtn) {
            const canProceed = this.canNavigateToStep(this.currentStep + 1);
            nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
            nextBtn.disabled = !canProceed;
            
            // ボタンテキストの更新
            if (this.currentStep === this.totalSteps) {
                nextBtn.textContent = '完了';
            } else {
                nextBtn.textContent = '次へ';
            }
        }
    }
    
    // プログレス表示の更新
    updateProgressDisplay() {
        const completedSteps = Array.from({length: this.totalSteps}, (_, i) => i + 1)
            .filter(step => this.isStepCompleted(step)).length;
        
        const progressPercentage = (completedSteps / this.totalSteps) * 100;
        
        // 全体プログレスバーがある場合の更新
        const overallProgress = document.querySelector('.overall-progress');
        if (overallProgress) {
            overallProgress.style.width = `${progressPercentage}%`;
        }
        
        // ページタイトルの更新
        document.title = `HubPilot Free - Step ${this.currentStep}/${this.totalSteps}`;
    }
    
    // ステップデータの復元
    restoreStepData() {
        switch (this.currentStep) {
            case 1:
                const themeInput = document.getElementById('theme-input');
                const charCount = document.getElementById('char-count');
                if (themeInput && this.data.theme) {
                    themeInput.value = this.data.theme;
                    if (charCount) {
                        charCount.textContent = this.data.theme.length;
                    }
                    this.handleThemeInput();
                }
                break;
            case 2:
                if (this.data.pillarPage.title) {
                    this.renderStructure();
                }
                break;
            case 3:
                if (Object.keys(this.data.headings).length > 0) {
                    this.renderHeadings();
                }
                break;
            case 4:
                if (this.data.articles.length > 0) {
                    this.renderArticlesGrid();
                    // 完了した記事の状態を復元
                    this.data.articles.forEach((article, index) => {
                        if (article.status === 'completed') {
                            const card = document.getElementById(`article-card-${index}`);
                            const status = document.getElementById(`status-${index}`);
                            const preview = document.getElementById(`preview-${index}`);
                            
                            if (card && status && preview) {
                                card.classList.add('completed');
                                status.className = 'article-status status-completed';
                                status.textContent = '完了';
                                preview.textContent = article.content.substring(0, 100) + '...';
                            }
                        }
                    });
                    
                    // プログレスバーを更新
                    const completedCount = this.data.articles.filter(a => a.status === 'completed').length;
                    const progress = (completedCount / this.data.clusterPages.length) * 100;
                    const progressFill = document.getElementById('progress-fill');
                    const progressText = document.getElementById('progress-text');
                    
                    if (progressFill) progressFill.style.width = `${progress}%`;
                    if (progressText) {
                        progressText.textContent = completedCount === this.data.clusterPages.length ? 
                            '全記事の生成が完了しました！' : 
                            `記事 ${completedCount}/10 完了`;
                    }
                    
                    // 完了ボタンの表示
                    if (completedCount === this.data.clusterPages.length) {
                        const proceedBtn = document.getElementById('proceed-to-quality-btn');
                        if (proceedBtn) proceedBtn.style.display = 'block';
                    }
                }
                break;
            case 5:
                if (this.data.qualityChecks.length > 0) {
                    this.renderQualityResults();
                    this.updateQualityStats();
                } else {
                    // 品質チェックデータがない場合は自動生成
                    if (this.data.articles.length > 0) {
                        setTimeout(() => {
                            this.proceedToQuality();
                        }, 500);
                    }
                }
                break;
            case 6:
                if (this.data.pillarPage.content) {
                    this.renderPillarPreview();
                }
                break;
        }
    }
    
    // ローディング表示
    showLoading(text = '処理中...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.querySelector('.loading-text');
        
        if (overlay) overlay.classList.add('active');
        if (loadingText) loadingText.textContent = text;
    }
    
    // ローディング非表示
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('active');
    }
    
    // 遅延ユーティリティ
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // データ保存
    saveData() {
        try {
            const dataToSave = {
                currentStep: this.currentStep,
                data: this.data
            };
            localStorage.setItem('hubpilot-data', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
        }
    }
    
    // 通知システム
    showNotification(message, type = 'info', duration = 5000) {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // 通知をページに追加
        document.body.appendChild(notification);
        
        // アニメーション
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }
    
    // キーボードショートカット
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 矢印キーでステップ移動
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousStep();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextStep();
                        break;
                }
            }
            
            // Escapeキーでローディングをキャンセル（将来の機能）
            if (e.key === 'Escape') {
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay && loadingOverlay.classList.contains('active')) {
                    // 将来的にキャンセル機能を実装
                    console.log('Loading cancellation requested');
                }
            }
        });
    }
    
    // ブラウザの戻る/進むボタン対応
    setupBrowserNavigation() {
        // ページ読み込み時に現在のステップをURLに反映
        this.updateURL();
        
        // ブラウザの戻る/進むボタンに対応
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.step) {
                this.currentStep = e.state.step;
                this.updateUI();
            }
        });
    }
    
    // URLの更新
    updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('step', this.currentStep);
        window.history.replaceState({ step: this.currentStep }, '', url);
    }
    
    // URLからステップを読み取り
    loadStepFromURL() {
        const url = new URL(window.location);
        const stepParam = url.searchParams.get('step');
        if (stepParam) {
            const step = parseInt(stepParam);
            if (step >= 1 && step <= this.totalSteps) {
                this.currentStep = step;
            }
        }
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HubPilotApp();
});