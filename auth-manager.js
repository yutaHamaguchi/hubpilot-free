// ===========================================
// HubPilot Free - Authentication Manager
// ===========================================

/**
 * 認証管理クラス
 * Supabase Authを使用したユーザー認証を管理
 */
class AuthManager {
  constructor() {
    this.supabase = null
    this.currentUser = null
    this.isAuthenticated = false
    this.isGuest = false
    this.authMode = 'loading' // 'loading', 'authenticated', 'guest', 'unauthenticated'

    // 初期化は非同期で行うため、readyPromiseを使用
    this.readyPromise = this.init()
  }

  /**
   * 初期化
   */
  async init() {
    try {
      // Supabase統合が初期化されるまで待機
      await this.waitForSupabase()

      if (!this.supabase) {
        console.warn('⚠️ Supabase未設定のため、ゲストモードで動作します')
        this.authMode = 'guest'
        this.isGuest = true
        return
      }

      // セッション復元
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        console.error('セッション復元エラー:', error)
        this.showAuthUI()
        return
      }

      if (session) {
        this.currentUser = session.user
        this.isAuthenticated = true
        this.authMode = 'authenticated'
        console.log('✅ ユーザーセッション復元:', session.user.email)
        this.showMainApp()

        // ユーザープロファイルの確認・作成
        await this.ensureUserProfile()
      } else {
        this.authMode = 'unauthenticated'
        console.log('📝 認証が必要です - 認証画面を表示')
        this.showAuthUI()
      }

      // 認証状態の変更を監視
      this.setupAuthListener()

    } catch (error) {
      console.error('認証初期化エラー:', error)
      this.authMode = 'guest'
      this.isGuest = true
    }
  }

  /**
   * Supabase統合の初期化を待機
   */
  async waitForSupabase() {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      if (window.supabaseIntegration?.supabase) {
        this.supabase = window.supabaseIntegration.supabase
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    console.warn('Supabase統合が見つかりません')
  }

  /**
   * 認証状態変更の監視
   */
  setupAuthListener() {
    if (!this.supabase) return

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 認証状態変更:', event)

      switch (event) {
        case 'SIGNED_IN':
          this.currentUser = session.user
          this.isAuthenticated = true
          this.authMode = 'authenticated'
          this.showMainApp()

          // LocalStorageデータの移行を提案
          await this.promptDataMigration()
          break

        case 'SIGNED_OUT':
          this.currentUser = null
          this.isAuthenticated = false
          this.authMode = 'unauthenticated'
          this.showAuthUI()
          break

        case 'USER_UPDATED':
          this.currentUser = session.user
          break

        case 'PASSWORD_RECOVERY':
          this.showPasswordReset()
          break
      }
    })
  }

  /**
   * メール/パスワードで新規登録
   */
  async signUp(email, password, displayName = '') {
    if (!this.supabase) {
      throw new Error('Supabaseが設定されていません')
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      })

      if (error) throw error

      // メール確認が必要な場合
      if (data.user && !data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
          message: '確認メールを送信しました。メールをご確認ください。'
        }
      }

      return {
        success: true,
        requiresEmailConfirmation: false,
        user: data.user
      }

    } catch (error) {
      console.error('新規登録エラー:', error)
      throw error
    }
  }

  /**
   * メール/パスワードでログイン
   */
  async signIn(email, password) {
    if (!this.supabase) {
      throw new Error('Supabaseが設定されていません')
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return {
        success: true,
        user: data.user,
        session: data.session
      }

    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    }
  }

  /**
   * ソーシャルログイン（Google, GitHub等）
   */
  async signInWithProvider(provider) {
    if (!this.supabase) {
      throw new Error('Supabaseが設定されていません')
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: provider, // 'google', 'github', 'azure', etc.
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })

      if (error) throw error

      return {
        success: true,
        provider: provider
      }

    } catch (error) {
      console.error('ソーシャルログインエラー:', error)
      throw error
    }
  }

  /**
   * ログアウト
   */
  async signOut() {
    if (!this.supabase) return

    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error

      console.log('✅ ログアウト完了')

    } catch (error) {
      console.error('ログアウトエラー:', error)
      throw error
    }
  }

  /**
   * パスワードリセットメール送信
   */
  async sendPasswordResetEmail(email) {
    if (!this.supabase) {
      throw new Error('Supabaseが設定されていません')
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return {
        success: true,
        message: 'パスワードリセットメールを送信しました'
      }

    } catch (error) {
      console.error('パスワードリセットエラー:', error)
      throw error
    }
  }

  /**
   * ゲストモードで続行
   */
  continueAsGuest() {
    this.isGuest = true
    this.authMode = 'guest'
    console.log('👤 ゲストモードで続行')
    this.showMainApp()

    // 通知表示
    setTimeout(() => {
      if (window.app && window.app.notificationService) {
        window.app.notificationService.show(
          'ゲストモードで起動しました。データはブラウザのみに保存されます。',
          'info',
          5000
        )
      }
    }, 1000)
  }

  /**
   * 認証UIを表示
   */
  showAuthUI() {
    const authOverlay = document.getElementById('auth-overlay')
    const mainApp = document.getElementById('main-app')

    if (authOverlay) authOverlay.classList.remove('hidden')
    if (mainApp) mainApp.classList.add('hidden')
  }

  /**
   * メインアプリを表示
   */
  showMainApp() {
    const authOverlay = document.getElementById('auth-overlay')
    const mainApp = document.getElementById('main-app')

    if (authOverlay) authOverlay.classList.add('hidden')
    if (mainApp) mainApp.classList.remove('hidden')

    // メインアプリがまだ初期化されていない場合は初期化
    if (!window.app) {
      console.log('🎯 メインアプリケーションを初期化中...');
      try {
        window.app = new HubPilotApp();
        console.log('✅ メインアプリケーションの初期化完了');
      } catch (error) {
        console.error('❌ メインアプリケーションの初期化に失敗:', error);
      }
    }
  }

  /**
   * パスワードリセット画面を表示
   */
  showPasswordReset() {
    // パスワードリセットフォームの表示ロジック
    console.log('パスワードリセット画面を表示')
  }

  /**
   * ユーザープロファイルの確認・作成
   */
  async ensureUserProfile() {
    if (!this.supabase || !this.currentUser) return

    try {
      // プロファイルの取得
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // プロファイルが存在しない場合は作成（トリガーで自動作成されるはず）
        console.log('ユーザープロファイルを作成中...')
      } else if (error) {
        console.error('プロファイル取得エラー:', error)
      } else {
        console.log('✅ ユーザープロファイル:', data)
      }

    } catch (error) {
      console.error('プロファイル確認エラー:', error)
    }
  }

  /**
   * LocalStorageデータのクラウド移行を提案
   */
  async promptDataMigration() {
    const localData = localStorage.getItem('hubpilot_data')

    if (!localData) return

    try {
      const data = JSON.parse(localData)

      // データが存在する場合のみ提案
      if (data && (data.theme || data.articles?.length > 0)) {
        const migrate = confirm(
          'ローカルに保存されたプロジェクトデータが見つかりました。\n' +
          'クラウドに移行して、どのデバイスからもアクセスできるようにしますか？\n\n' +
          '※ 移行後、ローカルデータは削除されます。'
        )

        if (migrate) {
          await this.migrateLocalDataToCloud(data)
        }
      }
    } catch (error) {
      console.error('データ移行確認エラー:', error)
    }
  }

  /**
   * LocalStorageデータをクラウドに移行
   */
  async migrateLocalDataToCloud(data) {
    if (!this.supabase || !this.currentUser) return

    try {
      console.log('🔄 データ移行を開始...')

      // プロジェクトデータを作成
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .insert({
          user_id: this.currentUser.id,
          theme: data.theme || '',
          pillar_page: data.pillarPage || {},
          cluster_pages: data.clusterPages || [],
          headings: data.headings || {},
          settings: {}
        })
        .select()
        .single()

      if (projectError) throw projectError

      console.log('✅ プロジェクトを移行しました:', project.id)

      // 記事データがあれば移行
      if (data.articles && data.articles.length > 0) {
        const articles = data.articles.map(article => ({
          project_id: project.id,
          title: article.title,
          content: article.content,
          status: article.status || 'draft',
          word_count: article.wordCount || 0
        }))

        const { error: articlesError } = await this.supabase
          .from('articles')
          .insert(articles)

        if (articlesError) throw articlesError

        console.log(`✅ ${articles.length}件の記事を移行しました`)
      }

      // 移行成功後、LocalStorageをクリア
      localStorage.removeItem('hubpilot_data')
      localStorage.removeItem('hubpilot_backup_1')
      localStorage.removeItem('hubpilot_backup_2')
      localStorage.removeItem('hubpilot_backup_3')
      localStorage.removeItem('hubpilot_backup_4')
      localStorage.removeItem('hubpilot_backup_5')

      if (window.app) {
        window.app.showNotification(
          'データ移行が完了しました！クラウドに保存されています。',
          'success'
        )
      }

      // ページをリロードして新しいデータを読み込む
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('データ移行エラー:', error)
      if (window.app) {
        window.app.showNotification(
          `データ移行に失敗しました: ${error.message}`,
          'error'
        )
      }
    }
  }

  /**
   * 現在のユーザー情報を取得
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * 認証状態を取得
   */
  isUserAuthenticated() {
    return this.isAuthenticated
  }

  /**
   * ゲストモードかどうか
   */
  isGuestMode() {
    return this.isGuest
  }

  /**
   * 認証モードを取得
   */
  getAuthMode() {
    return this.authMode
  }
}

// グローバルインスタンス作成
window.authManager = new AuthManager()

// 認証マネージャーの準備完了を待つヘルパー
window.waitForAuth = () => window.authManager.readyPromise

console.log('🔐 認証マネージャーを初期化中...')
