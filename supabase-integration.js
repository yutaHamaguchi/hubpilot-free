// ===========================================
// HubPilot Free - Supabase Integration Layer
// ===========================================

/**
 * Supabase統合クラス
 * フロントエンドとSupabaseバックエンドの通信を管理
 */
class SupabaseIntegration {
  constructor() {
    this.supabase = null
    this.currentProjectId = null
    this.realtimeChannel = null
    this.isInitialized = false
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
        console.warn('⚠️ Supabase設定が不完全です。モックモードで動作します。')
        return false
      }

      // 設定値がデフォルトのままかチェック
      if (window.SUPABASE_CONFIG.url.includes('your-project-ref') ||
          window.SUPABASE_CONFIG.anonKey.includes('your-anon-key')) {
        console.warn('⚠️ Supabase設定がデフォルトのままです。モックモードで動作します。')
        return false
      }

      // Supabase SDKが読み込まれているかチェック
      if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase SDKが読み込まれていません')
        return false
      }

      // Supabaseクライアント作成
      this.supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      )

      // 接続テスト
      const { error } = await this.supabase.from('projects').select('count', { count: 'exact', head: true })

      if (error && error.code !== 'PGRST116') { // PGRST116 = テーブルが空（正常）
        console.error('❌ Supabase接続エラー:', error)
        return false
      }

      this.isInitialized = true
      console.log('✅ Supabase接続成功')

      // リアルタイム更新の設定
      this.setupRealtimeSubscription()

      return true

    } catch (error) {
      console.error('❌ Supabase初期化エラー:', error)
      return false
    }
  }

  /**
   * 接続テスト
   */
  async testConnection() {
    if (!this.isInitialized) {
      const success = await this.initialize()
      if (!success) {
        return { success: false, message: 'Supabaseに接続できません（モックモード）' }
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('count', { count: 'exact', head: true })

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return { success: true, message: 'Supabase接続OK' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  /**
   * プロジェクト作成
   */
  async createProject(projectData) {
    if (!this.isInitialized) {
      console.log('📝 モックモード: プロジェクト作成をシミュレート')
      return this.mockCreateProject(projectData)
    }

    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          theme: projectData.theme,
          pillar_page: projectData.pillarPage,
          cluster_pages: projectData.clusterPages,
          headings: projectData.headings,
          settings: projectData.settings || {}
        })
        .select()
        .single()

      if (error) throw error

      this.currentProjectId = data.id

      // 生成ログ初期化
      await this.supabase
        .from('generation_logs')
        .insert({
          project_id: data.id,
          status: 'started',
          total_articles: projectData.clusterPages?.length || 0,
          current_article: 0
        })

      return { success: true, projectId: data.id, data }

    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
      throw error
    }
  }

  /**
   * 記事生成（Edge Function呼び出し）
   */
  async generateArticles(projectData) {
    if (!this.isInitialized) {
      console.log('📝 モックモード: 記事生成をシミュレート')
      return this.mockGenerateArticles(projectData)
    }

    try {
      // プロジェクト作成
      const projectResult = await this.createProject(projectData)

      if (!projectResult.success) {
        throw new Error('プロジェクト作成に失敗しました')
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
      })

      if (error) throw error

      return {
        success: true,
        projectId: projectResult.projectId,
        articles: data.articles
      }

    } catch (error) {
      console.error('記事生成エラー:', error)

      // エラーログを記録
      if (this.currentProjectId) {
        await this.supabase
          .from('generation_logs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('project_id', this.currentProjectId)
      }

      throw error
    }
  }

  /**
   * SEO分析実行
   */
  async analyzeSEO(articleId, content, targetKeywords = []) {
    if (!this.isInitialized) {
      console.log('📝 モックモード: SEO分析をシミュレート')
      return this.mockAnalyzeSEO(content)
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('analyze-seo', {
        body: {
          articleId,
          content,
          targetKeywords
        }
      })

      if (error) throw error

      return { success: true, analysis: data.analysis }

    } catch (error) {
      console.error('SEO分析エラー:', error)
      throw error
    }
  }

  /**
   * 品質チェック実行
   */
  async checkQuality(articleId, content, title) {
    if (!this.isInitialized) {
      console.log('📝 モックモード: 品質チェックをシミュレート')
      return this.mockCheckQuality(content, title)
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('check-quality', {
        body: {
          articleId,
          content,
          title
        }
      })

      if (error) throw error

      return {
        success: true,
        quality: data.quality,
        newStatus: data.newStatus
      }

    } catch (error) {
      console.error('品質チェックエラー:', error)
      throw error
    }
  }

  /**
   * リアルタイム更新の設定
   */
  setupRealtimeSubscription() {
    if (!this.isInitialized || !this.supabase) return

    // 既存のチャンネルがあればクリーンアップ
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel)
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
          this.handleProgressUpdate(payload.new)
        }
      )
      .subscribe()

    console.log('🔔 リアルタイム更新を監視中...')
  }

  /**
   * 進捗更新ハンドラ
   */
  handleProgressUpdate(logData) {
    if (!logData.total_articles) return

    const progressPercentage = (logData.current_article / logData.total_articles) * 100

    // UI更新（グローバルイベント発火）
    window.dispatchEvent(new CustomEvent('article-generation-progress', {
      detail: {
        current: logData.current_article,
        total: logData.total_articles,
        percentage: progressPercentage,
        status: logData.status
      }
    }))

    console.log(`📊 進捗: ${logData.current_article}/${logData.total_articles} (${Math.round(progressPercentage)}%)`)

    if (logData.status === 'completed') {
      console.log('✅ すべての記事生成が完了しました')
    } else if (logData.status === 'failed') {
      console.error('❌ 記事生成が失敗しました:', logData.error_message)
    }
  }

  /**
   * 記事一覧取得
   */
  async getArticles(projectId) {
    if (!this.isInitialized) {
      return { success: true, articles: [] }
    }

    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return { success: true, articles: data }

    } catch (error) {
      console.error('記事取得エラー:', error)
      throw error
    }
  }

  // ===========================================
  // モックモード用メソッド
  // ===========================================

  mockCreateProject(projectData) {
    const mockProjectId = 'mock-' + Date.now()
    this.currentProjectId = mockProjectId

    return {
      success: true,
      projectId: mockProjectId,
      data: { id: mockProjectId, ...projectData }
    }
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
    }))

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
        }))
      }, (index + 1) * 1000)
    })

    return {
      success: true,
      projectId: this.currentProjectId,
      articles: mockArticles
    }
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
    }
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
    }
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel)
      this.realtimeChannel = null
    }
  }
}

// グローバルインスタンス作成
window.supabaseIntegration = new SupabaseIntegration()

// ページロード時に初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Supabase統合を初期化中...')
  const success = await window.supabaseIntegration.initialize()

  if (success) {
    console.log('✅ Supabase統合の準備が完了しました')
  } else {
    console.log('⚠️ モックモードで動作します（Supabase未設定）')
  }
})

// ページアンロード時にクリーンアップ
window.addEventListener('beforeunload', () => {
  window.supabaseIntegration.cleanup()
})
