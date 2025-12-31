// ===========================================
// HubPilot Free - Supabase Integration Layer
// ===========================================

/**
 * Supabase統合クラス
 * フロントエンドとSupabaseバックエンドの通信を管理
 */
class SupabaseIntegration {
  constructor() {
    this.supabase = null;
    this.currentProjectId = null;
    this.realtimeChannel = null;
    this.isInitialized = false;
  }

  /**
   * Supabaseクライアントを初期化
   */
  async initialize() {
    try {
      // Supabase設定の検証
      if (!window.SUPABASE_CONFIG ||
          !window.SUPABASE_CONFIG.url ||
          !window.SUPABASE_CONFIG.anonKey) {
        console.warn('⚠️ Supabase設定が不完全です。モックモードで動作します。');
        return false;
      }

      // 設定値がデフォルトのままかチェック
      if (window.SUPABASE_CONFIG.url.includes('your-project-ref') ||
          window.SUPABASE_CONFIG.anonKey.includes('your-anon-key')) {
        console.warn('⚠️ Supabase設定がデフォルトのままです。モックモードで動作します。');
        return false;
      }

      // Supabase SDKが読み込まれているかチェック
      if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase SDKが読み込まれていません');
        return false;
      }

      // Supabaseクライアント作成
      this.supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );

      // 接続テスト
      const { error } = await this.supabase.from('projects').select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') { // PGRST116 = テーブルが空（正常）
        console.error('❌ Supabase接続エラー:', error);
        return false;
      }

      this.isInitialized = true;

      // リアルタイム更新の設定
      this.setupRealtimeSubscription();

      return true;

    } catch (error) {
      console.error('❌ Supabase初期化エラー:', error);
      return false;
    }
  }

  /**
   * 接続テスト
   */
  async testConnection() {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) {
        return { success: false, message: 'Supabaseに接続できません（モックモード）' };
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, message: 'Supabase接続OK' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Supabase統合が設定済みかチェック
   * ContentGeneratorから呼び出される
   */
  async isConfigured() {
    return this.isInitialized;
  }

  /**
   * プロジェクト作成
   */
  async createProject(projectData) {
    if (!this.isInitialized) {
      return this.mockCreateProject(projectData);
    }

    try {
      // 認証済みユーザーのIDを取得（認証機能追加）
      const { data: { user } } = await this.supabase.auth.getUser();
      const userId = user?.id || null;

      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          user_id: userId, // 認証済みならuser_id設定、ゲストならnull
          theme: projectData.theme,
          pillar_page: projectData.pillarPage,
          cluster_pages: projectData.clusterPages,
          headings: projectData.headings,
          settings: projectData.settings || {}
        })
        .select()
        .single();

      if (error) throw error;

      this.currentProjectId = data.id;

      // 生成ログ初期化
      await this.supabase
        .from('generation_logs')
        .insert({
          project_id: data.id,
          user_id: userId, // 認証機能追加
          status: 'started',
          total_articles: projectData.clusterPages?.length || 0,
          current_article: 0
        });

      return { success: true, projectId: data.id, data };

    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
      throw error;
    }
  }

  /**
   * 記事生成（Edge Function呼び出し）
   */
  async generateArticles(projectData) {
    if (!this.isInitialized) {
      return this.mockGenerateArticles(projectData);
    }

    try {
      // プロジェクト作成
      const projectResult = await this.createProject(projectData);

      if (!projectResult.success) {
        throw new Error('プロジェクト作成に失敗しました');
      }

      // Edge Function呼び出し
      const { data, error } = await this.supabase.functions.invoke('generate-article', {
        body: {
          theme: projectData.theme,
          headings: projectData.clusterPages,
          settings: {
            ...projectData.settings,
            projectId: projectResult.projectId,
            targetLength: projectData.settings?.targetLength || 2000,
            targetAudience: projectData.settings?.targetAudience || '一般ユーザー',
            tone: projectData.settings?.tone || 'です・ます調'
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        projectId: projectResult.projectId,
        articles: data.articles
      };

    } catch (error) {
      console.error('記事生成エラー:', error);

      // エラーログを記録
      if (this.currentProjectId) {
        await this.supabase
          .from('generation_logs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('project_id', this.currentProjectId);
      }

      throw error;
    }
  }

  /**
   * 構造生成（ピラーページ＋クラスターページのタイトル生成）
   * ContentGeneratorから呼び出される
   */
  async generateStructure(theme) {
    if (!this.isInitialized) {
      return this.mockGenerateStructure(theme);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('generate-structure', {
        body: { theme }
      });

      if (error) throw error;

      return {
        pillarPage: data.pillarPage,
        clusterPages: data.clusterPages
      };

    } catch (error) {
      console.error('構造生成エラー:', error);
      return this.mockGenerateStructure(theme);
    }
  }

  /**
   * 見出し生成
   * ContentGeneratorから呼び出される
   */
  async generateHeadings(pageTitle) {
    if (!this.isInitialized) {
      return this.mockGenerateHeadings(pageTitle);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('generate-headings', {
        body: { pageTitle }
      });

      if (error) throw error;

      return { headings: data.headings };

    } catch (error) {
      console.error('見出し生成エラー:', error);
      return this.mockGenerateHeadings(pageTitle);
    }
  }

  /**
   * 単一記事生成
   * ContentGeneratorから呼び出される
   */
  async generateArticle({ title, headings, targetWordCount }) {
    if (!this.isInitialized) {
      return this.mockGenerateArticle(title, headings, targetWordCount);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('generate-article', {
        body: {
          title,
          headings,
          targetWordCount: targetWordCount || 2000
        }
      });

      if (error) throw error;

      return {
        content: data.content,
        wordCount: data.wordCount || data.content.length
      };

    } catch (error) {
      console.error('記事生成エラー:', error);
      return this.mockGenerateArticle(title, headings, targetWordCount);
    }
  }

  /**
   * ピラーページ生成
   * ContentGeneratorから呼び出される
   */
  async generatePillarPage(clusterPages) {
    if (!this.isInitialized) {
      return this.mockGeneratePillarPage(clusterPages);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('generate-pillar-page', {
        body: { clusterPages }
      });

      if (error) throw error;

      return {
        content: data.content,
        internalLinks: data.internalLinks,
        wordCount: data.wordCount || data.content.length
      };

    } catch (error) {
      console.error('ピラーページ生成エラー:', error);
      return this.mockGeneratePillarPage(clusterPages);
    }
  }

  /**
   * SEO分析実行
   */
  async analyzeSEO(articleId, content, targetKeywords = []) {
    if (!this.isInitialized) {
      return this.mockAnalyzeSEO(content);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('analyze-seo', {
        body: {
          articleId,
          content,
          targetKeywords
        }
      });

      if (error) throw error;

      return { success: true, analysis: data.analysis };

    } catch (error) {
      console.error('SEO分析エラー:', error);
      throw error;
    }
  }

  /**
   * 品質チェック実行
   * 2つのシグネチャをサポート：
   * 1. checkQuality(articleId, content, title) - 従来の呼び出し
   * 2. checkQuality(article) - ContentGeneratorからの呼び出し
   */
  async checkQuality(articleIdOrArticle, content, title) {
    // 引数が1つでオブジェクトの場合、articleオブジェクトとして扱う
    let articleId, articleContent, articleTitle;

    if (typeof articleIdOrArticle === 'object' && articleIdOrArticle !== null) {
      // ContentGeneratorからの呼び出し: checkQuality(article)
      const article = articleIdOrArticle;
      articleId = article.id;
      articleContent = article.content;
      articleTitle = article.title;
    } else {
      // 従来の呼び出し: checkQuality(articleId, content, title)
      articleId = articleIdOrArticle;
      articleContent = content;
      articleTitle = title;
    }

    if (!this.isInitialized) {
      return this.mockCheckQuality(articleContent, articleTitle);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('check-quality', {
        body: {
          articleId,
          content: articleContent,
          title: articleTitle
        }
      });

      if (error) throw error;

      return {
        success: true,
        quality: data.quality,
        newStatus: data.newStatus
      };

    } catch (error) {
      console.error('品質チェックエラー:', error);
      throw error;
    }
  }

  /**
   * リアルタイム更新の設定
   */
  setupRealtimeSubscription() {
    if (!this.isInitialized || !this.supabase) return;

    // 既存のチャンネルがあればクリーンアップ
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
    }

    // リアルタイム更新のサブスクライブ
    this.realtimeChannel = this.supabase
      .channel('generation_progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_logs'
        },
        (payload) => {
          this.handleProgressUpdate(payload.new);
        }
      )
      .subscribe();

  }

  /**
   * 進捗更新ハンドラ
   */
  handleProgressUpdate(logData) {
    if (!logData.total_articles) return;

    const progressPercentage = (logData.current_article / logData.total_articles) * 100;

    // UI更新（グローバルイベント発火）
    window.dispatchEvent(new CustomEvent('article-generation-progress', {
      detail: {
        current: logData.current_article,
        total: logData.total_articles,
        percentage: progressPercentage,
        status: logData.status
      }
    }));


    if (logData.status === 'completed') {
      console.log('✅ 記事生成が完了しました');
    } else if (logData.status === 'failed') {
      console.error('❌ 記事生成が失敗しました:', logData.error_message);
    }
  }

  /**
   * 記事一覧取得
   */
  async getArticles(projectId) {
    if (!this.isInitialized) {
      return { success: true, articles: [] };
    }

    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { success: true, articles: data };

    } catch (error) {
      console.error('記事取得エラー:', error);
      throw error;
    }
  }

  // ===========================================
  // モックモード用メソッド
  // ===========================================

  mockCreateProject(projectData) {
    const mockProjectId = 'mock-' + Date.now();
    this.currentProjectId = mockProjectId;

    return {
      success: true,
      projectId: mockProjectId,
      data: { id: mockProjectId, ...projectData }
    };
  }

  /**
   * モック構造生成
   */
  mockGenerateStructure(theme) {
    const pillarPage = {
      title: `${theme}完全ガイド`,
      summary: `${theme}に関する包括的なガイドです。基本概念から実践的な手法まで、${theme}のすべてを網羅しています。`,
      content: '',
      internalLinks: []
    };

    const clusterPageTitles = [
      `${theme}の基本概念と重要性`,
      `${theme}を始めるための準備`,
      `${theme}の効果的な戦略`,
      `${theme}のベストプラクティス`,
      `${theme}でよくある間違いと対策`,
      `${theme}の成功事例と分析`,
      `${theme}の最新トレンド`,
      `${theme}のツールと技術`,
      `${theme}の測定と改善方法`,
      `${theme}の将来展望`
    ];

    const clusterPages = clusterPageTitles.map((title, index) => ({
      id: `cluster-${index + 1}`,
      title: title,
      summary: `${title}について詳しく解説します。`,
      wordCount: 0,
      qualityStatus: '未生成'
    }));

    return { pillarPage, clusterPages };
  }

  /**
   * モック見出し生成
   */
  mockGenerateHeadings(pageTitle) {
    const baseHeadings = [
      '概要と重要性',
      '基本的な考え方',
      '実践的な手法',
      '成功のポイント'
    ];

    const headings = baseHeadings.map((heading, index) => ({
      id: `h${index + 1}`,
      text: `${heading}`,
      level: 2
    }));

    return { headings };
  }

  /**
   * モック記事生成
   */
  mockGenerateArticle(title, headings, targetWordCount) {
    const wordCount = targetWordCount || 2000;

    // シンプルなモックコンテンツ生成
    const paragraphs = [
      `${title}は、現代のビジネス環境において重要な要素の一つです。`,
      'この分野における基本的な理解を深めることで、より効果的な戦略を立てることができます。',
      '実践的なアプローチを通じて、具体的な成果を上げることが可能になります。',
      '多くの企業がこの手法を採用し、顕著な改善を実現しています。',
      '継続的な学習と改善により、長期的な成功を収めることができるでしょう。'
    ];

    let content = '';
    let currentWordCount = 0;

    while (currentWordCount < wordCount) {
      const paragraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
      content += paragraph + '\n\n';
      currentWordCount += paragraph.length;
    }

    return {
      content: content.trim(),
      wordCount: content.length
    };
  }

  /**
   * モックピラーページ生成
   */
  mockGeneratePillarPage(clusterPages) {
    let content = '# 包括的ガイド\n\n';
    content += 'このガイドでは、以下のトピックについて詳しく解説します。\n\n';

    const internalLinks = [];

    clusterPages.forEach((page, index) => {
      content += `## ${index + 1}. ${page.title}\n\n`;
      content += `${page.summary || page.title + 'について詳しく解説します。'}\n\n`;

      internalLinks.push({
        title: page.title,
        url: `#${page.id}`,
        description: page.summary || ''
      });
    });

    content += '## まとめ\n\n';
    content += 'これらの要素を組み合わせることで、効果的な戦略を構築できます。';

    return {
      content,
      internalLinks,
      wordCount: content.length
    };
  }

  mockGenerateArticles(projectData) {
    const mockArticles = projectData.clusterPages.map((title, index) => ({
      id: `mock-article-${index}`,
      title,
      content: `# ${title}\n\nこれはモック記事です。実際の記事生成にはSupabaseとAI APIの設定が必要です。`,
      word_count: 500,
      ai_provider: 'mock',
      generation_time: 5,
      status: 'completed'
    }));

    // 進捗イベントをシミュレート
    projectData.clusterPages.forEach((_, index) => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('article-generation-progress', {
          detail: {
            current: index + 1,
            total: projectData.clusterPages.length,
            percentage: ((index + 1) / projectData.clusterPages.length) * 100,
            status: index + 1 === projectData.clusterPages.length ? 'completed' : 'in_progress'
          }
        }));
      }, (index + 1) * 1000);
    });

    return {
      success: true,
      projectId: this.currentProjectId,
      articles: mockArticles
    };
  }

  mockAnalyzeSEO(content) {
    return {
      success: true,
      analysis: {
        keyword_density: { 'SEO': 2.5, 'マーケティング': 1.8 },
        readability_score: 75,
        heading_structure: { h2Count: 3, h3Count: 5, hasProperStructure: true },
        internal_links: { totalLinks: 2, internalLinkCount: 1 },
        suggestions: ['内部リンクを追加しましょう'],
        overall_score: 78
      }
    };
  }

  mockCheckQuality(content, title) {
    return {
      success: true,
      quality: {
        overallScore: 82,
        checks: {
          contentQuality: { score: 85, status: 'good', details: '文字数: 2000文字' },
          structure: { score: 80, status: 'good', details: 'H2: 3個、H3: 5個' },
          grammar: { score: 90, status: 'excellent', details: '平均文長: 25文字' },
          seo: { score: 75, status: 'good', details: 'タイトル長: 35文字' },
          readability: { score: 80, status: 'good', details: '漢字率: 25%' }
        },
        issues: [],
        suggestions: ['内部リンクを追加しましょう']
      },
      newStatus: 'approved'
    };
  }

  // ===========================================
  // 画像生成機能
  // ===========================================

  /**
   * 記事の画像生成
   */
  async generateImages(articleId, title, content, options = {}) {
    const {
      generateHero = true,
      generateIllustrations = true,
      illustrationCount = 3,
      provider = 'auto'
    } = options;

    if (!this.isInitialized) {
      return this.mockGenerateImages(title, illustrationCount);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('generate-images', {
        body: {
          articleId,
          title,
          content,
          generateHero,
          generateIllustrations,
          illustrationCount,
          provider
        }
      });

      if (error) throw error;

      return {
        success: true,
        images: data.images,
        totalCost: data.totalCost,
        provider: data.provider
      };

    } catch (error) {
      console.error('画像生成エラー:', error);
      throw error;
    }
  }

  /**
   * 記事に画像を挿入
   */
  insertImagesToArticle(content, images) {
    let updatedContent = content;

    // ヒーロー画像を先頭に挿入
    const heroImage = images.find(img => img.type === 'hero');
    if (heroImage) {
      const heroMarkdown = `![${heroImage.altText}](${heroImage.url})\n\n`;
      updatedContent = heroMarkdown + updatedContent;
    }

    // 説明画像をセクション間に挿入
    const illustrations = images.filter(img => img.type === 'illustration').sort((a, b) => a.position - b.position);
    const sections = updatedContent.split(/^(##[^#].*?)$/gm);

    illustrations.forEach((img, index) => {
      // セクションの後に画像を挿入
      const targetSectionIndex = (index + 1) * 2 + 1; // H2セクションの後
      if (sections[targetSectionIndex]) {
        const imageMarkdown = `\n\n![${img.altText}](${img.url})\n\n`;
        sections[targetSectionIndex] = sections[targetSectionIndex] + imageMarkdown;
      }
    });

    return sections.join('');
  }

  /**
   * プロジェクトの全記事に画像を生成
   */
  async generateImagesForProject(articles, options = {}) {
    const results = [];
    let totalCost = 0;

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      try {

        const result = await this.generateImages(
          article.id,
          article.title,
          article.content,
          options
        );

        results.push({
          articleId: article.id,
          title: article.title,
          ...result
        });

        totalCost += result.totalCost;

        // 進捗イベント発火
        window.dispatchEvent(new CustomEvent('image-generation-progress', {
          detail: {
            current: i + 1,
            total: articles.length,
            percentage: ((i + 1) / articles.length) * 100,
            currentArticle: article.title,
            totalCost
          }
        }));

        // レート制限対策（2秒待機）
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`画像生成失敗: ${article.title}`, error);
        results.push({
          articleId: article.id,
          title: article.title,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      results,
      totalCost
    };
  }

  /**
   * 月間画像生成コスト取得
   */
  async getMonthlyImageCost() {
    if (!this.isInitialized) {
      return { success: true, cost: 0 };
    }

    try {
      const { data, error } = await this.supabase.rpc('get_monthly_image_cost');

      if (error) throw error;

      return { success: true, cost: parseFloat(data || 0) };

    } catch (error) {
      console.error('コスト取得エラー:', error);
      return { success: false, cost: 0 };
    }
  }

  // ===========================================
  // モックモード用メソッド（画像生成）
  // ===========================================

  mockGenerateImages(title, illustrationCount) {
    const images = [];

    // ヒーロー画像（モック）
    images.push({
      type: 'hero',
      url: 'https://via.placeholder.com/1024x1792/ff7a59/ffffff?text=Hero+Image',
      prompt: `Hero image for "${title}"`,
      provider: 'mock',
      cost: 0,
      width: 1024,
      height: 1792,
      altText: `${title}のヒーロー画像`
    });

    // 説明画像（モック）
    for (let i = 0; i < illustrationCount; i++) {
      images.push({
        type: 'illustration',
        url: `https://via.placeholder.com/1024x1024/33475b/ffffff?text=Illustration+${i + 1}`,
        prompt: `Illustration ${i + 1}`,
        provider: 'mock',
        cost: 0,
        width: 1024,
        height: 1024,
        altText: `説明画像 ${i + 1}`,
        position: i + 1
      });
    }

    // 進捗をシミュレート
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('image-generation-complete', {
        detail: { images, totalCost: 0 }
      }));
    }, 2000);

    return {
      success: true,
      images,
      totalCost: 0,
      provider: 'mock'
    };
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

// グローバルインスタンス作成
window.supabaseIntegration = new SupabaseIntegration();

// ページロード時に初期化
document.addEventListener('DOMContentLoaded', async () => {
  const success = await window.supabaseIntegration.initialize();

  if (success) {
    console.log('✅ Supabase統合が初期化されました');
  } else {
    console.error('❌ Supabase統合の初期化に失敗しました');
  }
});

// ページアンロード時にクリーンアップ
window.addEventListener('beforeunload', () => {
  window.supabaseIntegration.cleanup();
});
