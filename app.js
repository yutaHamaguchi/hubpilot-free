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
        this.loadData();
        this.bindEvents();
        this.updateUI();
    }
    
    // イベントリスナーの設定
    bindEvents() {
        // Step 1: テーマ入力
        const themeInput = document.getElementById('theme-input');
        const generateBtn = document.getElementById('generate-structure-btn');
        
        if (themeInput) {
            themeInput.addEventListener('input', () => this.validateThemeInput());
            themeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.generateStructure();
                }
            });
        }
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateStructure());
        }
        
        // Step 2: 構成案確認
        const proceedToHeadingsBtn = document.getElementById('proceed-to-headings-btn');
        if (proceedToHeadingsBtn) {
            proceedToHeadingsBtn.addEventListener('click', () => this.proceedToHeadings());
        }
        
        // Step 3: 見出し構成
        const startWritingBtn = document.getElementById('start-writing-btn');
        if (startWritingBtn) {
            startWritingBtn.addEventListener('click', () => this.startWriting());
        }
        
        // Step 4: 記事執筆
        const proceedToQualityBtn = document.getElementById('proceed-to-quality-btn');
        if (proceedToQualityBtn) {
            proceedToQualityBtn.addEventListener('click', () => this.proceedToQuality());
        }
        
        // Step 5: 品質チェック
        const createPillarBtn = document.getElementById('create-pillar-btn');
        if (createPillarBtn) {
            createPillarBtn.addEventListener('click', () => this.createPillarPage());
        }
        
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
                if (step <= this.currentStep) {
                    this.goToStep(step);
                }
            });
        });
    }
    
    // テーマ入力のバリデーション
    validateThemeInput() {
        const input = document.getElementById('theme-input');
        const error = document.getElementById('theme-error');
        const btn = document.getElementById('generate-structure-btn');
        
        if (!input || !error || !btn) return;
        
        const value = input.value.trim();
        
        if (value.length === 0) {
            error.textContent = 'テーマを入力してください';
            btn.disabled = true;
            return false;
        } else if (value.length < 2) {
            error.textContent = 'テーマは2文字以上で入力してください';
            btn.disabled = true;
            return false;
        } else {
            error.textContent = '';
            btn.disabled = false;
            return true;
        }
    }
    
    // 構成案生成（Step 1 → Step 2）
    async generateStructure() {
        if (!this.validateThemeInput()) return;
        
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
        this.goToStep(2);
        this.renderStructure();
    }
    
    // 構成案の表示
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
                item.innerHTML = `
                    <div class="cluster-page-title">${index + 1}. ${title}</div>
                    <div class="cluster-page-actions">
                        <button class="btn btn-small btn-secondary" onclick="app.editClusterPage(${index})">編集</button>
                        <button class="btn btn-small btn-secondary" onclick="app.deleteClusterPage(${index})">削除</button>
                    </div>
                `;
                clusterList.appendChild(item);
            });
        }
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
    
    // 見出し構成の表示
    renderHeadings() {
        const accordion = document.getElementById('headings-accordion');
        if (!accordion) return;
        
        accordion.innerHTML = '';
        
        this.data.clusterPages.forEach((title, index) => {
            const item = document.createElement('div');
            item.className = 'accordion-item';
            
            const headings = this.data.headings[index] || [];
            const headingsHTML = headings.map(heading => 
                `<div class="heading-item">H2: ${heading}</div>`
            ).join('');
            
            item.innerHTML = `
                <div class="accordion-header" onclick="app.toggleAccordion(${index})">
                    <h4>${index + 1}. ${title}</h4>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content" id="accordion-content-${index}">
                    <div class="headings-list">
                        ${headingsHTML}
                    </div>
                </div>
            `;
            
            accordion.appendChild(item);
        });
    }
    
    // アコーディオンの開閉
    toggleAccordion(index) {
        const content = document.getElementById(`accordion-content-${index}`);
        const header = content.previousElementSibling;
        const icon = header.querySelector('.accordion-icon');
        
        if (content.classList.contains('active')) {
            content.classList.remove('active');
            header.classList.remove('active');
            icon.textContent = '▼';
        } else {
            // 他のアコーディオンを閉じる
            document.querySelectorAll('.accordion-content.active').forEach(item => {
                item.classList.remove('active');
                item.previousElementSibling.classList.remove('active');
                item.previousElementSibling.querySelector('.accordion-icon').textContent = '▼';
            });
            
            content.classList.add('active');
            header.classList.add('active');
            icon.textContent = '▲';
        }
    }
    
    // 記事執筆開始（Step 3 → Step 4）
    async startWriting() {
        this.goToStep(4);
        this.renderArticlesGrid();
        
        // 記事を順次生成
        for (let i = 0; i < this.data.clusterPages.length; i++) {
            await this.generateArticle(i);
        }
        
        // 完了ボタンを表示
        const proceedBtn = document.getElementById('proceed-to-quality-btn');
        if (proceedBtn) {
            proceedBtn.style.display = 'block';
        }
    }
    
    // 記事グリッドの表示
    renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.data.clusterPages.forEach((title, index) => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.id = `article-card-${index}`;
            
            card.innerHTML = `
                <div class="article-header">
                    <div class="article-title">${index + 1}. ${title}</div>
                    <div class="article-status status-pending" id="status-${index}">待機中</div>
                </div>
                <div class="article-preview" id="preview-${index}">
                    記事生成待機中...
                </div>
            `;
            
            grid.appendChild(card);
        });
    }
    
    // 個別記事の生成
    async generateArticle(index) {
        const card = document.getElementById(`article-card-${index}`);
        const status = document.getElementById(`status-${index}`);
        const preview = document.getElementById(`preview-${index}`);
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        // 進行中状態に更新
        card.classList.add('in-progress');
        status.className = 'article-status status-in-progress';
        status.textContent = '生成中';
        preview.textContent = '記事を生成しています...';
        
        // プログレスバー更新
        progressText.textContent = `記事 ${index + 1}/10 を作成中...`;
        
        // 2-4秒の生成時間をシミュレート
        await this.delay(2000 + Math.random() * 2000);
        
        // 完了状態に更新
        card.classList.remove('in-progress');
        card.classList.add('completed');
        status.className = 'article-status status-completed';
        status.textContent = '完了';
        
        // モック記事内容
        const mockContent = `${this.data.clusterPages[index]}について詳しく解説します。この記事では、基本的な概念から実践的な手法まで、幅広くカバーしています。約2000文字の充実した内容で、読者の理解を深めることができます...`;
        
        preview.textContent = mockContent.substring(0, 100) + '...';
        
        // 記事データを保存
        this.data.articles[index] = {
            title: this.data.clusterPages[index],
            content: mockContent,
            wordCount: 2000 + Math.floor(Math.random() * 400) - 200, // 1800-2200文字
            status: 'completed'
        };
        
        // プログレスバー更新
        const progress = ((index + 1) / this.data.clusterPages.length) * 100;
        progressFill.style.width = `${progress}%`;
        
        if (index === this.data.clusterPages.length - 1) {
            progressText.textContent = '全記事の生成が完了しました！';
        }
        
        this.saveData();
    }
    
    // 品質チェックへ進む（Step 4 → Step 5）
    async proceedToQuality() {
        this.showLoading('品質チェック中...');
        
        await this.delay(2000);
        
        // 品質チェック結果を生成
        this.data.qualityChecks = this.data.articles.map((article, index) => ({
            articleIndex: index,
            wordCount: { status: 'OK', value: article.wordCount },
            factCheck: { 
                status: Math.random() > 0.7 ? '要修正' : 'OK',
                issues: Math.random() > 0.7 ? ['統計データの確認が必要', '引用元の追加を推奨'] : []
            }
        }));
        
        this.saveData();
        this.hideLoading();
        this.goToStep(5);
        this.renderQualityResults();
    }
    
    // 品質チェック結果の表示
    renderQualityResults() {
        const results = document.getElementById('quality-results');
        if (!results) return;
        
        results.innerHTML = '';
        
        this.data.qualityChecks.forEach((check, index) => {
            const hasIssues = check.factCheck.status === '要修正';
            const item = document.createElement('div');
            item.className = `quality-item ${hasIssues ? 'warning' : 'ok'}`;
            
            const issuesHTML = hasIssues ? 
                `<div class="quality-issues">
                    <strong>修正提案:</strong>
                    <ul>
                        ${check.factCheck.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>` : '';
            
            item.innerHTML = `
                <div class="quality-header">
                    <h4>${index + 1}. ${this.data.articles[index].title}</h4>
                    <div class="quality-badge ${hasIssues ? 'badge-warning' : 'badge-ok'}">
                        ${hasIssues ? '要修正' : 'OK'}
                    </div>
                </div>
                <div class="quality-details">
                    <p><strong>文字数:</strong> ${check.wordCount.value}文字 (${check.wordCount.status})</p>
                    <p><strong>ファクトチェック:</strong> ${check.factCheck.status}</p>
                    ${issuesHTML}
                </div>
            `;
            
            results.appendChild(item);
        });
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
    
    // クラスターページ編集
    editClusterPage(index) {
        const newTitle = prompt('新しいタイトルを入力してください:', this.data.clusterPages[index]);
        if (newTitle && newTitle.trim()) {
            this.data.clusterPages[index] = newTitle.trim();
            this.saveData();
            this.renderStructure();
        }
    }
    
    // クラスターページ削除
    deleteClusterPage(index) {
        if (confirm('このクラスターページを削除しますか？')) {
            this.data.clusterPages.splice(index, 1);
            this.saveData();
            this.renderStructure();
        }
    }
    
    // ステップ移動
    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;
        
        this.currentStep = step;
        this.updateUI();
        this.saveData();
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
    
    // UI更新
    updateUI() {
        // ステップコンテンツの表示/非表示
        document.querySelectorAll('.step-content').forEach((content, index) => {
            content.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        // サイドバーのステップ表示更新
        document.querySelectorAll('.step-item').forEach((item, index) => {
            const stepNumber = index + 1;
            item.classList.toggle('active', stepNumber === this.currentStep);
            item.classList.toggle('completed', stepNumber < this.currentStep);
        });
        
        // ナビゲーションボタンの表示制御
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.style.display = 'none'; // 各ステップ専用ボタンを使用
        }
        
        // データの復元
        this.restoreStepData();
    }
    
    // ステップデータの復元
    restoreStepData() {
        switch (this.currentStep) {
            case 1:
                const themeInput = document.getElementById('theme-input');
                if (themeInput && this.data.theme) {
                    themeInput.value = this.data.theme;
                    this.validateThemeInput();
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
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HubPilotApp();
});