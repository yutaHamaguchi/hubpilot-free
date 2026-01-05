// ===========================================
// HubPilot Free - 画像生成機能
// ===========================================

class ImageGenerationManager {
  constructor(app) {
    if (!app) {
      console.warn('ImageGenerationManager: appインスタンスが提供されていません');
      return;
    }

    this.app = app;
    this.generatedImages = new Map(); // articleId -> images[]
    this.isGenerating = false;
    this.currentCost = 0;

    this.init();
  }

  init() {
    // イベントリスナーの設定
    this.setupEventListeners();
    this.setupRealtimeListeners();
  }

  setupEventListeners() {
    // 画像生成ボタン
    const generateBtn = document.getElementById('generate-images-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.startImageGeneration());
    }

    // スキップボタン
    const skipBtn = document.getElementById('skip-images-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipImageGeneration());
    }

    // プレビュー切替
    const toggleBtn = document.getElementById('toggle-images-preview');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleImagesPreview());
    }

    // オプション変更時にコスト再計算
    const options = [
      'generate-hero',
      'generate-illustrations',
      'illustration-count',
      'image-provider'
    ];

    options.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.updateCostEstimate());
      }
    });

    // 初期コスト計算
    this.updateCostEstimate();
  }

  setupRealtimeListeners() {
    // 画像生成進捗イベント
    window.addEventListener('image-generation-progress', (event) => {
      this.handleProgressUpdate(event.detail);
    });

    // 画像生成完了イベント
    window.addEventListener('image-generation-complete', (event) => {
      this.handleGenerationComplete(event.detail);
    });
  }

  /**
   * コスト見積もり更新
   */
  updateCostEstimate() {
    const generateHero = document.getElementById('generate-hero')?.checked || false;
    const generateIllustrations = document.getElementById('generate-illustrations')?.checked || false;
    const illustrationCount = parseInt(document.getElementById('illustration-count')?.value || 3);
    const provider = document.getElementById('image-provider')?.value || 'auto';

    const articleCount = this.app?.data?.clusterPages?.length || 10;

    let costPerArticle = 0;

    // プロバイダーに基づくコスト計算
    if (provider === 'dalle3') {
      if (generateHero) costPerArticle += 0.080; // HD hero
      if (generateIllustrations) costPerArticle += 0.040 * illustrationCount; // Standard illustrations
    } else if (provider === 'stability') {
      if (generateHero) costPerArticle += 0.010;
      if (generateIllustrations) costPerArticle += 0.010 * illustrationCount;
    } else {
      // auto: 平均を取る
      if (generateHero) costPerArticle += 0.045;
      if (generateIllustrations) costPerArticle += 0.025 * illustrationCount;
    }

    const totalCost = costPerArticle * articleCount;
    const totalImages = articleCount * ((generateHero ? 1 : 0) + (generateIllustrations ? illustrationCount : 0));

    // UI更新
    const costEstimate = document.getElementById('image-cost-estimate');
    const articleCountEl = document.getElementById('image-article-count');
    const totalCountEl = document.getElementById('image-total-count');

    if (costEstimate) costEstimate.textContent = `$${totalCost.toFixed(2)}`;
    if (articleCountEl) articleCountEl.textContent = articleCount;
    if (totalCountEl) totalCountEl.textContent = totalImages;
  }

  /**
   * 画像生成開始
   */
  async startImageGeneration() {
    if (this.isGenerating) {
      this.app.showNotification('画像生成中です', 'info');
      return;
    }

    // 記事が生成されているか確認
    if (!this.app.data.articles || this.app.data.articles.length === 0) {
      this.app.showNotification('先に記事を生成してください', 'warning');
      return;
    }

    const generateHero = document.getElementById('generate-hero')?.checked || false;
    const generateIllustrations = document.getElementById('generate-illustrations')?.checked || false;
    const illustrationCount = parseInt(document.getElementById('illustration-count')?.value || 3);
    const provider = document.getElementById('image-provider')?.value || 'auto';

    if (!generateHero && !generateIllustrations) {
      this.app.showNotification('少なくとも1つのオプションを選択してください', 'warning');
      return;
    }

    // 確認ダイアログ
    const costEstimate = document.getElementById('image-cost-estimate')?.textContent || '$0.00';
    const confirmed = confirm(
      '画像生成を開始しますか？\n\n' +
      `推定コスト: ${costEstimate}\n` +
      `記事数: ${this.app.data.articles.length}記事\n\n` +
      '※ この操作には料金が発生します'
    );

    if (!confirmed) return;

    this.isGenerating = true;
    this.currentCost = 0;

    // UI更新
    this.showProgressUI();
    this.updateStatus('generating');

    try {
      const articles = this.app.data.articles.map((article, index) => ({
        id: `article-${Date.now()}-${index}`, // モックID
        title: article.title,
        content: article.content
      }));

      const options = {
        generateHero,
        generateIllustrations,
        illustrationCount,
        provider
      };


      const result = await window.supabaseIntegration.generateImagesForProject(articles, options);


      // 生成された画像を記事に挿入
      this.insertImagesToArticles(result.results);

      // UI更新
      this.displayGeneratedImages(result.results);
      this.updateStatus('completed');

      this.app.showNotification(
        `画像生成が完了しました！コスト: $${result.totalCost.toFixed(2)}`,
        'success'
      );

    } catch (error) {
      console.error('画像生成エラー:', error);
      this.app.showNotification(`画像生成エラー: ${error.message}`, 'error');
      this.updateStatus('error');
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * 生成された画像を記事に挿入
   */
  insertImagesToArticles(results) {
    results.forEach((result, index) => {
      if (result.success && result.images && result.images.length > 0) {
        const article = this.app.data.articles[index];
        if (article) {
          // 画像をMarkdownに挿入
          const updatedContent = window.supabaseIntegration.insertImagesToArticle(
            article.content,
            result.images
          );

          article.content = updatedContent;
          this.generatedImages.set(result.articleId, result.images);
        }
      }
    });

    // データ保存
    this.app.saveData();
  }

  /**
   * 進捗UI表示
   */
  showProgressUI() {
    const progressSection = document.getElementById('image-generation-progress');
    const actionsSection = document.getElementById('generate-images-btn');

    if (progressSection) progressSection.style.display = 'block';
    if (actionsSection) actionsSection.disabled = true;
  }

  /**
   * 進捗更新ハンドラ
   */
  handleProgressUpdate(detail) {
    const { current, total, percentage, currentArticle, totalCost } = detail;

    const progressFill = document.getElementById('image-progress-fill');
    const progressText = document.getElementById('image-progress-text');
    const currentArticleEl = document.getElementById('image-current-article');
    const costEl = document.getElementById('image-current-cost');

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `画像生成中... (${current}/${total})`;
    }

    if (currentArticleEl && currentArticle) {
      currentArticleEl.textContent = `現在: ${currentArticle}`;
    }

    if (costEl && totalCost !== undefined) {
      costEl.textContent = `$${totalCost.toFixed(2)}`;
      this.currentCost = totalCost;
    }
  }

  /**
   * 生成完了ハンドラ
   */
  handleGenerationComplete(_detail) {

    const progressStatus = document.getElementById('image-progress-status');
    if (progressStatus) {
      progressStatus.textContent = '完了';
    }
  }

  /**
   * 生成された画像を表示
   */
  displayGeneratedImages(results) {
    const previewSection = document.getElementById('generated-images-preview');
    const imagesGrid = document.getElementById('images-grid');

    if (!previewSection || !imagesGrid) return;

    previewSection.style.display = 'block';
    imagesGrid.innerHTML = '';

    results.forEach((result, articleIndex) => {
      if (!result.success || !result.images) return;

      result.images.forEach(image => {
        const card = this.createImageCard(image, result.title, articleIndex);
        imagesGrid.appendChild(card);
      });
    });
  }

  /**
   * 画像カード作成
   */
  createImageCard(image, articleTitle, articleIndex) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.innerHTML = `
      <div class="image-card-header">
        <h5>${articleTitle}</h5>
        <span class="image-type-badge ${image.type}">${
  image.type === 'hero' ? 'ヒーロー画像' : '説明画像 ' + (image.position || '')
}</span>
      </div>
      <img src="${image.url}" alt="${image.altText}" loading="lazy">
      <div class="image-card-actions">
        <button class="regenerate-btn" data-article="${articleIndex}" data-type="${image.type}">
          🔄 再生成
        </button>
        <button class="download-btn primary" data-url="${image.url}">
          💾 保存
        </button>
      </div>
    `;

    // イベントリスナー
    const regenerateBtn = card.querySelector('.regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        this.app.showNotification('画像の再生成機能は実装予定です', 'info');
      });
    }

    const downloadBtn = card.querySelector('.download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadImage(image.url, image.altText);
      });
    }

    return card;
  }

  /**
   * 画像ダウンロード
   */
  async downloadImage(url, filename) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename.replace(/[^a-z0-9]/gi, '_')}.png`;
      link.click();

      URL.revokeObjectURL(blobUrl);

      this.app.showNotification('画像をダウンロードしました', 'success');
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      this.app.showNotification('ダウンロードに失敗しました', 'error');
    }
  }

  /**
   * プレビュー切替
   */
  toggleImagesPreview() {
    const grid = document.getElementById('images-grid');
    if (!grid) return;

    if (grid.style.maxHeight === 'none') {
      grid.style.maxHeight = '400px';
      grid.style.overflow = 'hidden';
    } else {
      grid.style.maxHeight = 'none';
      grid.style.overflow = 'visible';
    }
  }

  /**
   * ステータス更新
   */
  updateStatus(status) {
    const statusBadge = document.getElementById('image-gen-status');
    if (!statusBadge) return;

    statusBadge.className = 'status-badge ' + status;

    switch (status) {
    case 'generating':
      statusBadge.textContent = '生成中';
      break;
    case 'completed':
      statusBadge.textContent = '完了';
      break;
    case 'error':
      statusBadge.textContent = 'エラー';
      break;
    default:
      statusBadge.textContent = '未生成';
    }
  }

  /**
   * 画像生成をスキップ
   */
  skipImageGeneration() {
    this.app.showNotification('画像生成をスキップしました', 'info');
    this.updateStatus('skipped');
  }
}

// グローバルに公開
window.ImageGenerationManager = ImageGenerationManager;

// 手動初期化用（index.htmlから呼び出される）
// 自動初期化は削除して、index.htmlから制御する
