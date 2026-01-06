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
    this.performanceMonitor = window.performanceMonitor; // パフォーマンス監視
    this.resourceManager = window.resourceManager; // リソース管理
  }

  /**
   * Supabaseクライアントを初期化
   */
  async initialize() {
    try {
      console.log('🔧 Supabase統合を初期化中...');

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

      console.log('🔗 Supabaseクライアントを作成中...');
      console.log('📍 URL:', window.SUPABASE_CONFIG.url);
      console.log('🔑 Anon Key:', window.SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');

      // Supabaseクライアント作成
      this.supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );

      // 接続テスト - より安全な方法でテーブルの存在を確認
      console.log('🧪 接続テストを実行中...');
      try {
        const { error } = await this.supabase.from('projects').select('count', { count: 'exact', head: true });

        if (error) {
          // テーブルが存在しない場合やアクセス権限がない場合
          if (error.code === 'PGRST205' || error.code === '42P01') {
            console.error('❌ Supabaseテーブルが存在しません:', error.message);
            console.error('💡 マイグレーションを実行してください: supabase db push');
            return false;
          }
          // その他のエラーは警告として扱い、接続は成功とみなす
          console.warn('⚠️ Supabase接続テスト警告:', error.message);
          console.warn('⚠️ エラーコード:', error.code);
        } else {
          console.log('✅ Supabaseテーブル接続成功');
        }
      } catch (connectionError) {
        console.error('❌ Supabase接続エラー:', connectionError);
        return false;
      }

      this.isInitialized = true;

      // リアルタイム更新の設定
      this.setupRealtimeSubscription();

      console.log('✅ Supabase統合が初期化されました');
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
      const { error } = await this.supabase
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
   * Supabase統合が設定済みかチェック（強化版）
   * ContentGeneratorから呼び出される
   * 要件: 3.5
   */
  async isConfigured() {
    try {
      // 初期化状態の確認
      if (!this.isInitialized) {
        console.log('🔄 Supabase未初期化のため、初期化を試行します');
        const initResult = await this.initialize();
        if (!initResult) {
          console.log('🔄 初期化失敗、モックモードを使用します');
          return false;
        }
      }

      // 設定値の詳細チェック
      if (!this.validateConfiguration()) {
        console.log('🔄 設定が不完全のため、モックモードを使用します');
        return false;
      }

      // 実際の接続テスト
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.log('🔄 接続テスト失敗、モックモードを使用します:', connectionTest.message);
        return false;
      }

      console.log('✅ Supabase設定完了、AI生成モードを使用します');
      return true;

    } catch (error) {
      console.error('❌ 設定確認エラー:', error);
      console.log('🔄 エラーのため、モックモードを使用します');
      return false;
    }
  }

  /**
   * 設定値の詳細検証
   */
  validateConfiguration() {
    try {
      // 基本設定の存在確認
      if (!window.SUPABASE_CONFIG) {
        console.warn('⚠️ SUPABASE_CONFIGが定義されていません');
        return false;
      }

      const config = window.SUPABASE_CONFIG;

      // URL検証
      if (!config.url || typeof config.url !== 'string') {
        console.warn('⚠️ Supabase URLが設定されていません');
        return false;
      }

      if (config.url.includes('your-project-ref') || config.url === 'https://your-project.supabase.co') {
        console.warn('⚠️ Supabase URLがデフォルト値のままです');
        return false;
      }

      // URL形式の検証
      try {
        const urlObj = new URL(config.url);
        if (!urlObj.hostname.includes('supabase.co')) {
          console.warn('⚠️ 無効なSupabase URL形式です');
          return false;
        }
      } catch (urlError) {
        console.warn('⚠️ Supabase URLの形式が不正です:', urlError.message);
        return false;
      }

      // Anon Key検証
      if (!config.anonKey || typeof config.anonKey !== 'string') {
        console.warn('⚠️ Supabase Anon Keyが設定されていません');
        return false;
      }

      if (config.anonKey.includes('your-anon-key') || config.anonKey.length < 100) {
        console.warn('⚠️ Supabase Anon Keyがデフォルト値または無効です');
        return false;
      }

      // Supabase SDKの存在確認
      if (typeof window.supabase === 'undefined') {
        console.warn('⚠️ Supabase SDKが読み込まれていません');
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ 設定検証エラー:', error);
      return false;
    }
  }

  /**
   * 自動モード切り替え機能
   * 設定状態に応じて自動的にAI生成またはモック生成を選択
   */
  async getOperationMode() {
    const isConfigured = await this.isConfigured();

    const mode = {
      type: isConfigured ? 'ai' : 'mock',
      description: isConfigured ? 'AI生成モード（Supabase + AI API）' : 'モック生成モード（ローカル生成）',
      capabilities: {
        articleGeneration: true,
        structureGeneration: true,
        headingsGeneration: true,
        qualityCheck: true,
        seoAnalysis: isConfigured,
        realTimeProgress: isConfigured,
        dataStorage: isConfigured
      }
    };

    console.log(`🔧 動作モード: ${mode.description}`);
    return mode;
  }

  /**
   * モック生成の安定性向上
   * より現実的なモックデータを生成
   */
  generateRealisticMockContent(title, targetWordCount = 2000) {
    const templates = {
      introduction: [
        `${title}について詳しく解説します。`,
        `この記事では、${title}の重要なポイントを説明します。`,
        `${title}を理解するために、基本的な概念から始めましょう。`
      ],
      body: [
        '現代のビジネス環境において、この分野の理解は不可欠です。',
        '実践的なアプローチを通じて、具体的な成果を上げることができます。',
        '多くの企業がこの手法を採用し、顕著な改善を実現しています。',
        '効果的な戦略を立てるためには、基本原則を理解することが重要です。',
        '継続的な改善により、長期的な成功を収めることができます。',
        '最新のトレンドを把握し、適切に対応することが求められます。',
        '専門知識を活用して、競争優位性を確立しましょう。',
        'データに基づいた意思決定により、リスクを最小化できます。'
      ],
      conclusion: [
        'これらの要素を組み合わせることで、効果的な戦略を構築できます。',
        '継続的な学習と実践により、さらなる成果が期待できます。',
        '今後も最新の動向に注目し、適切に対応していくことが重要です。'
      ]
    };

    let content = '';
    let currentWordCount = 0;

    // 導入部
    const intro = templates.introduction[Math.floor(Math.random() * templates.introduction.length)];
    content += intro + '\n\n';
    currentWordCount += intro.length;

    // 本文（目標文字数の80%まで）
    const targetBodyCount = targetWordCount * 0.8;
    while (currentWordCount < targetBodyCount) {
      const paragraph = templates.body[Math.floor(Math.random() * templates.body.length)];
      content += paragraph + '\n\n';
      currentWordCount += paragraph.length;
    }

    // 結論部
    const conclusion = templates.conclusion[Math.floor(Math.random() * templates.conclusion.length)];
    content += conclusion + '\n\n';
    currentWordCount += conclusion.length;

    return {
      content: content.trim(),
      wordCount: currentWordCount,
      generatedAt: new Date().toISOString(),
      provider: 'mock-enhanced'
    };
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
      const data = await this.callEdgeFunctionWithRetry('generate-article', {
        theme: projectData.theme,
        headings: projectData.clusterPages,
        settings: {
          ...projectData.settings,
          projectId: projectResult.projectId,
          targetLength: projectData.settings?.targetLength || 2000,
          targetAudience: projectData.settings?.targetAudience || '一般ユーザー',
          tone: projectData.settings?.tone || 'です・ます調'
        }
      });

      return {
        success: true,
        projectId: projectResult.projectId,
        articles: data.articles
      };

    } catch (error) {
      console.error('記事生成エラー:', error);

      // エラーログを記録
      if (this.currentProjectId) {
        try {
          await this.supabase
            .from('generation_logs')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('project_id', this.currentProjectId);
        } catch (logError) {
          console.error('エラーログ記録失敗:', logError);
        }
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
      console.log('🔄 Supabase未初期化のため、モック生成を使用');
      return this.mockGenerateStructure(theme);
    }

    try {
      console.log('🚀 AI構造生成を開始:', theme);

      const data = await this.callEdgeFunctionWithRetry('generate-structure', {
        theme,
        settings: {
          clusterCount: 10,
          targetAudience: '一般ユーザー'
        }
      });

      console.log('✅ AI構造生成成功:', data);

      // レスポンス検証を追加
      const validatedResponse = this.validateStructureResponse(data);

      return {
        pillarPage: validatedResponse.pillarPage,
        clusterPages: validatedResponse.clusterPages
      };

    } catch (error) {
      console.error('❌ 構造生成エラー:', error);
      console.log('🔄 モック生成にフォールバック');
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
      const data = await this.callEdgeFunctionWithRetry('generate-headings', {
        pageTitle
      });

      // レスポンス検証を追加
      const validatedResponse = this.validateHeadingsResponse(data);

      return { headings: validatedResponse.headings };

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
      const response = await this.callEdgeFunctionWithRetry('generate-article', {
        title,
        headings: headings || [],
        targetWordCount: targetWordCount || 2000,
        settings: {
          tone: 'です・ます調',
          targetAudience: '一般ユーザー'
        }
      });

      return this.validateArticleResponse(response);

    } catch (error) {
      console.error('記事生成エラー:', error);
      return this.mockGenerateArticle(title, headings, targetWordCount);
    }
  }

  /**
   * Edge Function呼び出し（リトライ付き）
   */
  async callEdgeFunctionWithRetry(functionName, params, maxRetries = 3) {
    // パフォーマンス監視付きで実行
    return await this.performanceMonitor.trackOperation(`Edge Function: ${functionName}`, async () => {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await this.supabase.functions.invoke(functionName, {
            body: params
          });

          if (error) throw error;
          return data;

        } catch (error) {
          lastError = error;
          console.warn(`Edge Function呼び出し失敗 (試行 ${attempt}/${maxRetries}):`, error);

          if (attempt < maxRetries) {
            await this.delay(1000 * attempt); // 指数バックオフ
          }
        }
      }

      throw lastError;
    }, { timeout: 45000 }); // 45秒タイムアウト
  }

  /**
   * レスポンス検証機能（強化版）
   * 要件: 3.3, 7.2
   */
  validateArticleResponse(response) {
    try {
      // 基本的なレスポンス形式チェック
      if (!response || typeof response !== 'object') {
        throw new Error('無効なレスポンス形式: レスポンスがオブジェクトではありません');
      }

      // 必須フィールドの検証
      if (!response.content || typeof response.content !== 'string') {
        throw new Error('記事コンテンツが不正: contentフィールドが文字列ではありません');
      }

      // コンテンツの最小長チェック
      if (response.content.trim().length < 100) {
        throw new Error('記事コンテンツが短すぎます: 最低100文字必要です');
      }

      // 文字数の検証と計算
      let wordCount = response.wordCount;
      if (!wordCount || typeof wordCount !== 'number' || wordCount <= 0) {
        wordCount = response.content.length;
        console.warn('⚠️ wordCountが不正のため、content.lengthを使用します');
      }

      // 文字数の妥当性チェック
      const actualLength = response.content.length;
      const wordCountDifference = Math.abs(wordCount - actualLength);
      if (wordCountDifference > actualLength * 0.1) { // 10%以上の差異は警告
        console.warn(`⚠️ wordCountとcontent.lengthに大きな差異があります: ${wordCount} vs ${actualLength}`);
      }

      // 成功フラグの検証
      if (Object.prototype.hasOwnProperty.call(response, 'success') && response.success !== true) {
        throw new Error(`記事生成が失敗しました: ${response.error || '不明なエラー'}`);
      }

      // エラー情報の検証
      if (response.error) {
        throw new Error(`記事生成エラー: ${response.error}`);
      }

      // 統一されたレスポンス形式で返す
      const validatedResponse = {
        content: response.content.trim(),
        wordCount: wordCount,
        success: true,
        generatedAt: response.generatedAt || new Date().toISOString(),
        aiProvider: response.aiProvider || response.provider || 'unknown'
      };

      // オプショナルフィールドの追加
      if (response.generationTime && typeof response.generationTime === 'number') {
        validatedResponse.generationTime = response.generationTime;
      }

      if (response.title && typeof response.title === 'string') {
        validatedResponse.title = response.title;
      }

      if (response.headings && Array.isArray(response.headings)) {
        validatedResponse.headings = response.headings;
      }

      return validatedResponse;

    } catch (error) {
      // エラーログ記録
      console.error('❌ レスポンス検証エラー:', error.message);
      console.error('❌ 検証対象レスポンス:', response);

      // 統一されたエラー形式で再スロー
      const validationError = new Error(`レスポンス検証失敗: ${error.message}`);
      validationError.code = 'RESPONSE_VALIDATION_ERROR';
      validationError.originalResponse = response;
      throw validationError;
    }
  }

  /**
   * 構造生成レスポンス検証
   */
  validateStructureResponse(response) {
    try {
      if (!response || typeof response !== 'object') {
        throw new Error('無効な構造レスポンス形式');
      }

      // ピラーページの検証
      if (!response.pillarPage || typeof response.pillarPage !== 'object') {
        throw new Error('pillarPageが不正です');
      }

      if (!response.pillarPage.title || typeof response.pillarPage.title !== 'string') {
        throw new Error('pillarPage.titleが不正です');
      }

      // クラスターページの検証
      if (!response.clusterPages || !Array.isArray(response.clusterPages)) {
        throw new Error('clusterPagesが配列ではありません');
      }

      if (response.clusterPages.length === 0) {
        throw new Error('clusterPagesが空です');
      }

      // 各クラスターページの検証
      response.clusterPages.forEach((page, index) => {
        if (!page || typeof page !== 'object') {
          throw new Error(`clusterPages[${index}]が不正です`);
        }

        if (!page.title || typeof page.title !== 'string') {
          throw new Error(`clusterPages[${index}].titleが不正です`);
        }

        if (!page.id) {
          page.id = `cluster-${index + 1}`;
        }
      });

      return {
        pillarPage: response.pillarPage,
        clusterPages: response.clusterPages,
        success: true,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ 構造レスポンス検証エラー:', error.message);
      const validationError = new Error(`構造レスポンス検証失敗: ${error.message}`);
      validationError.code = 'STRUCTURE_VALIDATION_ERROR';
      throw validationError;
    }
  }

  /**
   * 見出しレスポンス検証
   */
  validateHeadingsResponse(response) {
    try {
      if (!response || typeof response !== 'object') {
        throw new Error('無効な見出しレスポンス形式');
      }

      if (!response.headings || !Array.isArray(response.headings)) {
        throw new Error('headingsが配列ではありません');
      }

      // 各見出しの検証
      response.headings.forEach((heading, index) => {
        if (!heading || typeof heading !== 'object') {
          throw new Error(`headings[${index}]が不正です`);
        }

        if (!heading.text || typeof heading.text !== 'string') {
          throw new Error(`headings[${index}].textが不正です`);
        }

        if (!heading.level || typeof heading.level !== 'number' || heading.level < 1 || heading.level > 6) {
          throw new Error(`headings[${index}].levelが不正です（1-6の範囲で指定）`);
        }

        if (!heading.id) {
          heading.id = `h${index + 1}`;
        }
      });

      return {
        headings: response.headings,
        success: true,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ 見出しレスポンス検証エラー:', error.message);
      const validationError = new Error(`見出しレスポンス検証失敗: ${error.message}`);
      validationError.code = 'HEADINGS_VALIDATION_ERROR';
      throw validationError;
    }
  }

  /**
   * 遅延ユーティリティ
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      const data = await this.callEdgeFunctionWithRetry('generate-pillar-page', {
        clusterPages
      });

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
      const data = await this.callEdgeFunctionWithRetry('analyze-seo', {
        articleId,
        content,
        targetKeywords
      });

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
      const data = await this.callEdgeFunctionWithRetry('check-quality', {
        articleId,
        content: articleContent,
        title: articleTitle
      });

      return {
        success: true,
        quality: data.quality,
        newStatus: data.newStatus
      };

    } catch (error) {
      console.error('品質チェックエラー:', error);
      return this.mockCheckQuality(articleContent, articleTitle);
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
    console.log(`モック見出し生成: ${pageTitle}`);

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
   * モック記事生成（強化版）
   */
  mockGenerateArticle(title, headings, targetWordCount) {
    const mockData = this.generateRealisticMockContent(title, targetWordCount || 2000);

    return {
      content: mockData.content,
      wordCount: mockData.wordCount,
      success: true,
      generatedAt: mockData.generatedAt,
      aiProvider: mockData.provider
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
    console.log(`モックSEO分析: ${content.substring(0, 50)}...`);

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
    console.log(`モック品質チェック: ${title} (${content.length}文字)`);

    return {
      success: true,
      quality: {
        overallScore: 82,
        checks: {
          contentQuality: { score: 85, status: 'good', details: `文字数: ${content.length}文字` },
          structure: { score: 80, status: 'good', details: 'H2: 3個、H3: 5個' },
          grammar: { score: 90, status: 'excellent', details: '平均文長: 25文字' },
          seo: { score: 75, status: 'good', details: `タイトル長: ${title.length}文字` },
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
      const data = await this.callEdgeFunctionWithRetry('generate-images', {
        articleId,
        title,
        content,
        generateHero,
        generateIllustrations,
        illustrationCount,
        provider
      });

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
      const data = await this.supabase.rpc('get_monthly_image_cost');

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

// 手動初期化用（index.htmlから呼び出される）
// 自動初期化は削除して、index.htmlから制御する

// ページアンロード時にクリーンアップ
window.addEventListener('beforeunload', () => {
  window.supabaseIntegration.cleanup();
});
